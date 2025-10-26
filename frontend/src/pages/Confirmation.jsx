import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';  // ✅ Icon imported

export default function Confirmation() {
  const { pnr } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/booking/${pnr}`)
      .then((res) => res.json())
      .then((data) => setBooking(data))
      .catch((error) => alert("Error loading booking: " + error.message));
  }, [pnr]);

  const downloadReceipt = () => {
    if (!booking) return;
    const doc = new jsPDF();
    doc.text(`Booking Receipt - PNR: ${booking.pnr}`, 10, 10);
    doc.text(`Status: ${booking.status}`, 10, 20);
    doc.text(`Flight: ${booking.flight_no} (${booking.origin} → ${booking.destination})`, 10, 30);
    doc.text(`Passenger: ${booking.passenger_name}`, 10, 40);
    doc.text(`Phone: ${booking.passenger_phone || 'N/A'}`, 10, 50);
    doc.text(`Price: ₹${booking.price_paid}`, 10, 60);
    doc.text(`Payment Status: ${booking.payment_status}`, 10, 70);
    doc.text(`Departure: ${new Date(booking.departure).toLocaleString()}`, 10, 80);
    doc.text(`Arrival: ${new Date(booking.arrival).toLocaleString()}`, 10, 90);
    doc.text(`Timestamp: ${new Date().toISOString()}`, 10, 100);
    doc.save(`receipt_${pnr}.pdf`);
  };

  return (
    <div className="p-6 max-w-lg mx-auto animate-fade-in">  {/* ✅ Fade-in animation added */}
      <h1 className="text-2xl font-bold mb-4">Booking Confirmation</h1>
      {booking ? (
        <div className="border p-4 rounded bg-green-50">
          <p><strong>PNR:</strong> {booking.pnr}</p>
          <p><strong>Status:</strong> {booking.status}</p>
          <p><strong>Flight:</strong> {booking.flight_no} ({booking.origin} → {booking.destination})</p>  {/* ✅ Fixed: Flat fields */}
          <p><strong>Passenger:</strong> {booking.passenger_name}</p>  {/* ✅ Fixed */}
          <p><strong>Phone:</strong> {booking.passenger_phone || 'N/A'}</p>
          <p><strong>Price:</strong> ₹{booking.price_paid}</p>  {/* ✅ Fixed */}
          <p><strong>Payment Status:</strong> {booking.payment_status}</p>
          <button
            onClick={downloadReceipt}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors flex items-center"
          >
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />  {/* ✅ Download icon added */}
            Download Receipt (PDF)
          </button>
          <button
            onClick={() => navigate("/")}
            className="mt-2 ml-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Search More Flights
          </button>
        </div>
      ) : (
        <p>Loading booking details...</p>
      )}
    </div>
  );
}
