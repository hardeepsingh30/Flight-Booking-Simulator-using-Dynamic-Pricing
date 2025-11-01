# ✈️ Flight Booking Simulator (FastAPI + SQLAlchemy + ReportLab)

A full-featured **Flight Booking Simulation System** built with **FastAPI**, **SQLite**, and **SQLAlchemy**, supporting **dynamic pricing**, **real-time seat updates**, **PDF e-ticket generation**, and **dashboard analytics**.

---

## 🚀 Features

### 🧩 Core System
- Manage **Airlines**, **Flights**, **Bookings**, and **Fare Histories**
- SQLite-based backend with full CRUD via FastAPI
- Auto-seeding and relational linking via SQLAlchemy ORM

### 💰 Dynamic Pricing Engine
- Real-time fare adjustment based on:
  - Seat availability  
  - Time until departure  
  - Airline tier (Budget / Standard / Premium)  
  - Demand index simulation  
- Automatic fare history tracking

### 👤 Booking Management
- Create and manage bookings
- Transaction-safe seat reservations
- Integrated payment simulation (`PENDING`, `PAID`, `FAILED`)
- Cancel and restore bookings safely

### 🧾 PDF E-Ticket Generator
- Generates airline-grade e-ticket PDFs using **ReportLab**
- Styled layout identical to commercial flight itineraries
- Includes all key sections:
  - Ticket Info  
  - Passenger Info  
  - Flight Info  
  - Fare Details  
  - Important Information  
- Exports or emails the generated PDF

### 📊 Admin Dashboard APIs
- `/dashboard/stats`: Total flights, bookings, revenue, passengers  
- `/dashboard/bookings_trend`: Day-wise booking trends  
- `/dashboard/top_routes`: Most popular travel routes  
- `/dashboard/airline_stats`: Airline-wise revenue breakdown  
- `/dashboard/fare_trend`: Average fare over time  

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| **Backend Framework** | FastAPI |
| **Database** | SQLite (SQLAlchemy ORM) |
| **Background Jobs** | Asyncio (seat simulation loop) |
| **PDF Generation** | ReportLab |
| **Email Utility** | Custom `send_email_with_pdf()` using BackgroundTasks |
| **Frontend (optional)** | React / Vite app calling these APIs |
| **Language** | Python 3.10+ |

---

## 📂 Project Structure

