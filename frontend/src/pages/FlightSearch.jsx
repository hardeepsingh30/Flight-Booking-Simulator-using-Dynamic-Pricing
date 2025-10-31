// src/pages/FlightSearch.jsx
import {
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function FlightSearch() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [tripType, setTripType] = useState("oneway");
  const [date, setDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [flights, setFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);
  const [outboundFlight, setOutboundFlight] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Auto-load top 20 flights initially
  useEffect(() => {
    const fetchInitialFlights = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/flights?limit=20");
        if (!res.ok) throw new Error("Failed to load flights");
        const data = await res.json();
        setFlights(data);
        toast.success(`Showing ${data.length} available flights ✈️`);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialFlights();
  }, []);

  // 🔍 Search Flights
  const handleSearch = async () => {
    if (!origin && !destination && !date) {
      toast.error("Enter origin, destination or date!");
      return;
    }

    setFlights([]);
    setReturnFlights([]);
    setOutboundFlight(null);
    setLoading(true);

    try {
      const url = new URL("http://127.0.0.1:8000/search");
      if (origin) url.searchParams.append("origin", origin);
      if (destination) url.searchParams.append("destination", destination);
      if (date) url.searchParams.append("date", new Date(date).toISOString());

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch flights");
      const data = await res.json();
      setFlights(data);

      if (tripType === "roundtrip" && returnDate) {
        const retUrl = new URL("http://127.0.0.1:8000/search");
        retUrl.searchParams.append("origin", destination);
        retUrl.searchParams.append("destination", origin);
        retUrl.searchParams.append("date", new Date(returnDate).toISOString());
        const retRes = await fetch(retUrl);
        if (retRes.ok) setReturnFlights(await retRes.json());
      }

      toast.success(`Found ${data.length} matching flights!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🛫 Select Outbound
  const handleSelectOutbound = (flight) => {
    if (tripType === "oneway") {
      navigate(`/select-seat/${flight.id}`);
    } else {
      setOutboundFlight(flight);
      toast("Now select your return flight 🔁", { icon: "🛫" });
    }
  };

  // 🛬 Select Return
  const handleSelectReturn = (returnFlight) => {
    navigate(`/select-seat/${outboundFlight.id}`, {
      state: { returnFlight },
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Flight Search ✈️</h1>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
        >
          <ArrowPathIcon className="w-5 h-5" />
          Refresh
        </button>
      </div>

      {/* Trip Type Selection */}
      <div className="flex items-center gap-6 mb-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="tripType"
            value="oneway"
            checked={tripType === "oneway"}
            onChange={() => setTripType("oneway")}
          />
          Oneway
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="tripType"
            value="roundtrip"
            checked={tripType === "roundtrip"}
            onChange={() => setTripType("roundtrip")}
          />
          Roundtrip
        </label>
      </div>

      {/* Search Inputs */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          className="border p-2 w-full md:w-1/4"
          placeholder="From (e.g. Mumbai)"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
        <input
          className="border p-2 w-full md:w-1/4"
          placeholder="To (e.g. Delhi)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <input
          type="date"
          className="border p-2 w-full md:w-1/4"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {tripType === "roundtrip" && (
          <input
            type="date"
            className="border p-2 w-full md:w-1/4"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        )}
        <button
          onClick={handleSearch}
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${
            loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Flights List */}
      {loading ? (
        <p className="text-gray-500 animate-pulse">Loading flights...</p>
      ) : flights.length > 0 ? (
        <>
          {!outboundFlight && (
            <>
              <h2 className="font-bold mb-3 text-lg">Select Outbound Flight 🛫</h2>
              {flights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  onSelect={() => handleSelectOutbound(flight)}
                />
              ))}
            </>
          )}
          {outboundFlight && returnFlights.length > 0 && (
            <>
              <h2 className="font-bold mb-3 text-lg text-green-600">
                Select Return Flight 🛬
              </h2>
              {returnFlights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  onSelect={() => handleSelectReturn(flight)}
                />
              ))}
            </>
          )}
        </>
      ) : (
        <p className="text-gray-500 mt-4">
          No flights available right now 😕
        </p>
      )}
    </div>
  );
}

/* ✈️ Reusable Flight Card */
function FlightCard({ flight, onSelect }) {
  return (
    <div className="p-4 border rounded mb-4 bg-white hover:shadow-xl transition-all cursor-pointer">
      <h2 className="font-bold flex items-center justify-between text-lg text-gray-800">
        <span className="flex items-center">
          <PaperAirplaneIcon className="w-4 h-4 mr-2 text-blue-600" />
          {flight.flight_no} ({flight.airline_name || "Unknown"})
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
        >
          Book
        </button>
      </h2>
      <p>
        {flight.origin} → {flight.destination}
      </p>
      <p>Departure: {new Date(flight.departure).toLocaleString()}</p>
      <p>Base Fare: ₹{flight.base_fare}</p>
      <p className="text-sm text-gray-500">
        Seats Available: {flight.seats_available}
      </p>
    </div>
  );
}
