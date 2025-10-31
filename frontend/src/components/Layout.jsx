// src/components/Layout.jsx
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // ✅ Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("flightsim_user");
    if (storedUser) setUser(storedUser);
  }, []);

  // ✅ Logout handler
  const handleLogout = () => {
    localStorage.removeItem("flightsim_user");
    setUser(null);
    toast.success("Logged out successfully 👋");
    navigate("/login");
  };

  const navLinks = [
    { path: "/", label: "Dashboard" },
    { path: "/flights", label: "Flights" },
    { path: "/bookings", label: "Bookings" },
    { path: "/analytics", label: "Analytics" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ✅ Top Navbar */}
      <header className="bg-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center p-4">
          
          {/* ✈️ Left: Logo */}
          <h1
            className="text-xl font-bold tracking-wide cursor-pointer hover:text-blue-200 transition"
            onClick={() => navigate("/")}
          >
            ✈️ FlightSim
          </h1>

          {/* 🧭 Middle: Navigation Links */}
          <nav className="flex space-x-6">
            {navLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`transition-all ${
                  location.pathname === path
                    ? "border-b-2 border-white font-semibold"
                    : "hover:text-blue-200"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* 👤 Right: User Account */}
          <div className="text-sm flex items-center space-x-3">
            {user ? (
              <>
                <span className="text-blue-100">👤 {user}</span>
                <button
                  onClick={handleLogout}
                  className="bg-white text-blue-700 px-3 py-1 rounded hover:bg-blue-100 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-white text-blue-700 px-3 py-1 rounded hover:bg-blue-100 transition"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ✅ Main Content Area */}
      <main className="flex-1 container mx-auto p-6 animate-fade-in">
        <Outlet />
      </main>

      {/* ✅ Footer (Optional, aesthetic touch) */}
      <footer className="text-center text-gray-500 py-3 border-t text-sm">
        © {new Date().getFullYear()} FlightSim • Built for Realistic Flight Booking Simulations
      </footer>
    </div>
  );
}
