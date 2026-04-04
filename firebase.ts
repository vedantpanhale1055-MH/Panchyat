import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBJ9E3q2UVpkQokssYOPZ0AM0fbE0VcXmY",
  authDomain: "panchyat-ce15b.firebaseapp.com",
  projectId: "panchyat-ce15b",
  storageBucket: "panchyat-ce15b.firebasestorage.app",
  messagingSenderId: "22302207646",
  appId: "1:22302207646:web:b3b277bc64547eebd6d58f",
  measurementId: "G-2E77F5LZKK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);