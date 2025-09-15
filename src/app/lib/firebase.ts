// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyABNZ6udfWn4M_eBf1e5nKyew8218CIJLY",
  authDomain: "paperless-homecareku.firebaseapp.com",
  projectId: "paperless-homecareku",
  storageBucket: "paperless-homecareku.firebasestorage.app",
  messagingSenderId: "255098292913",
  appId: "1:255098292913:web:448408aec235e8ec62f090"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
