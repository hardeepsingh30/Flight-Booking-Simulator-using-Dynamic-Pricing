import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowPathIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'; // ✅ Better icons

export default function PaymentPage() {
  const { pnr } = useParams();
  const navigate = useNavigate();
  const [loadingType, setLoadingType] = useState(null); // "success" or "fail" while loading

  const handlePayment = async (status) => {
    setLoadingType(status);
    try {
      const res = await fetch(`http://127.0.0.1:8000/booking/pay/${pnr}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: status === "success" }),
      });

      if (!res.ok) throw new Error("Payment processing failed");
      await res.json();
      navigate(`/confirmation/${pnr}`);
    } catch (error) {
      alert("Error processing payment: " + error.message);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Payment for PNR: {pnr}</h1>
      <p className="mb-6 text-gray-600">Simulate a payment outcome below:</p>

      <div className="flex gap-4 justify-center">
        {/* ✅ Success Button */}
        <button
          disabled={loadingType === "success"}
          onClick={() => handlePayment("success")}
          className={`px-4 py-2 rounded flex items-center justify-center transition-colors ${
            loadingType === "success"
              ? "bg-green-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {loadingType === "success" ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CheckIcon className="w-5 h-5 mr-2" />
              Pay Successfully
            </>
          )}
        </button>

        {/* ❌ Fail Button */}
        <button
          disabled={loadingType === "fail"}
          onClick={() => handlePayment("fail")}
          className={`px-4 py-2 rounded flex items-center justify-center transition-colors ${
            loadingType === "fail"
              ? "bg-red-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {loadingType === "fail" ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <XMarkIcon className="w-5 h-5 mr-2" />
              Fail Payment
            </>
          )}
        </button>
      </div>
    </div>
  );
}
