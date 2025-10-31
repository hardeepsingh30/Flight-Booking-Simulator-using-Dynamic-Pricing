import { useEffect, useState } from "react";
import {
  ChartBarIcon,
  UserGroupIcon,
  CurrencyRupeeIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [stats, setStats] = useState({
    flights: 0,
    bookings: 0,
    revenue: 0,
    passengers: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);

      const [statsRes, trendRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/dashboard/stats"),
        fetch("http://127.0.0.1:8000/dashboard/bookings_trend"),
      ]);

      if (!statsRes.ok || !trendRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const statsData = await statsRes.json();
      const trendData = await trendRes.json();

      setStats(statsData);
      setChartData(trendData);

      if (showToast) toast.success("✅ Dashboard refreshed");
    } catch (err) {
      toast.error("⚠️ Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ Initial fetch + Auto refresh every 60s
  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center text-gray-500 animate-pulse mt-10">
        Loading dashboard data...
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard Overview
        </h1>
        <button
          onClick={() => fetchDashboardData(true)}
          className={`flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition ${
            refreshing ? "opacity-50 cursor-wait" : ""
          }`}
          disabled={refreshing}
        >
          <ArrowPathIcon
            className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ✅ Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          icon={<PaperAirplaneIcon className="w-8 h-8 text-blue-600" />}
          label="Total Flights"
          value={stats.flights}
        />
        <Card
          icon={<UserGroupIcon className="w-8 h-8 text-green-600" />}
          label="Bookings"
          value={stats.bookings}
        />
        <Card
          icon={<CurrencyRupeeIcon className="w-8 h-8 text-yellow-600" />}
          label="Revenue"
          value={`₹${Number(stats.revenue || 0).toLocaleString()}`}
        />
        <Card
          icon={<ChartBarIcon className="w-8 h-8 text-purple-600" />}
          label="Passengers"
          value={stats.passengers}
        />
      </div>

      {/* ✅ Chart Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4 flex justify-between items-center">
          Weekly Booking Trends
          <span className="text-sm text-gray-400">
            Auto-refreshes every 60s ⏱️
          </span>
        </h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bookings" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center">
            No booking trend data available 📉
          </p>
        )}
      </div>
    </div>
  );
}

/* ✅ Reusable Card Component */
function Card({ icon, label, value }) {
  return (
    <div className="flex items-center bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
      <div className="p-3 bg-gray-100 rounded-full mr-4">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <h3 className="text-xl font-semibold text-gray-800">{value}</h3>
      </div>
    </div>
  );
}
