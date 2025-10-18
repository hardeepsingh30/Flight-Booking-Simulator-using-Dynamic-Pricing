
# MILESTONE 2


# main.py
from fastapi import FastAPI, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
import asyncio
import random

# SQLAlchemy setup (sqlite)
from sqlalchemy import create_engine, Column, Integer, String, DateTime, DECIMAL, ForeignKey, func
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy.exc import SQLAlchemyError


DB_URL = "sqlite:///./flights.db"
engine = create_engine(DB_URL, connect_args={"check_same_thread": False}, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


# --- LIFESPAN + APP INITIALIZATION AT THE TOP ---
async def simulator_loop(interval_seconds: int = 60):
    while True:
        await asyncio.sleep(interval_seconds)

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(simulator_loop(60))
    yield

app = FastAPI(title="Flight Booking Simulator", lifespan=lifespan)
# ------------------------------------------------


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

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True)
    pnr = Column(String, unique=True)
    flight_id = Column(Integer, ForeignKey("flights.id"))
    passenger_name = Column(String, nullable=False)
    passenger_phone = Column(String)
    seat_no = Column(Integer)
    price_paid = Column(DECIMAL(10,2))
    status = Column(String, default="CONFIRMED")

class FareHistory(Base):
    __tablename__ = "fare_history"
    id = Column(Integer, primary_key=True)
    flight_id = Column(Integer, ForeignKey("flights.id"))
    recorded_at = Column(DateTime, default=func.now())
    price = Column(DECIMAL(10,2))

Base.metadata.create_all(bind=engine)

# Pydantic schemas
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

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/flights", response_model=List[FlightOut])
def list_flights(
    sort_by: Optional[str] = Query(None, pattern="^(price|duration)$"),
    limit: int = 50,
    db=Depends(get_db)
):
    q = db.query(Flight).join(Airline, isouter=True)
    flights = q.limit(limit).all()

    # transform to FlightOut list, dynamic_price not inserted here (use /dynamic_price endpoint)
    out = []
    for f in flights:
        out.append(FlightOut(
            id=f.id, flight_no=f.flight_no, origin=f.origin, destination=f.destination,
            departure=f.departure, arrival=f.arrival, base_fare=float(f.base_fare),
            seats_available=f.seats_available, total_seats=f.total_seats,
            airline_name=f.airline.name if f.airline else None
        ))
    # Sorting optionally by duration or price (price=base_fare for simple sorting)
    if sort_by == "duration":
        out.sort(key=lambda x: (x.arrival - x.departure).total_seconds())
    elif sort_by == "price":
        out.sort(key=lambda x: x.base_fare)
    return out

@app.get("/search", response_model=List[FlightOut])
def search_flights(
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    date: Optional[datetime] = None,
    sort: Optional[str] = Query(None, pattern="^(price|duration)$"),
    db=Depends(get_db)
):
    q = db.query(Flight).join(Airline, isouter=True)
    if origin:
        q = q.filter(func.lower(Flight.origin) == origin.lower())
    if destination:
        q = q.filter(func.lower(Flight.destination) == destination.lower())
    if date:
        start = datetime(date.year, date.month, date.day)
        end = start + timedelta(days=1)
        q = q.filter(Flight.departure >= start, Flight.departure < end)
    flights = q.all()

    out = []
    for f in flights:
        out.append(FlightOut(
            id=f.id, flight_no=f.flight_no, origin=f.origin, destination=f.destination,
            departure=f.departure, arrival=f.arrival, base_fare=float(f.base_fare),
            seats_available=f.seats_available, total_seats=f.total_seats,
            airline_name=f.airline.name if f.airline else None
        ))
    if sort == "duration":
        out.sort(key=lambda x: (x.arrival - x.departure).total_seconds())
    elif sort == "price":
        out.sort(key=lambda x: x.base_fare)
    return out

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

@app.post("/booking")
def create_booking(req: BookingRequest, db=Depends(get_db)):
    try:
        # start tx
        flight = db.query(Flight).with_for_update().filter(Flight.id == req.flight_id).first()
        if not flight:
            raise HTTPException(status_code=404, detail="Flight not found")
        if flight.seats_available <= 0:
            raise HTTPException(status_code=400, detail="No seats available")

        # calculate price
        demand_index = random.uniform(0.2, 0.9)
        airline_tier = flight.airline.tier if flight.airline else "standard"
        price = calculate_dynamic_price(float(flight.base_fare), flight.seats_available, flight.total_seats, flight.departure, demand_index, airline_tier)

        # reserve seat
        flight.seats_available -= 1
        pnr = f"PNR{random.randint(100000, 999999)}"
        booking = Booking(pnr=pnr, flight_id=flight.id, passenger_name=req.passenger.passenger_name, passenger_phone=req.passenger.passenger_phone, seat_no=req.seat_no, price_paid=price, status="CONFIRMED")
        db.add(booking)
        db.commit()
        return {"message":"Booking successful", "pnr": pnr, "price": price}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

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


# ✅ define lifespan and app ONCE
@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(simulator_loop(60))
    yield

app = FastAPI(title="Flight Booking Simulator", lifespan=lifespan)




#    End of milestone 2



