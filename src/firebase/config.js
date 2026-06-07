import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Initialize Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// --- CONFIG VALIDATION ---
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missingKeys.length > 0) {
  console.warn(`[Firebase] Missing environment variables: ${missingKeys.join(", ")}.\nCreate a .env.local file with your Firebase project credentials.`);
}

const app = initializeApp(firebaseConfig);

// Initialize App Check if ReCaptcha Site Key is provided
if (typeof window !== "undefined" && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });
}

// Initialize Services — wrapped to avoid crashing the React tree when keys are missing
export const db = getFirestore(app);

// Auth is the only service that throws hard on missing apiKey — wrap it gracefully
let auth;
try {
  auth = getAuth(app);
} catch (e) {
  console.warn("[Firebase] Auth initialization failed (missing credentials?):", e.message);
  // Return a stub so the app doesn't crash — auth-gated pages will just redirect
  auth = null;
}
export { auth };

export const storage = getStorage(app);
