// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCs_gLPZvGuO4C3IJLAGO7hx_gshUjjpnc",
  authDomain: "udent-attendence.firebaseapp.com",
  projectId: "udent-attendence",
  storageBucket: "udent-attendence.appspot.com",
  messagingSenderId: "716399500900",
  appId: "1:716399500900:web:b30cc06ce8f63a45120971",
  measurementId: "G-5MS78JT87Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);