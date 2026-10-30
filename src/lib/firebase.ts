import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const env = import.meta.env;

export const firebaseApp = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(firebaseApp);

// Firestore is the largest dependency in the app, and the sign-in screen does not need it.
// It lives in its own module and is downloaded the first time something reads or writes data.
export const loadFirestore = () => import('./firestore');
