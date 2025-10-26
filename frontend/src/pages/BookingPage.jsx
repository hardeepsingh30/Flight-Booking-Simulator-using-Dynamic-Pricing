import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowPathIcon } from '@heroicons/react/24/outline'; // ✅ Better spinner icon

export default function BookingPage() {
  const { flightId } = useParams();
  const [flight, setFlight] = useState(null);
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [seatNo, setSeatNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/dynamic_price/${flightId}`)
      .then((res) => res.json())
      .then((data) => setFlight(data))
      .catch((error) => alert("Error loading flight details: " + error.message));
  }, [flightId]);

  const handleBooking = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/booking/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flight_id: parseInt(flightId),
          seat_no: seatNo ? parseInt(seatNo) : null,
          passenger: {
            passenger_name: passengerName,
            passenger_phone: passengerPhone,
          },
        }),
      });

      if (!res.ok) throw new Error("Booking failed");
      const data = await res.json();
      setResponse(data);

      if (data.pnr) {
        navigate(`/pay/${data.pnr}`);
      }
    } catch (error) {
      alert("Error initiating booking: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Booking for Flight #{flightId}</h1>

      {flight ? (
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <p><strong>Dynamic Price:</strong> ₹{flight.dynamic_price}</p>
          <p><strong>Seats Available:</strong> {flight.seats_available}</p>
        </div>
      ) : (
        <p className="text-gray-500 mb-4">Loading flight details...</p>
      )}

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          className="border p-2 w-full"
          placeholder="Passenger Name"
          value={passengerName}
          onChange={(e) => setPassengerName(e.target.value)}
        />
        <input
          className="border p-2 w-full"
          placeholder="Phone Number"
          value={passengerPhone}
          onChange={(e) => setPassengerPhone(e.target.value)}
        />
        <input
          className="border p-2 w-full md:col-span-2"
          placeholder="Seat No (Optional)"
          value={seatNo}
          onChange={(e) => setSeatNo(e.target.value)}
        />
      </div>

      <button
        disabled={loading}
        onClick={handleBooking}
        className={`px-4 py-2 rounded flex items-center justify-center transition-colors 
          ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}
        `}
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

      {response && (
        <div className="mt-4 p-4 border rounded bg-green-50">
          <h2 className="font-bold">Booking Status</h2>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
