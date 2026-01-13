
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add your own Firebase configuration from your Firebase project console
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAWnCqu3elyP3JauJluddp9ATEaPxtxIfk",
  authDomain: "aarya-attend.firebaseapp.com",
  projectId: "aarya-attend",
  storageBucket: "aarya-attend.firebasestorage.app",
  messagingSenderId: "241541300445",
  appId: "1:241541300445:web:4f78c3bed3ef17f6ecdb34"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);
