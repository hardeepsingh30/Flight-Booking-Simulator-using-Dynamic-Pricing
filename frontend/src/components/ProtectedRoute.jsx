// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const user = localStorage.getItem("flightsim_user");

  // If not logged in → redirect to login
  if (!user) {
    toast.error("Please login to continue!");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Allow access if logged in
  return children;
}
