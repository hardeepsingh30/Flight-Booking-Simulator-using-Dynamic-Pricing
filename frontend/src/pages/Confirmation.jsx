// src/pages/Confirmation.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import {
  ArrowPathIcon,
  DocumentArrowDownIcon,
  HomeIcon,
  CheckCircleIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/solid";

export default function Confirmation() {
  const { pnr } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/booking/${pnr}`);
        if (!res.ok) throw new Error("Booking not found.");
        const data = await res.json();
        setBooking(data);
        toast.success("🎉 Booking Confirmed!");
        const qrData = `PNR: ${data.pnr}\nPassenger: ${data.passenger_name}\nFlight: ${data.flight_no}\nFrom: ${data.origin}\nTo: ${data.destination}\nDeparture: ${new Date(
          data.departure
        ).toLocaleString()}`;
        const qrCode = await QRCode.toDataURL(qrData);
        setQr(qrCode);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [pnr]);

  const downloadReceipt = async () => {
    if (!booking) return toast.error("No booking data found");

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("✈️ Flight E-Ticket Receipt", 10, 10);
    doc.setFontSize(11);
    doc.text(`PNR: ${booking.pnr}`, 10, 25);
    doc.text(`Passenger: ${booking.passenger_name}`, 10, 35);
    doc.text(
      `Flight: ${booking.flight_no} (${booking.origin} → ${booking.destination})`,
      10,
      45
    );
    doc.text(`Departure: ${new Date(booking.departure).toLocaleString()}`, 10, 55);
    doc.text(`Arrival: ${new Date(booking.arrival).toLocaleString()}`, 10, 65);
    doc.text(`Status: ${booking.status}`, 10, 75);
    doc.text(`Payment: ${booking.payment_status}`, 10, 85);
    doc.text(`Price Paid: ₹${booking.price_paid}`, 10, 95);
    doc.addImage(qr, "PNG", 150, 25, 45, 45);
    doc.setFontSize(10);
    doc.text("Generated via FlightSim Booking System", 10, 115);
    doc.save(`Flight_Receipt_${pnr}.pdf`);
    toast.success("📄 E-Ticket Downloaded Successfully!");
  };

  const sendEmailTicket = async () => {
    if (!booking) return toast.error("No booking data found");
    setEmailLoading(true);
    try {
      toast.loading("Sending e-ticket via email...");
      const res = await fetch(`http://127.0.0.1:8000/email_ticket/${pnr}`, {
        method: "POST",
      });
      toast.dismiss();
      if (!res.ok) throw new Error("Failed to send e-ticket");
      const data = await res.json();
      toast.success("📧 E-ticket sent successfully!");
    } catch (err) {
      toast.dismiss();
      toast.error(err.message);
    } finally {
      setEmailLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <ArrowPathIcon className="w-10 h-10 text-blue-600 animate-spin mb-3" />
        <p className="text-gray-500">Fetching booking details...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex flex-col items-center justify-center p-6">
      {booking ? (
        <div className="bg-white shadow-2xl rounded-2xl w-full max-w-lg p-6 border-t-8 border-blue-600 relative animate-fade-in">
          {/* ✅ Success Animation */}
          <div className="flex justify-center mb-3">
            <CheckCircleIcon className="w-16 h-16 text-green-500 animate-bounce" />
          </div>

          <h2 className="text-2xl font-bold text-center text-blue-700 mb-2">
            Flight Booking Confirmed
          </h2>
          <p className="text-center text-gray-500 mb-6">PNR: {booking.pnr}</p>

          {/* ✈️ Ticket Info Section */}
          <div className="bg-gray-50 border rounded-lg p-4 mb-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3 text-gray-700 text-sm">
              <p>
                <strong>Passenger:</strong>
                <br />
                {booking.passenger_name}
              </p>
              <p>
                <strong>Flight:</strong>
                <br />
                {booking.flight_no}
              </p>
              <p>
                <strong>From:</strong>
                <br />
                {booking.origin}
              </p>
              <p>
                <strong>To:</strong>
                <br />
                {booking.destination}
              </p>
              <p>
                <strong>Departure:</strong>
                <br />
                {new Date(booking.departure).toLocaleString()}
              </p>
              <p>
                <strong>Arrival:</strong>
                <br />
                {new Date(booking.arrival).toLocaleString()}
              </p>
              <p>
                <strong>Price Paid:</strong>
                <br />₹{booking.price_paid}
              </p>
              <p>
                <strong>Status:</strong>
                <br />
                <span className="text-green-600 font-semibold">{booking.status}</span>
              </p>
            </div>
          </div>

          {/* 🧾 Payment Info */}
          <div className="text-center mb-4">
            <p className="text-gray-700">
              <strong>Payment Status:</strong>{" "}
              <span className="text-green-600 font-semibold">
                {booking.payment_status}
              </span>
            </p>
          </div>

          {/* 🧾 QR Code */}
          {qr && (
            <div className="flex justify-center my-4">
              <img
                src={qr}
                alt="Booking QR"
                className="w-28 h-28 border rounded-lg shadow-md"
              />
            </div>
          )}

          {/* 🎟️ Buttons */}
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <button
              onClick={downloadReceipt}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Download Ticket
            </button>

            <button
              disabled={emailLoading}
              onClick={sendEmailTicket}
              className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                emailLoading
                  ? "bg-indigo-400 cursor-not-allowed text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              <EnvelopeIcon className="w-5 h-5 mr-2" />
              {emailLoading ? "Sending..." : "Email Ticket"}
            </button>

            <button
              onClick={() => navigate("/")}
              className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Back Home
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center text-red-500">Booking not found or expired.</p>
      )}
    </div>
  );
}
