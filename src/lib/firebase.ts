import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';

const env = import.meta.env;

export const firebaseApp = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

// initializeAuth instead of getAuth: getAuth also sets up the popup/redirect helper, which on mobile
// browsers downloads Google's gapi script and an iframe before the signed-in state is known. If that
// script is slow or blocked (ad blockers, Brave, some networks) the app never gets past "Loading…".
// The helper is passed only to signInWithPopup instead (see auth.ts).
export const auth = initializeAuth(firebaseApp, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });

// Firestore is the largest dependency in the app, and the sign-in screen does not need it.
// It lives in its own module and is downloaded the first time something reads or writes data.
export const loadFirestore = () => import('./firestore');
