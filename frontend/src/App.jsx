import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FlightSearch from "./pages/FlightSearch";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage";
import Confirmation from "./pages/Confirmation";
import BookingsPage from "./pages/BookingsPage";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SeatSelection from "./pages/SeatSelection"; // ✅ Added new page
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <Router>
      {/* ✅ Global Toast Notifications */}
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <Routes>
        {/* ✅ Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* ✅ Main App Layout (with Navbar) */}
        <Route path="/" element={<Layout />}>
          {/* Public Dashboard & Flights */}
          <Route index element={<Dashboard />} />
          <Route path="flights" element={<FlightSearch />} />

          {/* ✅ Protected Pages */}
          <Route
            path="bookings"
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ✅ Seat Selection (Protected) */}
        <Route
          path="/select-seat/:flightId"
          element={
            <ProtectedRoute>
              <SeatSelection />
            </ProtectedRoute>
          }
        />

        {/* ✅ Booking & Payment Flow */}
        <Route
          path="/book/:flightId"
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pay/:pnr"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/confirmation/:pnr"
          element={
            <ProtectedRoute>
              <Confirmation />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
