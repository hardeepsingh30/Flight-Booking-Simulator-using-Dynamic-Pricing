// src/pages/PaymentPage.jsx
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  CreditCardIcon,
  WalletIcon,
  QrCodeIcon,
  WifiIcon,
  ShoppingBagIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function PaymentPage() {
  const { pnr } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const baseFare = location.state?.totalPrice || 0;

  const [addons, setAddons] = useState({
    meal: false,
    baggage: false,
    wifi: false,
  });
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loadingType, setLoadingType] = useState(null);
  const [totalAmount, setTotalAmount] = useState(baseFare);

  // 💰 Dynamic tax & total calculation
  useEffect(() => {
    const tax = baseFare * 0.18; // 18% GST
    const serviceFee = 150; // fixed airline charge
    const addOnPrice =
      (addons.meal ? 250 : 0) +
      (addons.baggage ? 500 : 0) +
      (addons.wifi ? 300 : 0);
    setTotalAmount(baseFare + tax + serviceFee + addOnPrice);
  }, [addons, baseFare]);

  const handleAddOnToggle = (key) => {
    setAddons((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePayment = async (status) => {
    setLoadingType(status);
    const isSuccess = status === "success";

    try {
      toast.loading(isSuccess ? "Processing payment..." : "Simulating failed payment...");

      const res = await fetch(`http://127.0.0.1:8000/booking/pay/${pnr}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: isSuccess, amount: totalAmount }),
      });

      toast.dismiss();

      if (!res.ok) throw new Error("Payment processing failed");
      await res.json();

      if (isSuccess) {
        toast.success("✅ Payment successful!");
        setTimeout(() => navigate(`/confirmation/${pnr}`, { state: { totalAmount } }), 1200);
      } else {
        toast.error("❌ Payment failed — booking not confirmed");
      }
    } catch (err) {
      toast.dismiss();
      toast.error("Error: " + err.message);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-gray-800">
        💳 Payment for Booking (PNR: {pnr})
      </h1>
      <p className="text-gray-500 mb-6">Please review and complete your payment below.</p>

      {/* 🔹 Price Breakdown */}
      <div className="bg-white border rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Fare Summary</h2>
        <ul className="text-gray-700 text-sm space-y-1">
          <li>Base Fare: ₹{baseFare.toFixed(2)}</li>
          <li>GST (18%): ₹{(baseFare * 0.18).toFixed(2)}</li>
          <li>Service Fee: ₹150.00</li>
          {addons.meal && <li>🍱 Meal Add-on: ₹250.00</li>}
          {addons.baggage && <li>🧳 Extra Baggage: ₹500.00</li>}
          {addons.wifi && <li>📶 In-flight WiFi: ₹300.00</li>}
          <hr className="my-2" />
          <li className="font-bold text-lg">
            Total: ₹{totalAmount.toFixed(2)}
          </li>
        </ul>
      </div>

      {/* 🍱 Add-on Options */}
      <div className="bg-gray-50 border rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3 text-gray-800">Optional Add-ons</h3>
        <div className="flex flex-wrap gap-4">
          <AddOnToggle
            icon={<ShoppingBagIcon className="w-5 h-5" />}
            label="Meal (₹250)"
            checked={addons.meal}
            onClick={() => handleAddOnToggle("meal")}
          />
          <AddOnToggle
            icon={<BriefcaseIcon className="w-5 h-5" />}
            label="Extra Baggage (₹500)"
            checked={addons.baggage}
            onClick={() => handleAddOnToggle("baggage")}
          />
          <AddOnToggle
            icon={<WifiIcon className="w-5 h-5" />}
            label="In-flight WiFi (₹300)"
            checked={addons.wifi}
            onClick={() => handleAddOnToggle("wifi")}
          />
        </div>
      </div>

      {/* 🏦 Payment Method Selection */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3 text-gray-800">Select Payment Method</h3>
        <div className="grid grid-cols-2 gap-4">
          <PaymentOption
            icon={<QrCodeIcon className="w-6 h-6" />}
            label="UPI"
            value="upi"
            selected={paymentMethod}
            onSelect={setPaymentMethod}
          />
          <PaymentOption
            icon={<CreditCardIcon className="w-6 h-6" />}
            label="Credit/Debit Card"
            value="card"
            selected={paymentMethod}
            onSelect={setPaymentMethod}
          />
          <PaymentOption
            icon={<WalletIcon className="w-6 h-6" />}
            label="Wallet"
            value="wallet"
            selected={paymentMethod}
            onSelect={setPaymentMethod}
          />
          <PaymentOption
            icon={<BriefcaseIcon className="w-6 h-6" />}
            label="Net Banking"
            value="netbanking"
            selected={paymentMethod}
            onSelect={setPaymentMethod}
          />
        </div>
      </div>

      {/* ✅ Action Buttons */}
      <div className="flex gap-4 justify-center mt-4">
        {/* Success */}
        <button
          disabled={loadingType === "success"}
          onClick={() => handlePayment("success")}
          className={`px-5 py-2 rounded flex items-center justify-center font-semibold transition ${
            loadingType === "success"
              ? "bg-green-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {loadingType === "success" ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" /> Processing...
            </>
          ) : (
            <>
              <CheckIcon className="w-5 h-5 mr-2" /> Pay ₹{totalAmount.toFixed(2)}
            </>
          )}
        </button>

        {/* Fail */}
        <button
          disabled={loadingType === "fail"}
          onClick={() => handlePayment("fail")}
          className={`px-5 py-2 rounded flex items-center justify-center font-semibold transition ${
            loadingType === "fail"
              ? "bg-red-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {loadingType === "fail" ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" /> Processing...
            </>
          ) : (
            <>
              <XMarkIcon className="w-5 h-5 mr-2" /> Fail Payment
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ✅ Add-on Component */
function AddOnToggle({ icon, label, checked, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`border rounded-lg flex items-center gap-2 px-3 py-2 transition ${
        checked ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ✅ Payment Method Card */
function PaymentOption({ icon, label, value, selected, onSelect }) {
  const isActive = selected === value;
  return (
    <button
      onClick={() => onSelect(value)}
      className={`border rounded-lg flex flex-col items-center justify-center p-3 transition ${
        isActive ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700"
      }`}
    >
      {icon}
      <span className="text-sm mt-1">{label}</span>
    </button>
  );
}
