import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "react-hot-toast"; // ✅ Toast provider import

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    {/* ✅ Global toast notification setup */}
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#333",
          color: "#fff",
          borderRadius: "10px",
          fontSize: "0.9rem",
        },
        success: {
          iconTheme: {
            primary: "#4ade80", // Tailwind green-400
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444", // Tailwind red-500
            secondary: "#fff",
          },
        },
      }}
    />
  </React.StrictMode>
);
