import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  Firestore 
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, FirebaseStorage } from "firebase/storage";

export function getFirebaseConfig() {
  // Always prefer explicit environment variables from .env.local
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
    };
  }

  if (typeof window !== "undefined") {
    const customConfig = localStorage.getItem("magozi_firebase_config");
    if (customConfig) {
      try {
        return JSON.parse(customConfig);
      } catch (e) {
        console.error("Invalid custom firebase config in localStorage", e);
      }
    }
  }

  return {
    apiKey: "AIzaSyBt9TrSku74AOHFko7345iUGCB21LUv2yI",
    authDomain: "magoziproject.firebaseapp.com",
    projectId: "magoziproject",
    storageBucket: "magoziproject.firebasestorage.app",
    messagingSenderId: "441501080743",
    appId: "1:441501080743:web:7fbbcdb4a3fa8e60008f82",
    measurementId: "G-P3894JPZS1"
  };
}

const firebaseConfig = getFirebaseConfig();

const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export function saveCustomFirebaseConfig(newConfig: Record<string, string>) {
  if (typeof window !== "undefined") {
    localStorage.setItem("magozi_firebase_config", JSON.stringify(newConfig));
    window.location.reload();
  }
}

export async function deleteStorageImage(imageUrl: string) {
  if (!imageUrl || typeof imageUrl !== "string") return;
  if (imageUrl.includes("firebasestorage.googleapis.com") || imageUrl.includes("gs://")) {
    try {
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
      console.log("Successfully deleted image from Firebase Storage:", imageUrl);
    } catch (err) {
      console.warn("Notice deleting image from Firebase Storage:", err);
    }
  }
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};
export type { FirebaseUser };
