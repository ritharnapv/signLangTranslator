import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Configuration injected by Firebase Setup
const firebaseConfig = {
  apiKey: "AIzaSyDt9ESHJ763_tVJSPMiHRhjAUXfTfAdGek",
  authDomain: "cosmic-light-jjcsn.firebaseapp.com",
  projectId: "cosmic-light-jjcsn",
  storageBucket: "cosmic-light-jjcsn.firebasestorage.app",
  messagingSenderId: "679564832427",
  appId: "1:679564832427:web:9f9d942cc65506333c91ee"
};

// Initialize App
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = initializeFirestore(app, {});

export default app;
