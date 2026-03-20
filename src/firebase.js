import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDe7BDHcxksqNkExUvZB3UIZAr9hBdg14Q",
  authDomain: "cobranzas-f092a.firebaseapp.com",
  projectId: "cobranzas-f092a",
  storageBucket: "cobranzas-f092a.firebasestorage.app",
  messagingSenderId: "2530313930",
  appId: "1:2530313930:web:c7e1041d7059fafec25633"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
export default app;
