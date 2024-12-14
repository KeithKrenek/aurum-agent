// Import the required Firebase modules
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getAnalytics } from "firebase/analytics";

const requireEnvVar = (name: string): string => {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

// Firebase configuration
const firebaseConfig = {
  apiKey: requireEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: requireEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: requireEnvVar('VITE_FIREBASE_MEASUREMENT_ID')
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);
// const analytics = getAnalytics(app);

// Export the Firestore database
export { db };
