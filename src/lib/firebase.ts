import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBS0IAV7oiLGnh4MR1GVjGOevTz3-uqEZk",
  authDomain: "syncheartist.firebaseapp.com",
  projectId: "syncheartist",
  storageBucket: "syncheartist.firebasestorage.app",
  messagingSenderId: "334108064121",
  appId: "1:334108064121:web:4705fb249b3f5b21f617a8",
  measurementId: "G-QT794M6R0Y"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
