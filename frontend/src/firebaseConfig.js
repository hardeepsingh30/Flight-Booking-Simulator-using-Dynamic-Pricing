// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDpUuKrF8Sup42lPeukw88aqQqZNcIWd-M",
  authDomain: "flight-simulator-88b10.firebaseapp.com",
  projectId: "flight-simulator-88b10",
  storageBucket: "flight-simulator-88b10.firebasestorage.app",
  messagingSenderId: "45086999791",
  appId: "1:45086999791:web:c0f8a2a66d207dcf66c71a"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
