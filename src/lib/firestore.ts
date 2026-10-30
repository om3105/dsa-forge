import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { firebaseApp } from './firebase';

export { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';

// Offline-first: reads come from the local cache when offline and writes are queued until the
// connection returns, so the app keeps working without a network (e.g. on the in-browser engines).
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
