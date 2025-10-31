import { useEffect, useState } from "react";
import { DocumentArrowDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import jsPDF from "jspdf";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/bookings")
      .then((res) => res.json())
      .then((data) => setBookings(data))
      .catch((err) => alert("Error loading bookings: " + err.message));
  }, []);

  const cancelBooking = async (pnr) => {
    if (!window.confirm(`Cancel booking ${pnr}?`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/booking/cancel/${pnr}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Cancel failed");
      alert(`Booking ${pnr} cancelled.`);
      setBookings((prev) =>
        prev.map((b) =>
          b.pnr === pnr ? { ...b, status: "CANCELLED" } : b
        )
      );
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const downloadReceipt = (b) => {
    const doc = new jsPDF();
    doc.text(`Booking Receipt - ${b.pnr}`, 10, 10);
    doc.text(`Status: ${b.status}`, 10, 20);
    doc.text(`Flight: ${b.flight_no} (${b.origin} → ${b.destination})`, 10, 30);
    doc.text(`Passenger: ${b.passenger_name}`, 10, 40);
    doc.text(`Phone: ${b.passenger_phone || "N/A"}`, 10, 50);
    doc.text(`Price Paid: ₹${b.price_paid}`, 10, 60);
    doc.text(`Payment: ${b.payment_status}`, 10, 70);
    doc.save(`receipt_${b.pnr}.pdf`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Bookings 🧳</h1>
      {bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <div className="grid gap-4">
          {bookings.map((b) => (
            <div
              key={b.pnr}
              className={`border p-4 rounded ${
                b.status === "CANCELLED"
                  ? "bg-red-50 border-red-300"
                  : "bg-green-50 border-green-300"
              }`}
            >
              <h2 className="font-bold">{b.flight_no} ({b.origin} → {b.destination})</h2>
              <p><strong>PNR:</strong> {b.pnr}</p>
              <p><strong>Passenger:</strong> {b.passenger_name}</p>
              <p><strong>Status:</strong> {b.status}</p>
              <p><strong>Payment:</strong> {b.payment_status}</p>
              <div className="mt-2 flex gap-3">
                <button
                  onClick={() => downloadReceipt(b)}
                  className="bg-blue-500 text-white px-3 py-1 rounded flex items-center hover:bg-blue-600"
                >
                  <DocumentArrowDownIcon className="w-5 h-5 mr-1" /> Receipt
                </button>
                {b.status !== "CANCELLED" && (
                  <button
                    onClick={() => cancelBooking(b.pnr)}
                    className="bg-red-500 text-white px-3 py-1 rounded flex items-center hover:bg-red-600"
                  >
                    <XMarkIcon className="w-5 h-5 mr-1" /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
