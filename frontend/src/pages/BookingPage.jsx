// src/pages/BookingPage.jsx
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function BookingPage() {
  const { flightId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const selectedSeat = location.state?.selectedSeat || "";
  const seatClass = location.state?.seatClass || "economy";
  const customFare = location.state?.finalPrice || null;

  const [flightData, setFlightData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [response, setResponse] = useState(null);

  // ✅ Fetch flight details (with dynamic price)
  useEffect(() => {
    const fetchFlight = async () => {
      try {
        toast.loading("Fetching flight details...");
        const res = await fetch(`http://127.0.0.1:8000/dynamic_price/${flightId}`);
        toast.dismiss();

        if (!res.ok) throw new Error("Failed to fetch flight details.");
        const data = await res.json();
        setFlightData(data);
      } catch (err) {
        toast.dismiss();
        toast.error(err.message);
      }
    };
    fetchFlight();
  }, [flightId]);

  const handleBooking = async () => {
    if (!passengerName.trim()) {
      toast.error("Please enter passenger name.");
      return;
    }

    setLoading(true);
    try {
      // 🧮 Use dynamic pricing (from seat or API)
      const finalPrice = customFare ? parseFloat(customFare) : flightData.dynamic_price;

      // ✅ Payload structure that matches backend BookingRequest
      const bookingPayload = {
        flight_id: parseInt(flightId),
        passenger: {
          passenger_name: passengerName,
          passenger_phone: passengerPhone,
        },
        seat_no: selectedSeat ? parseInt(selectedSeat.replace(/\D/g, "")) : null,
      };

      toast.loading("Booking your flight...");
      const res = await fetch("http://127.0.0.1:8000/booking/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      });
      toast.dismiss();

      if (!res.ok) throw new Error("Booking failed.");
      const data = await res.json();

      setResponse({ ...data, price: finalPrice });
      toast.success("✅ Booking successful! Redirecting to payment...");

      setTimeout(() => {
        navigate(`/pay/${data.pnr}`, { state: { totalPrice: finalPrice } });
      }, 1500);
    } catch (err) {
      toast.dismiss();
      toast.error("Error initiating booking: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">✈️ Book Your Flight</h1>

      {flightData && <FlightCard data={flightData} />}

      {/* ✅ Passenger Form */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Passenger Name"
          value={passengerName}
          onChange={(e) => setPassengerName(e.target.value)}
        />
        <input
          type="tel"
          className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Phone Number"
          value={passengerPhone}
          onChange={(e) => setPassengerPhone(e.target.value)}
        />
      </div>

      {/* ✅ Seat Info */}
      <div className="bg-gray-50 border p-3 rounded-lg mb-6">
        <p className="font-semibold text-gray-700 mb-1">🪑 Seat Information</p>
        <p className="text-sm text-gray-600">
          Seat No: <span className="font-bold text-blue-600">{selectedSeat || "—"}</span>
        </p>
        <p className="text-sm text-gray-600">
          Class: <span className="capitalize font-bold text-green-600">{seatClass}</span>
        </p>
      </div>

      {/* ✅ Total Fare */}
      {flightData && (
        <div className="mb-4 text-right text-lg font-semibold text-gray-800">
          Total Fare:{" "}
          <span className="text-blue-600">
            ₹{customFare ? parseFloat(customFare) : flightData.dynamic_price}
          </span>
        </div>
      )}

      {/* ✅ Confirm Button */}
      <button
        disabled={loading}
        onClick={handleBooking}
        className={`w-full py-2 rounded-lg flex items-center justify-center font-semibold transition ${
          loading
            ? "bg-blue-400 text-white cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {loading ? (
          <>
            <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          "Confirm Booking"
        )}
      </button>

      {/* ✅ Booking Response */}
      {response && (
        <div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="font-bold text-green-700 mb-2">Booking Summary</h2>
          <pre className="text-sm text-gray-700 bg-white p-3 rounded-lg shadow-inner overflow-x-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/* ✅ Reusable Flight Summary Card */
function FlightCard({ data }) {
  return (
    <div className="mb-6 p-5 bg-white shadow-md rounded-lg border">
      <h3 className="font-semibold text-gray-700 mb-2">Flight Details</h3>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Flight #{data.flight_id || data.id}</p>
          <h2 className="text-lg font-semibold text-gray-800 mt-1">
            Price: <span className="text-blue-600">₹{data.dynamic_price}</span>
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          Seats:{" "}
          <span className="font-semibold text-green-600">{data.seats_available}</span>
        </p>
      </div>
    </div>
  );
}
