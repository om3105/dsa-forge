/* Storage boundary. Everything persistent goes through this interface.
   Signed in: Cloud Firestore under users/{uid}/… (with Firestore's offline cache).
   The IndexedDB repo remains for data created before accounts existed, which is migrated on first sign-in. */
import { createStore, del, get, keys, set } from 'idb-keyval';
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Repo {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
  keys(prefix: string): Promise<string[]>;
}

class IdbRepo implements Repo {
  private store = createStore('dsa-forge', 'kv');
  get<T>(key: string) { return get<T>(key, this.store); }
  set(key: string, value: unknown) { return set(key, value, this.store); }
  del(key: string) { return del(key, this.store); }
  async keys(prefix: string) { return (await keys(this.store)).map(String).filter((k) => k.startsWith(prefix)); }
}

/** Maps app keys onto per-user Firestore documents. Values are stored as JSON strings because
 *  Firestore rejects `undefined` fields and nested arrays, both of which the app state can contain. */
class FirestoreRepo implements Repo {
  constructor(private uid: string) {}

  private ref(key: string) {
    const base = `users/${this.uid}`;
    if (key === KEYS.settings) return doc(db, `${base}/meta/settings`);
    const course = /^v1:course:(\w+)$/.exec(key);
    if (course) return doc(db, `${base}/courses/${course[1]}`);
    const code = /^v1:code:(\w+):(.+)$/.exec(key);
    if (code) return doc(db, `${base}/code/${code[1]}__${code[2]}`);
    return doc(db, `${base}/meta/${encodeURIComponent(key)}`);
  }

  async get<T>(key: string): Promise<T | undefined> {
    const snap = await getDoc(this.ref(key));
    const json = snap.exists() ? (snap.data().json as string | undefined) : undefined;
    return json === undefined ? undefined : (JSON.parse(json) as T);
  }

  async set(key: string, value: unknown) {
    const code = /^v1:code:(\w+):/.exec(key);
    await setDoc(this.ref(key), { json: JSON.stringify(value), updatedAt: serverTimestamp(), ...(code ? { course: code[1] } : {}) });
  }

  async del(key: string) { await deleteDoc(this.ref(key)); }

  async keys(prefix: string): Promise<string[]> {
    const code = /^v1:code:(\w+):$/.exec(prefix);
    if (!code) return [];
    const snap = await getDocs(query(collection(db, `users/${this.uid}/code`), where('course', '==', code[1])));
    return snap.docs.map((d) => `v1:code:${code[1]}:${d.id.slice(code[1].length + 2)}`);
  }
}

export const localRepo: Repo = new IdbRepo();
let active: Repo = localRepo;
let activeUid: string | null = null;

/** Switch storage to the signed-in user's cloud data (null = signed out). */
export function useAccountRepo(uid: string | null) {
  activeUid = uid;
  active = uid ? new FirestoreRepo(uid) : localRepo;
}
export const getRepo = async (): Promise<Repo> => active;
export const currentUid = () => activeUid;

export const KEYS = {
  settings: 'v1:settings',
  course: (c: string) => `v1:course:${c}`,
  code: (c: string, pid: string) => `v1:code:${c}:${pid}`,
  codePrefix: (c: string) => `v1:code:${c}:`,
};
