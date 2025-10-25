import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FlightSearch from "./pages/FlightSearch";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage";  // New
import Confirmation from "./pages/Confirmation";  // New

function App() {
  return (
    <Router>
      <div className="container mx-auto flex justify-between items-center">
        <header className="bg-blue-600 text-white p-4 text-center">
          <h1 className="text-xl font-bold">Flight Booking Simulator</h1>
        </header>
        <Routes>
          <Route path="/" element={<FlightSearch />} />
          <Route path="/book/:flightId" element={<BookingPage />} />
          <Route path="/pay/:pnr" element={<PaymentPage />} />  // New
          <Route path="/confirmation/:pnr" element={<Confirmation />} />  // New
        </Routes>
      </div>
    </Router>
  );
}

export default App;