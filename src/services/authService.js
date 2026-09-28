import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase/firebase";

export function register(email, password) {
  return createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
}

export function login(email, password) {
  return signInWithEmailAndPassword(
    auth,
    email,
    password
  );
}

export function logout() {
  return signOut(auth);
}