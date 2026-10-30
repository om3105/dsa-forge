import { useSyncExternalStore } from 'react';
import {
  GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification,
  sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut as fbSignOut, updateProfile, type User,
} from 'firebase/auth';
import { auth, loadFirestore } from './firebase';
import { useAccountRepo } from '../store/repo';
import { flushPending, loadAll } from '../store/store';

export interface AuthState { ready: boolean; user: User | null }
let state: AuthState = { ready: false, user: null };
const listeners = new Set<() => void>();
const set = (s: AuthState) => { state = s; listeners.forEach((l) => l()); };

onAuthStateChanged(auth, async (user) => {
  useAccountRepo(user?.uid ?? null);
  if (user) {
    // profile document: who owns this data (merge keeps createdAt from the first sign-in)
    void loadFirestore().then(({ db, doc, setDoc, serverTimestamp }) => setDoc(doc(db, `users/${user.uid}`), {
      email: user.email, displayName: user.displayName ?? null, lastSignInAt: serverTimestamp(),
    }, { merge: true })).catch(() => {});
    await loadAll();
  }
  set({ ready: true, user });
});

export const useAuth = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state);

export async function signUp(name: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
  const { db, doc, setDoc, serverTimestamp } = await loadFirestore();
  await setDoc(doc(db, `users/${cred.user.uid}`), { createdAt: serverTimestamp(), displayName: name.trim() || null }, { merge: true });
  void sendEmailVerification(cred.user).catch(() => {});
}

export const signIn = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
export const signInWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);
export async function signOut() {
  await flushPending();
  await fbSignOut(auth);
}

/** Firebase error codes → messages a person can act on. */
export function authMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-email': 'That email address does not look right.',
    'auth/missing-password': 'Enter your password.',
    'auth/weak-password': 'Use at least 6 characters for the password.',
    'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/user-not-found': 'No account with this email. Create one instead.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/too-many-requests': 'Too many attempts. Wait a minute, or reset your password.',
    'auth/popup-closed-by-user': 'The Google window was closed before signing in.',
    'auth/popup-blocked': 'The browser blocked the Google pop-up. Allow pop-ups for this site and try again.',
    'auth/network-request-failed': 'No connection to Firebase. Check your internet and try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled for the project.',
    'auth/unauthorized-domain': `Sign-in is not allowed from ${location.hostname}. Add it under Firebase console → Authentication → Settings → Authorized domains.`,
  };
  return map[code] ?? ((e as Error)?.message || 'Something went wrong. Try again.');
}
