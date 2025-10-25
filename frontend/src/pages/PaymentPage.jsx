import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function PaymentPage() {
  const { pnr } = useParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState("");  // "success" or "fail"
  const [loading, setLoading] = useState(false);

const handlePayment = async (status) => {
  setLoading(true);
  try {
    const res = await fetch(`http://127.0.0.1:8000/booking/pay/${pnr}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: status === "success" }),  // ✅ Fixed: Send { success: true/false }
    });
    if (!res.ok) throw new Error("Payment processing failed");
    const data = await res.json();
    navigate(`/confirmation/${pnr}`);
  } catch (error) {
    alert("Error processing payment: " + error.message);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Payment for PNR: {pnr}</h1>
      <p className="mb-4">Simulate payment: Choose Success or Fail.</p>
      <div className="flex gap-4">
        <button
          disabled={loading}
          onClick={() => handlePayment("success")}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          {loading ? "Processing..." : "Pay Successfully"}
        </button>
        <button
          disabled={loading}
          onClick={() => handlePayment("fail")}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          {loading ? "Processing..." : "Fail Payment"}
        </button>
      </div>
    </div>
  );
}