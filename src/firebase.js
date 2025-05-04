// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  createUserWithEmailAndPassword, // Import createUserWithEmailAndPassword
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Import getFirestore

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCdTXxZis-yb8xxISLKG5YccNPQrgA9jVI",
  authDomain: "communitysupport-98607.firebaseapp.com",
  projectId: "communitysupport-98607",
  storageBucket: "communitysupport-98607.firebasestorage.app",
  messagingSenderId: "186116963748",
  appId: "1:186116963748:web:4c3078d3f8fa888e4b9531",
  measurementId: "G-0KH1GPRDXB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

// Export auth, other functions, and db
export {
  auth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  createUserWithEmailAndPassword, // Export createUserWithEmailAndPassword
  db,
};
export default app;
