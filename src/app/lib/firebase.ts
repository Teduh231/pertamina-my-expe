// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
let app;
// Check if we are in the browser and Firebase has not been initialized.
if (typeof window !== 'undefined' && !getApps().length) {
    if (!firebaseConfig.apiKey) {
        console.error("Firebase API Key is missing. Please check your .env file.");
        app = null;
    } else {
        app = initializeApp(firebaseConfig);
    }
} else if (getApps().length) {
    app = getApp();
}


const auth = app ? getAuth(app) : null;

export { app, auth };
