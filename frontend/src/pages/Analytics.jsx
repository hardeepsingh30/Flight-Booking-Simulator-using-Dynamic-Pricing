import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import toast from "react-hot-toast";

export default function Analytics() {
  const [trendData, setTrendData] = useState([]);
  const [routeData, setRouteData] = useState([]);
  const [airlineData, setAirlineData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // ✅ Updated endpoints — must match backend names
        const [trendRes, routeRes, airlineRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/dashboard/bookings_trend"),
          fetch("http://127.0.0.1:8000/dashboard/top_routes"),
          fetch("http://127.0.0.1:8000/dashboard/airline_stats"), // ✅ fixed endpoint
        ]);

        if (!trendRes.ok || !routeRes.ok || !airlineRes.ok) {
          throw new Error("Failed to fetch analytics data");
        }

        const trendJson = await trendRes.json();
        const routeJson = await routeRes.json();
        const airlineJson = await airlineRes.json();

        setTrendData(trendJson);
        setRouteData(routeJson);

        // ✅ Map backend keys to Recharts Pie format
        setAirlineData(
          airlineJson.map((a) => ({
            name: a.airline, // airline name
            value: a.bookings, // number of bookings
          }))
        );
      } catch (err) {
        console.error(err);
        toast.error("⚠️ Failed to fetch analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

  if (loading) {
    return (
      <div className="text-center text-gray-500 animate-pulse">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">📊 Analytics Overview</h1>

      {/* ✅ Weekly Booking Trends */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Weekly Booking Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="bookings"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ✅ Top Routes */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Top Routes by Bookings</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={routeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="route" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="bookings" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ✅ Airline Performance */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Airline Performance Share</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={airlineData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {airlineData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
