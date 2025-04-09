import { initializeApp, getApps } from "firebase/app";
import { getAuth, User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDMEw7UBh3hrCzcaQBZvVReKlzK0RwqUtg",
  authDomain: "chat-22898.firebaseapp.com",
  projectId: "chat-22898",
  storageBucket: "chat-22898.firebasestorage.app",
  messagingSenderId: "548998420951",
  appId: "1:548998420951:web:8858717b1952e2005e5392",
  measurementId: "G-YQ0JYY8HWY",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
export type { User };
