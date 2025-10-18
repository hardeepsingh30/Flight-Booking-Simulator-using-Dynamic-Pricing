-- ------------------------------------------------------------
-- DATABASE : flight_booking
-- PURPOSE  : Complete Flight Booking Database with sample data
-- ------------------------------------------------------------

-- Step 1: Create and select the database
CREATE DATABASE IF NOT EXISTS flight_booking;
USE flight_booking;

-- Step 2: Create flights table
CREATE TABLE flights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_no VARCHAR(10) NOT NULL UNIQUE,
    origin VARCHAR(50) NOT NULL,
    destination VARCHAR(50) NOT NULL,
    departure DATETIME NOT NULL,
    arrival DATETIME NOT NULL,
    base_fare DECIMAL(10,2) DEFAULT 5000.00,
    total_seats INT NOT NULL,
    seats_available INT NOT NULL CHECK (seats_available >= 0),
    airline_name VARCHAR(50)
);

-- Step 3: Insert sample flight data
INSERT INTO flights (flight_no, origin, destination, departure, arrival, base_fare, total_seats, seats_available, airline_name)
VALUES 
('AI1', 'Delhi', 'Mumbai',  '2025-03-01 10:00:00', '2025-03-01 12:00:00', 8000.00, 200, 150, 'Air India'),
('AI2', 'Mumbai', 'Delhi',  '2025-03-01 15:00:00', '2025-03-01 17:00:00', 8000.00, 200, 200, 'Air India'),
('AI3', 'Delhi', 'Chennai', '2025-03-01 09:00:00', '2025-03-01 11:30:00', 9000.00, 200, 180, 'Air India'),
('AI4', 'Chennai', 'Delhi', '2025-03-01 13:00:00', '2025-03-01 15:30:00', 9000.00, 200, 200, 'Air India'),
('AI5', 'Mumbai', 'Chennai','2025-03-01 12:00:00', '2025-03-01 14:30:00', 6000.00, 200, 160, 'Air India'),
('AI6', 'Chennai', 'Mumbai','2025-03-01 16:00:00', '2025-03-01 18:30:00', 7000.00, 200, 200, 'Air India');

-- Step 4: Create passengers table
CREATE TABLE passengers (
    passenger_id INT AUTO_INCREMENT PRIMARY KEY,
    passenger_fullname VARCHAR(100) NOT NULL,
    passenger_contact VARCHAR(20),
    passenger_email VARCHAR(100),
    passenger_city VARCHAR(50)
);

-- Step 5: Insert sample passengers
INSERT INTO passengers (passenger_fullname, passenger_contact, passenger_email, passenger_city)
VALUES
('Alice', '9991112222', 'alice@example.com', 'Delhi'),
('Bob',   '8882223333', 'bob@example.com', 'Mumbai'),
('Jack',  '7773334444', 'jack@example.com', 'Chennai'),
('David', '6664445555', 'david@example.com', 'Delhi');

-- Step 6: Create bookings table
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(20),
    flight_id INT,
    passenger_id INT,
    seat_no INT UNIQUE,
    price_paid DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'CONFIRMED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_flight FOREIGN KEY (flight_id) REFERENCES flights(id),
    CONSTRAINT fk_booking_passenger FOREIGN KEY (passenger_id) REFERENCES passengers(passenger_id)
);

-- Step 7: Insert sample bookings
INSERT INTO bookings (transaction_id, flight_id, passenger_id, seat_no, price_paid)
VALUES
('IC145', 1, 1, 12, 8000.00),
('AB123', 2, 2,  6, 8000.00),
('TC078', 3, 3, 24, 9000.00);

-- Step 8: Create fare history table
CREATE TABLE fare_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    price DECIMAL(10,2),
    FOREIGN KEY (flight_id) REFERENCES flights(id)
);

-- ------------------------------------------------------------
-- SAMPLE QUERIES FOR PRACTICE
-- ------------------------------------------------------------

-- 1. Retrieve all flights
SELECT * FROM flights;

-- 2. Show flight number, origin, destination, base fare
SELECT flight_no, origin, destination, base_fare FROM flights;

-- 3. Update seats for a flight
UPDATE flights SET seats_available = 300 WHERE id = 6;

-- 4. Delete a flight
DELETE FROM flights WHERE id = 3;

-- 5. Order by base fare (ascending)
SELECT flight_no, base_fare FROM flights ORDER BY base_fare ASC;

-- 6. Get top 3 cheapest flights
SELECT flight_no, base_fare FROM flights ORDER BY base_fare ASC LIMIT 3;

-- 7. Filter flights from Mumbai
SELECT * FROM flights WHERE LOWER(origin) = 'mumbai';

-- 8. Flights with fare > 8000
SELECT flight_no, base_fare FROM flights WHERE base_fare > 8000;

-- 9. Count total flights
SELECT COUNT(*) AS total_flights FROM flights;

-- 10. Average fare per origin
SELECT origin, AVG(base_fare) AS avg_fare FROM flights GROUP BY origin;

-- 11. Origins with average fare below 8000
SELECT origin, AVG(base_fare) AS avg_fare FROM flights GROUP BY origin HAVING AVG(base_fare) < 8000;

-- ------------------------------------------------------------
-- JOINS
-- ------------------------------------------------------------

-- INNER JOIN: show passengers and their flight details
SELECT 
    p.passenger_fullname,
    f.flight_no,
    f.origin,
    f.destination,
    b.seat_no,
    b.price_paid
FROM bookings b
JOIN flights f ON b.flight_id = f.id
JOIN passengers p ON b.passenger_id = p.passenger_id;

-- LEFT JOIN: all flights, even if not booked
SELECT 
    f.flight_no,
    f.origin,
    f.destination,
    p.passenger_fullname
FROM flights f
LEFT JOIN bookings b ON f.id = b.flight_id
LEFT JOIN passengers p ON b.passenger_id = p.passenger_id;

-- RIGHT JOIN: all bookings, even if flight data missing
SELECT 
    f.flight_no,
    p.passenger_fullname
FROM flights f
RIGHT JOIN bookings b ON f.id = b.flight_id
RIGHT JOIN passengers p ON b.passenger_id = p.passenger_id;

-- FULL OUTER JOIN equivalent (MySQL doesn’t have direct FULL JOIN)
SELECT 
    f.flight_no,
    p.passenger_fullname
FROM flights f
LEFT JOIN bookings b ON f.id = b.flight_id
LEFT JOIN passengers p ON b.passenger_id = p.passenger_id
UNION
SELECT 
    f.flight_no,
    p.passenger_fullname
FROM flights f
RIGHT JOIN bookings b ON f.id = b.flight_id
RIGHT JOIN passengers p ON b.passenger_id = p.passenger_id;

-- ------------------------------------------------------------
-- TRANSACTION DEMO
-- ------------------------------------------------------------

START TRANSACTION;

-- 1. Check seat availability
SELECT seats_available FROM flights WHERE id = 1;

-- 2. Reserve a seat
UPDATE flights SET seats_available = seats_available - 1 WHERE id = 1;

-- 3. Add a booking
INSERT INTO bookings (transaction_id, flight_id, passenger_id, seat_no, price_paid)
VALUES ('TX999', 1, 4, 22, 8500.00);

COMMIT;

-- If something goes wrong, use:
-- ROLLBACK;

-- ------------------------------------------------------------
-- CONSTRAINTS SUMMARY
-- ------------------------------------------------------------
-- PRIMARY KEY     → unique identifier (id)
-- FOREIGN KEY     → links flights ↔ bookings ↔ passengers
-- NOT NULL        → ensures required fields are not empty
-- UNIQUE          → ensures no duplicate seat numbers
-- CHECK           → ensures seat counts are non-negative
-- DEFAULT         → sets default base fare or status

-- ------------------------------------------------------------
-- END OF SCRIPT
-- ------------------------------------------------------------
