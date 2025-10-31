// src/pages/SeatSelection.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function SeatSelection() {
  const { flightId } = useParams();
  const navigate = useNavigate();
  const [flight, setFlight] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatClass, setSeatClass] = useState("economy");
  const [basePrice, setBasePrice] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [bookedSeats, setBookedSeats] = useState([]);

  const rows = 15;
  const cols = ["A", "B", "C", "D", "E", "F"];

  // ✅ Fetch flight + simulate blocked seats
  useEffect(() => {
    const fetchFlight = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/dynamic_price/${flightId}`);
        if (!res.ok) throw new Error("Failed to load flight details");
        const data = await res.json();
        setFlight(data);
        setBasePrice(data.dynamic_price);
        setFinalPrice(data.dynamic_price);

        // randomly mark 20% seats as booked (visual simulation)
        const blocked = [];
        for (let i = 0; i < 18; i++) {
          const randRow = Math.floor(Math.random() * rows) + 1;
          const randCol = cols[Math.floor(Math.random() * cols.length)];
          blocked.push(`${randCol}${randRow}`);
        }
        setBookedSeats(blocked);
      } catch (err) {
        toast.error("Failed to load flight details");
      }
    };
    fetchFlight();
  }, [flightId]);

  // 💰 Dynamic price recalculation
  useEffect(() => {
    if (!basePrice) return;
    let multiplier = 1;

    if (seatClass === "business") multiplier = 1.6;
    else if (seatClass === "first") multiplier = 2.2;

    if (selectedSeat && ["A", "F"].includes(selectedSeat[0])) multiplier += 0.1; // window
    if (selectedSeat && ["C", "D"].includes(selectedSeat[0])) multiplier += 0.05; // aisle

    setFinalPrice((basePrice * multiplier).toFixed(2));
  }, [seatClass, selectedSeat, basePrice]);

  const handleSeatSelect = (seat) => {
    if (bookedSeats.includes(seat)) return;
    setSelectedSeat(seat === selectedSeat ? null : seat);
  };

  const handleContinue = () => {
    if (!selectedSeat) {
      toast.error("Please select a seat first!");
      return;
    }
    toast.success(`Seat ${selectedSeat} selected ✅`);
    navigate(`/book/${flightId}`, { state: { selectedSeat, finalPrice, seatClass } });
  };

  if (!flight)
    return <p className="text-center mt-10 text-gray-600 animate-pulse">Loading seat map...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">✈️ Seat Selection</h1>
      <p className="text-gray-600 mb-4">
        Flight ID: <strong>{flightId}</strong> | Base Fare: ₹{basePrice}
      </p>

      {/* 🏷 Class Selection */}
      <div className="flex gap-6 mb-6">
        {["economy", "business", "first"].map((cls) => (
          <label key={cls} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="class"
              value={cls}
              checked={seatClass === cls}
              onChange={(e) => setSeatClass(e.target.value)}
            />
            <span className="capitalize font-medium">{cls} Class</span>
          </label>
        ))}
      </div>

      {/* 🪑 Seat Map */}
      <div className="bg-gray-100 p-4 rounded-lg shadow-inner w-fit mx-auto">
        <div className="grid grid-cols-7 gap-2 text-center">
          {Array.from({ length: rows }, (_, rowIdx) =>
            cols.map((col, colIdx) => {
              const seat = `${col}${rowIdx + 1}`;
              const isSelected = selectedSeat === seat;
              const isBooked = bookedSeats.includes(seat);
              const isWindow = ["A", "F"].includes(col);
              const isAisle = ["C", "D"].includes(col);

              let bg = "bg-blue-200";
              if (isWindow) bg = "bg-blue-300";
              if (isAisle) bg = "bg-blue-100";
              if (isBooked) bg = "bg-gray-400 cursor-not-allowed opacity-60";
              if (isSelected) bg = "bg-green-600 text-white font-bold";

              // create aisle gap after column "C"
              if (col === "D" && colIdx === 3)
                return <div key={`gap-${rowIdx}`} className="w-6" />;

              return (
                <button
                  key={seat}
                  onClick={() => handleSeatSelect(seat)}
                  disabled={isBooked}
                  className={`${bg} rounded-md w-10 h-10 flex items-center justify-center 
                  hover:ring-2 hover:ring-green-500 transition`}
                >
                  {seat}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-300 rounded-sm"></div> Window
        </span>
        <span className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-100 rounded-sm"></div> Aisle
        </span>
        <span className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-400 rounded-sm"></div> Booked
        </span>
        <span className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-600 rounded-sm"></div> Selected
        </span>
      </div>

      {/* 💸 Price Display */}
      <div className="mt-6 text-center">
        <p className="text-lg font-semibold">
          💰 Final Price: <span className="text-blue-600">₹{finalPrice}</span>
        </p>
      </div>

      {/* Continue */}
      <div className="text-center mt-6">
        <button
          onClick={handleContinue}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md shadow-md transition"
        >
          Continue to Booking
        </button>
      </div>
    </div>
  );
}
