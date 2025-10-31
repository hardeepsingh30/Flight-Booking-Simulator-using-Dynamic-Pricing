# backend/seed_data.py
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import random
from main import SessionLocal, Airline, Flight, Base, engine

# India Standard Time (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # clear old data
        db.query(Flight).delete()
        db.query(Airline).delete()
        db.commit()

        # create airlines
        airlines = [
            Airline(name="Air India", tier="standard"),
            Airline(name="IndiGo", tier="budget"),
            Airline(name="SpiceJet", tier="budget"),
            Airline(name="Vistara", tier="premium"),
            Airline(name="Akasa Air", tier="budget"),
        ]
        db.add_all(airlines)
        db.commit()

        # list of cities
        cities = [
            "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad",
            "Pune", "Kolkata", "Jaipur", "Ahmedabad", "Goa"
        ]

        # Base time in IST
        now = datetime.now(IST)

        airline_prefix = {
            "Air India": "AI",
            "IndiGo": "6E",
            "SpiceJet": "SG",
            "Vistara": "UK",
            "Akasa Air": "QP"
        }

        flights = []
        flight_no_counter = 100

        for i in range(20):  # ✅ generate 20 future flights
            origin, destination = random.sample(cities, 2)
            airline = random.choice(airlines)

            # schedule within next 10 days
            dep_time = now + timedelta(days=random.randint(1, 10), hours=random.randint(5, 22))
            arr_time = dep_time + timedelta(hours=random.randint(1, 3), minutes=random.randint(0, 59))

            base_fare = Decimal(str(round(random.uniform(2500, 9000), 2)))
            total_seats = random.choice([120, 150, 180])
            seats_available = random.randint(20, total_seats)

            flight = Flight(
                flight_no=f"{airline_prefix[airline.name]}{flight_no_counter + i}",
                airline_id=airline.id,
                origin=origin,
                destination=destination,
                departure=dep_time,
                arrival=arr_time,
                base_fare=base_fare,
                total_seats=total_seats,
                seats_available=seats_available
            )
            flights.append(flight)

        db.add_all(flights)
        db.commit()

        print(f"✅ Seeded {len(flights)} flights successfully (IST time zone)\n")
        for f in flights:
            print(
                f"✈️ {f.flight_no}: {f.origin} → {f.destination} | "
                f"{f.departure.strftime('%Y-%m-%d %H:%M')} | "
                f"₹{f.base_fare}"
            )

    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
