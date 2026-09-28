import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBhurjY7rf4p9oJv27qATBfSo9za5oj0DQ",
  authDomain: "homestock-96a13.firebaseapp.com",
  projectId: "homestock-96a13",
  storageBucket: "homestock-96a13.firebasestorage.app",
  messagingSenderId: "335437409268",
  appId: "1:335437409268:web:408fc70024d3bfe8f1a7a1",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export {
  auth,
  db,
};

export default app;