import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB_avSiIzaL1z2F1qvMC_QWtNwyc0471GY",
  authDomain: "zonemeet-4e9d0.firebaseapp.com",
  projectId: "zonemeet-4e9d0",
  storageBucket: "zonemeet-4e9d0.firebasestorage.app",
  messagingSenderId: "213113003290",
  appId: "1:213113003290:web:f92fd3ec95380e906320a3",
  measurementId: "G-W57Y9S20C7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
