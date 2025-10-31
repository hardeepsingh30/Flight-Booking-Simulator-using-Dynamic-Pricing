
# ==========================
# ✅ MILESTONE 2 (EXISTING)
# ==========================

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Depends, Query, APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
import asyncio
import random
from fastapi import BackgroundTasks
from backend.email_utils import send_email_with_pdf
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import qrcode
import io, os

# SQLAlchemy setup (sqlite)
from sqlalchemy import create_engine, Column, Integer, String, DateTime, DECIMAL, ForeignKey, func, desc
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy.exc import SQLAlchemyError


DB_URL = "sqlite:///./flights.db"
engine = create_engine(DB_URL, connect_args={"check_same_thread": False}, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

# --- BACKGROUND SIMULATOR (same as before for Milestone 2) ---
async def simulator_loop(interval_seconds: int = 60):
    while True:
        await asyncio.sleep(interval_seconds)

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(simulator_loop(60))
    yield

app = FastAPI(title="Flight Booking Simulator", lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================
# ✅ DATABASE MODELS
# ==========================
class Airline(Base):
    __tablename__ = "airlines"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    tier = Column(String, default="standard")

class Flight(Base):
    __tablename__ = "flights"
    id = Column(Integer, primary_key=True)
    flight_no = Column(String, unique=True, nullable=False)
    airline_id = Column(Integer, ForeignKey("airlines.id"))
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    departure = Column(DateTime, nullable=False)
    arrival = Column(DateTime, nullable=False)
    base_fare = Column(DECIMAL(10,2), nullable=False)
    total_seats = Column(Integer, nullable=False)
    seats_available = Column(Integer, nullable=False)

    airline = relationship("Airline")


# ==========================
# ✅ MILESTONE 3 STARTS HERE
# ==========================
class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True)
    pnr = Column(String, unique=True)
    flight_id = Column(Integer, ForeignKey("flights.id"))
    passenger_name = Column(String, nullable=False)
    passenger_phone = Column(String)
    seat_no = Column(Integer)
    price_paid = Column(DECIMAL(10,2))
    status = Column(String, default="INITIATED")  # INITIATED, CONFIRMED, CANCELLED
    payment_status = Column(String, default="PENDING")  # PENDING, PAID, FAILED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FareHistory(Base):
    __tablename__ = "fare_history"
    id = Column(Integer, primary_key=True)
    flight_id = Column(Integer, ForeignKey("flights.id"))
    recorded_at = Column(DateTime, default=func.now())
    price = Column(DECIMAL(10,2))

Base.metadata.create_all(bind=engine)


# ==========================
# ✅ Pydantic Schemas
# ==========================
class Passenger(BaseModel):
    passenger_name: str = Field(..., min_length=3)
    passenger_phone: Optional[str]

class BookingRequest(BaseModel):
    flight_id: int
    passenger: Passenger
    seat_no: Optional[int] = None

class FlightOut(BaseModel):
    id: int
    flight_no: str
    origin: str
    destination: str
    departure: datetime
    arrival: datetime
    base_fare: float
    seats_available: int
    total_seats: int
    airline_name: Optional[str]

    class Config:
        from_attributes = True

class BookingDetails(BaseModel):
    pnr: str
    flight_no: str
    passenger_name: str
    passenger_phone: Optional[str]
    price_paid: float
    status: str
    payment_status: str
    departure: datetime
    arrival: datetime
    origin: str
    destination: str

    class Config:
        from_attributes = True

class BookingSummary(BaseModel):
    pnr: str
    flight_no: str
    passenger_name: str
    price_paid: float
    status: str
    payment_status: str
    origin: str
    destination: str
    departure: datetime

    class Config:
        from_attributes = True


# ==========================
# ✅ Dependency
# ==========================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================
# ✅ MILESTONE 2 EXISTING FLIGHT ENDPOINTS (UNCHANGED)
# ==========================
@app.get("/flights", response_model=List[FlightOut])
def list_flights(
    sort_by: Optional[str] = Query(None, pattern="^(price|duration)$"),
    limit: int = 20,
    db=Depends(get_db)
):
    q = db.query(Flight).join(Airline, isouter=True)
    flights = q.limit(limit).all()
    out = [
        FlightOut(
            id=f.id, flight_no=f.flight_no, origin=f.origin, destination=f.destination,
            departure=f.departure, arrival=f.arrival, base_fare=float(f.base_fare),
            seats_available=f.seats_available, total_seats=f.total_seats,
            airline_name=f.airline.name if f.airline else None
        )
        for f in flights
    ]

    if sort_by == "duration":
        out.sort(key=lambda x: (x.arrival - x.departure).total_seconds())
    elif sort_by == "price":
        out.sort(key=lambda x: x.base_fare)
    return out

# ==========================
# ✅ NEW MILESTONE 4 ENDPOINT: /search (for frontend integration)
# ==========================
@app.get("/search", response_model=List[FlightOut])
def search_flights(
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    date: Optional[str] = Query(None),  # format: YYYY-MM-DD
    limit: int = 20,
    db=Depends(get_db)
):
    """
    Smart search:
    - If user enters origin/destination/date, filters accordingly.
    - If user leaves all blank → returns next 20 upcoming flights (soonest departures).
    """
    query = db.query(Flight).join(Airline, isouter=True)

    # Filters only when user provides them
    if origin:
        query = query.filter(Flight.origin.ilike(f"%{origin}%"))
    if destination:
        query = query.filter(Flight.destination.ilike(f"%{destination}%"))
    if date:
        try:
            search_date = datetime.fromisoformat(date).date()
            query = query.filter(func.date(Flight.departure) == search_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # 🕒 Show only upcoming flights (departure after 'now')
    now = datetime.utcnow()
    query = query.filter(Flight.departure > now)

    # Default sort: earliest departure first
    query = query.order_by(Flight.departure.asc()).limit(limit)
    flights = query.all()

    # ✅ Convert to schema
    return [
        FlightOut(
            id=f.id,
            flight_no=f.flight_no,
            origin=f.origin,
            destination=f.destination,
            departure=f.departure,
            arrival=f.arrival,
            base_fare=float(f.base_fare),
            seats_available=f.seats_available,
            total_seats=f.total_seats,
            airline_name=f.airline.name if f.airline else None
        )
        for f in flights
    ]


# Dynamic pricing function
def calculate_dynamic_price(base_fare: float, seats_available: int, total_seats: int, departure: datetime, demand_index: float, airline_tier: str) -> float:
    # seat factor: fewer seats => higher multiplier
    seat_pct = seats_available / total_seats if total_seats else 0
    seat_factor = (1 - seat_pct) * 0.6  # up to +60%

    # time factor: closer to departure => higher multiplier
    now = datetime.utcnow()
    hours_until = max((departure - now).total_seconds() / 3600, 0.0)
    if hours_until > 72:
        time_factor = 0.0
    elif hours_until > 24:
        time_factor = 0.05
    elif hours_until > 6:
        time_factor = 0.15
    else:
        time_factor = 0.35

    # demand factor: simulated demand index [0.0, 1.0]
    demand_factor = (demand_index - 0.5) * 0.5  # [-0.25, +0.25]

    # tier factor
    tier_map = {"budget": -0.05, "standard": 0.0, "premium": 0.08}
    tier_factor = tier_map.get(airline_tier, 0.0)

    multiplier = 1 + seat_factor + time_factor + demand_factor + tier_factor

    # clamp multiplier to reasonable bounds
    multiplier = max(0.6, min(multiplier, 3.0))

    return round(base_fare * multiplier, 2)

@app.get("/dynamic_price/{flight_id}")
def dynamic_price(flight_id: int, db=Depends(get_db)):
    f = db.query(Flight).filter(Flight.id == flight_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Flight not found")
    # Simulated demand index - in real app this would come from analytics/service
    demand_index = random.uniform(0.2, 0.9)

    airline_tier = f.airline.tier if f.airline else "standard"
    price = calculate_dynamic_price(
        float(f.base_fare), f.seats_available, f.total_seats, f.departure, demand_index, airline_tier
    )
    # optionally persist fare history
    fh = FareHistory(flight_id=f.id, price=price)
    db.add(fh); db.commit()
    return {"flight_id": f.id, "dynamic_price": price, "base_fare": float(f.base_fare), "seats_available": f.seats_available, "demand_index": round(demand_index,2)}

# Booking endpoint (transaction-safe)
class Passenger(BaseModel):
    passenger_name: str = Field(..., min_length=3)
    passenger_phone: Optional[str]

class BookingRequest(BaseModel):
    flight_id: int
    passenger: Passenger
    seat_no: Optional[int] = None

@app.get("/seat_price/{flight_id}")
def get_seat_price(flight_id: int, seat_no: str, db=Depends(get_db)):
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")

    base_price = float(flight.base_fare)

    # Determine seat type
    col = seat_no[0].upper()
    row = int(seat_no[1:])
    seat_type_multiplier = 1.0
    if col in ["A", "F"]:
        seat_type_multiplier = 1.15  # window
    elif col in ["C", "D"]:
        seat_type_multiplier = 1.10  # aisle

    # Determine class
    if row <= 5:
        class_multiplier = 1.6  # Business
        seat_class = "Business"
    elif row <= 10:
        class_multiplier = 2.2  # First
        seat_class = "First"
    else:
        class_multiplier = 1.0  # Economy
        seat_class = "Economy"

    total_price = round(base_price * seat_type_multiplier * class_multiplier, 2)

    return {
        "seat_no": seat_no,
        "base_fare": base_price,
        "final_price": total_price,
        "class": seat_class
    }

# ==========================
# ✅ NEW MILESTONE 3 ENDPOINT: /booking/initiate
# ==========================

@app.post("/booking/initiate")
def initiate_booking(req: BookingRequest, db=Depends(get_db)):
    try:
        flight = db.query(Flight).with_for_update().filter(Flight.id == req.flight_id).first()
        if not flight:
            raise HTTPException(status_code=404, detail="Flight not found")
        if flight.seats_available <= 0:
            raise HTTPException(status_code=400, detail="No seats available")

        demand_index = random.uniform(0.2, 0.9)
        airline_tier = flight.airline.tier if flight.airline else "standard"
        price = calculate_dynamic_price(
            float(flight.base_fare), flight.seats_available,
            flight.total_seats, flight.departure, demand_index, airline_tier
        )

        flight.seats_available -= 1
        pnr = f"PNR{random.randint(100000, 999999)}"

        booking = Booking(
            pnr=pnr,
            flight_id=flight.id,
            passenger_name=req.passenger.passenger_name,
            passenger_phone=req.passenger.passenger_phone,
            seat_no=req.seat_no,
            price_paid=price,
            status="INITIATED",
            payment_status="PENDING"
        )

        db.add(booking)
        db.commit()
        return {"message": "Booking initiated", "pnr": pnr, "price": price, "status": "INITIATED", "payment_status": "PENDING"}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ==========================
# ✅ NEW MILESTONE 3 ENDPOINT: /booking/pay/{pnr}
# ==========================
from pydantic import BaseModel

class PaymentRequest(BaseModel):
    success: bool

@app.post("/booking/pay/{pnr}")
def process_payment(pnr: str, req: PaymentRequest, db=Depends(get_db)):
    booking = db.query(Booking).filter(Booking.pnr == pnr).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # If already paid, prevent duplicate processing
    if booking.payment_status == "PAID":
        return {"message": "Booking already confirmed", "pnr": booking.pnr, "status": booking.status}

    if req.success:
        booking.payment_status = "PAID"
        booking.status = "CONFIRMED"
    else:
        booking.payment_status = "FAILED"
        # status stays INITIATED (user can retry payment later)

    db.commit()

    return {
        "message": "Payment processed",
        "pnr": booking.pnr,
        "status": booking.status,
        "payment_status": booking.payment_status
    }

@app.post("/booking/cancel/{pnr}")
def cancel_booking(pnr: str, db=Depends(get_db)):
    booking = db.query(Booking).filter(Booking.pnr == pnr).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status == "CANCELLED":
        return {"message": "Booking is already cancelled", "pnr": booking.pnr}

    # Restore seat if booking was valid (INITIATED or CONFIRMED)
    flight = db.query(Flight).filter(Flight.id == booking.flight_id).first()
    if flight and flight.seats_available < flight.total_seats:
        flight.seats_available += 1

    booking.status = "CANCELLED"
    
    db.commit()

    return {
        "message": "Booking cancelled",
        "pnr": booking.pnr,
        "status": booking.status,
        "payment_status": booking.payment_status
    }

@app.get("/booking/{pnr}", response_model=BookingDetails)
def get_booking_details(pnr: str, db=Depends(get_db)):
    booking = db.query(Booking).filter(Booking.pnr == pnr).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    flight = db.query(Flight).filter(Flight.id == booking.flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight linked to booking not found")

    return BookingDetails(
        pnr=booking.pnr,
        flight_no=flight.flight_no,
        passenger_name=booking.passenger_name,
        passenger_phone=booking.passenger_phone,
        price_paid=float(booking.price_paid),
        status=booking.status,
        payment_status=booking.payment_status,
        departure=flight.departure,
        arrival=flight.arrival,
        origin=flight.origin,
        destination=flight.destination
    )

@app.get("/bookings", response_model=List[BookingSummary])
def get_all_bookings(
    passenger_phone: Optional[str] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    db=Depends(get_db)
):
    query = db.query(Booking)

    if passenger_phone:
        query = query.filter(Booking.passenger_phone == passenger_phone)

    if status:
        query = query.filter(Booking.status == status.upper())

    if payment_status:
        query = query.filter(Booking.payment_status == payment_status.upper())

    bookings = query.all()

    result = []
    for b in bookings:
        flight = db.query(Flight).filter(Flight.id == b.flight_id).first()
        if flight:
            result.append(
                BookingSummary(
                    pnr=b.pnr,
                    flight_no=flight.flight_no,
                    passenger_name=b.passenger_name,
                    price_paid=float(b.price_paid),
                    status=b.status,
                    payment_status=b.payment_status,
                    origin=flight.origin,
                    destination=flight.destination,
                    departure=flight.departure
                )
            )

    return result


## background simulator
async def simulator_loop(interval_seconds: int = 60):
    while True:
        try:
            db = SessionLocal()
            flights = db.query(Flight).all()
            for f in flights:
                change = random.choice([-2, -1, 0, 0, 1])  # small churn
                new_avail = max(0, min(f.total_seats, f.seats_available + change))
                if new_avail != f.seats_available:
                    f.seats_available = new_avail
                    demand_index = random.uniform(0.2, 0.9)
                    tier = f.airline.tier if f.airline else "standard"
                    price = calculate_dynamic_price(
                        float(f.base_fare), f.seats_available, f.total_seats,
                        f.departure, demand_index, tier
                    )
                    db.add(FareHistory(flight_id=f.id, price=price))
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()
        await asyncio.sleep(interval_seconds)




# ==========================
# ✅ MILESTONE 4 EXTENSIONS
# ==========================


# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/bookings")
def get_all_bookings_with_flight(db=Depends(get_db)):
    """Return all bookings with flight info"""
    bookings = (
        db.query(Booking, Flight)
        .join(Flight, Flight.id == Booking.flight_id)
        .all()
    )
    results = []
    for b, f in bookings:
        results.append({
            "pnr": b.pnr,
            "status": b.status,
            "payment_status": b.payment_status,
            "price_paid": float(b.price_paid) if b.price_paid else 0,
            "passenger_name": b.passenger_name,
            "passenger_phone": b.passenger_phone,
            "flight_no": f.flight_no,
            "origin": f.origin,
            "destination": f.destination,
            "departure": f.departure,
            "arrival": f.arrival,
        })
    return results


@app.post("/booking/cancel/{pnr}")
def cancel_booking(pnr: str, db=Depends(get_db)):
    """Cancel booking if it exists and is not already cancelled"""
    booking = db.query(Booking).filter(Booking.pnr == pnr).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == "CANCELLED":
        return {"message": "Booking already cancelled"}

    booking.status = "CANCELLED"
    db.commit()
    return {"message": f"Booking {pnr} cancelled successfully", "status": "CANCELLED"}



# ==========================
# ✅ DASHBOARD ANALYTICS ENDPOINTS (FINAL + FIXED)
# ==========================

@app.get("/dashboard/stats")
def get_dashboard_stats(db=Depends(get_db)):
    total_flights = db.query(func.count(Flight.id)).scalar() or 0
    total_bookings = db.query(func.count(Booking.id)).scalar() or 0
    total_revenue = db.query(func.sum(Booking.price_paid)).scalar() or 0
    total_passengers = db.query(func.count(Booking.passenger_name)).scalar() or 0

    return {
        "flights": total_flights,
        "bookings": total_bookings,
        "revenue": float(total_revenue),
        "passengers": total_passengers,
    }


@app.get("/dashboard/bookings_trend")
def get_booking_trend(db=Depends(get_db)):
    result = (
        db.query(
            func.strftime("%w", Booking.created_at).label("day"),
            func.count(Booking.id)
        )
        .group_by("day")
        .all()
    )
    days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    trend = [{"name": days[int(day)], "bookings": count} for day, count in result]
    return trend


@app.get("/dashboard/top_routes")
def get_top_routes(db=Depends(get_db)):
    """Returns top 5 most booked routes (origin → destination)"""
    result = (
        db.query(
            Flight.origin,
            Flight.destination,
            func.count(Booking.id).label("bookings")
        )
        .join(Booking, Booking.flight_id == Flight.id)
        .group_by(Flight.origin, Flight.destination)
        .order_by(desc("bookings"))
        .limit(5)
        .all()
    )
    return [{"route": f"{r.origin} → {r.destination}", "bookings": r.bookings} for r in result]


@app.get("/dashboard/airline_stats")
def get_airline_stats(db=Depends(get_db)):
    """Returns booking and revenue summary per airline"""
    result = (
        db.query(
            Airline.name.label("airline"),
            func.count(Booking.id).label("bookings"),
            func.sum(Booking.price_paid).label("revenue"),
        )
        .join(Flight, Flight.airline_id == Airline.id)
        .join(Booking, Booking.flight_id == Flight.id)
        .group_by(Airline.name)
        .order_by(desc("bookings"))
        .all()
    )
    return [
        {"airline": r.airline, "bookings": r.bookings, "revenue": float(r.revenue or 0)}
        for r in result
    ]


@app.get("/dashboard/fare_trend")
def get_fare_trend(db=Depends(get_db)):
    """Shows average fare over time"""
    result = (
        db.query(
            func.date(FareHistory.recorded_at).label("date"),
            func.avg(FareHistory.price).label("avg_price"),
        )
        .group_by(func.date(FareHistory.recorded_at))
        .order_by("date")
        .limit(10)
        .all()
    )
    return [{"date": str(r.date), "avg_price": float(r.avg_price or 0)} for r in result]




from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
import os

@app.post("/email_ticket/{pnr}")
async def email_ticket(pnr: str, background_tasks: BackgroundTasks, db=Depends(get_db)):
    booking = db.query(Booking).filter(Booking.pnr == pnr).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    flight = db.query(Flight).filter(Flight.id == booking.flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")

    # ✅ Load font
    font_path = os.path.join(os.getcwd(), "backend", "fonts", "DejaVuSans.ttf")
    pdfmetrics.registerFont(TTFont("DejaVuSans", font_path))

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, title="FlightSim Light Airlines - E-Ticket")

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="Header", fontName="DejaVuSans", fontSize=22, leading=26, alignment=1))
    styles.add(ParagraphStyle(name="SubHeader", fontName="DejaVuSans", fontSize=14, textColor=colors.darkblue, spaceAfter=10))
    styles.add(ParagraphStyle(name="Normal", fontName="DejaVuSans", fontSize=11, leading=14))

    content = []

    # Header
    content.append(Paragraph("✈️ Flight-Sim Light Airlines", styles["Header"]))
    content.append(Spacer(1, 6))
    content.append(Paragraph("<b>Electronic Flight Receipt</b>", styles["SubHeader"]))
    content.append(Spacer(1, 12))

    # Booking Info table
    table_data = [
        ["PNR:", booking.pnr],
        ["Passenger:", booking.passenger_name],
        ["Contact:", booking.passenger_phone or "N/A"],
        ["Flight No:", flight.flight_no],
        ["Route:", f"{flight.origin} → {flight.destination}"],
        ["Departure:", flight.departure.strftime("%d %b %Y, %I:%M %p")],
        ["Arrival:", flight.arrival.strftime("%d %b %Y, %I:%M %p")],
        ["Seat No:", booking.seat_no or "Auto-assigned"],
        ["Class:", "Economy" if (booking.seat_no is None or int(str(booking.seat_no)[1:]) > 10) else "Business"],
        ["Price Paid:", f"₹{float(booking.price_paid):,.2f}"],
        ["Payment:", booking.payment_status],
        ["Status:", booking.status],
    ]

    table = Table(table_data, colWidths=[120, 360])
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightblue),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.lightgrey]),
        ("FONTNAME", (0, 0), (-1, -1), "DejaVuSans"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
    ]))
    content.append(table)
    content.append(Spacer(1, 20))

    # Terms section
    terms = """
    <b>Terms and Conditions</b><br/>
    1. Please carry a valid government-issued photo ID.<br/>
    2. Check-in closes 45 minutes before departure.<br/>
    3. Ticket is non-transferable and subject to airline policies.<br/>
    4. Refunds, if applicable, follow the airline’s policy.<br/>
    5. Airline not responsible for delays due to weather or ATC.<br/>
    6. Reconfirm flight details before travel.<br/>
    7. Contact <b>support@flightsim.ai</b> for any issues.<br/>
    """
    content.append(Paragraph(terms, styles["Normal"]))
    content.append(Spacer(1, 12))

    content.append(Paragraph("<b>Have a safe journey!</b>", styles["Normal"]))
    content.append(Spacer(1, 8))
    content.append(Paragraph("Generated by Flight-Sim Booking System © 2025", styles["Normal"]))

    doc.build(content)
    pdf_data = buffer.getvalue()
    buffer.close()

    send_email_with_pdf(
        background_tasks,
        subject="Your Flight-Sim Light Airlines E-Ticket ✈️",
        recipients=[booking.passenger_phone + "@example.com"],
        body=f"<h3>Your booking {booking.pnr} is confirmed!</h3><p>Attached is your e-ticket.</p>",
        pdf_bytes=pdf_data,
        filename=f"{booking.pnr}_ticket.pdf",
    )

    return {"message": f"Receipt emailed successfully for PNR {booking.pnr}"}
