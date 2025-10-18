# backend/seed_data.py
from datetime import datetime, timedelta
from decimal import Decimal
from main import SessionLocal, Airline, Flight, Base, engine

def seed_db():
    # ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # clear previous for idempotent seed (optional)
        db.query(Flight).delete()
        db.query(Airline).delete()
        db.commit()

        # create airlines
        a1 = Airline(name="Air India", tier="standard")
        a2 = Airline(name="Indigo", tier="budget")
        a3 = Airline(name="SpiceJet", tier="budget")
        a4 = Airline(name="Vistara", tier="premium")
        db.add_all([a1, a2, a3, a4])
        db.commit()

        now = datetime.utcnow()
        flights = [
            Flight(
                flight_no="AI101",
                airline_id=a1.id,
                origin="Mumbai",
                destination="Delhi",
                departure=now + timedelta(days=1, hours=3),
                arrival=now + timedelta(days=1, hours=5),
                base_fare=Decimal("4500.00"),
                total_seats=180,
                seats_available=120
            ),
            Flight(
                flight_no="6E202",
                airline_id=a2.id,
                origin="Mumbai",
                destination="Bangalore",
                departure=now + timedelta(days=2, hours=2),
                arrival=now + timedelta(days=2, hours=4),
                base_fare=Decimal("3200.00"),
                total_seats=180,
                seats_available=80
            ),
            Flight(
                flight_no="SG303",
                airline_id=a3.id,
                origin="Delhi",
                destination="Jaipur",
                departure=now + timedelta(hours=8),
                arrival=now + timedelta(hours=9, minutes=15),
                base_fare=Decimal("2500.00"),
                total_seats=100,
                seats_available=10
            ),
            Flight(
                flight_no="VU404",
                airline_id=a4.id,
                origin="Chennai",
                destination="Mumbai",
                departure=now + timedelta(days=5),
                arrival=now + timedelta(days=5, hours=2),
                base_fare=Decimal("5600.00"),
                total_seats=150,
                seats_available=150
            ),
        ]
        db.add_all(flights)
        db.commit()
        print("Seeded DB with sample airlines and flights.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
