import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD4a_yZ6YnUMgGmjuxjrwNp8l4vQ3lOUew",
  authDomain: "projetoplus-1a29a.firebaseapp.com",
  projectId: "projetoplus-1a29a",
  storageBucket: "projetoplus-1a29a.firebasestorage.app",
  messagingSenderId: "31661993181",
  appId: "1:31661993181:web:707d2102441c142246bf34",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

const db = getFirestore(firebaseApp);

export { db };
