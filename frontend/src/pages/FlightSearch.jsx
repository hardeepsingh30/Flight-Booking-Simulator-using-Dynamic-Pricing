import { MagnifyingGlassIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FlightSearch() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false); // ✅ NEW: Loading state
  const navigate = useNavigate();

  const handleSearch = async () => {
    setLoading(true); // ✅ Start loading
    const formattedDate = date ? new Date(date).toISOString() : null;

    const url = new URL("http://127.0.0.1:8000/search");
    if (origin) url.searchParams.append("origin", origin);
    if (destination) url.searchParams.append("destination", destination);
    if (formattedDate) url.searchParams.append("date", formattedDate);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch flights");
      const data = await res.json();
      setFlights(data);
    } catch (error) {
      alert("Error fetching flights: " + error.message);
    } finally {
      setLoading(false); // ✅ Stop loading
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Search Flights ✈️</h1>

      <div className="flex gap-4 mb-6">
        <input
          className="border p-2 w-full"
          placeholder="From (e.g. Mumbai)"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
        <input
          className="border p-2 w-full"
          placeholder="To (e.g. Delhi)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <input
          type="date"
          className="border p-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          onClick={handleSearch}
          disabled={loading} // ✅ Disable while loading
          className={`px-4 py-2 rounded flex items-center transition-colors text-white 
          ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}
        >
          {loading ? (
            <span className="flex items-center animate-pulse">
              <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
              Searching...
            </span>
          ) : (
            <>
              <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
              Search
            </>
          )}
        </button>
      </div>

      <div>
        {flights.length === 0 ? (
          <p>No flights yet. Try searching 👆</p>
        ) : (
          flights.map((flight) => (
            <div
              key={flight.id}
              className="p-4 border rounded mb-4 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <h2 className="font-bold flex items-center">
                <PaperAirplaneIcon className="w-4 h-4 mr-2 text-blue-600" />
                {flight.flight_no}
              </h2>
              <p>{flight.origin} → {flight.destination}</p>
              <p>Departure: {new Date(flight.departure).toLocaleString()}</p>
              <p>Base Fare: ₹{flight.base_fare}</p>
              <button
                onClick={() => navigate(`/book/${flight.id}`)}
                className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
              >
                Book Now
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
