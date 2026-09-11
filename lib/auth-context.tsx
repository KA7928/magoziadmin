"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  firebaseSignOut, 
  onAuthStateChanged,
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  FirebaseUser
} from "./firebase";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: FirebaseUser | null;
  adminEmail: string | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  adminEmail: null,
  isAdmin: false,
  loading: true,
  error: null,
  loginWithGoogle: async () => false,
  logout: async () => {},
  clearError: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  // Verify Admin Role in Cloud Firestore `admins` collection against Email_ID
  const verifyAdminRole = async (fbUser: FirebaseUser): Promise<boolean> => {
    const userUid = fbUser.uid;
    const userEmail = (fbUser.email || "").trim().toLowerCase();

    console.log("Verifying Google Gmail in admins collection:", { userUid, userEmail });

    if (!userEmail) {
      setError("Access Denied: Logged in Google account has no valid email address.");
      return false;
    }

    let isVerifiedAdmin = false;

    try {
      // 1. Check doc `admins/emails` for Email_ID field
      const emailsRef = doc(db, "admins", "emails");
      const emailsSnap = await getDoc(emailsRef).catch(() => null);

      if (emailsSnap && emailsSnap.exists()) {
        const data = emailsSnap.data();
        const emailID = data.Email_ID || data.email_id || data.EmailID || data.email || data.emails;
        
        if (typeof emailID === "string" && emailID.trim().toLowerCase() === userEmail) {
          isVerifiedAdmin = true;
        } else if (Array.isArray(emailID)) {
          if (emailID.some((e: any) => typeof e === "string" && e.trim().toLowerCase() === userEmail)) {
            isVerifiedAdmin = true;
          }
        } else if (typeof emailID === "object" && emailID !== null) {
          if (Object.values(emailID).some((e: any) => typeof e === "string" && e.trim().toLowerCase() === userEmail)) {
            isVerifiedAdmin = true;
          }
        }
      }

      // 2. Check doc `admins/{userEmail}` for Email_ID or admin status
      if (!isVerifiedAdmin) {
        const userEmailRef = doc(db, "admins", userEmail);
        const userEmailSnap = await getDoc(userEmailRef).catch(() => null);

        if (userEmailSnap && userEmailSnap.exists()) {
          const data = userEmailSnap.data();
          const docEmailID = (data?.Email_ID || data?.email_id || data?.email || "").toString().trim().toLowerCase();
          if (!docEmailID || docEmailID === userEmail || data?.role === "admin") {
            isVerifiedAdmin = true;
          }
        }
      }

      // 3. Scan all documents in `admins` collection checking Email_ID or document ID
      if (!isVerifiedAdmin) {
        const adminsColRef = collection(db, "admins");
        const adminsSnap = await getDocs(adminsColRef).catch(() => null);

        if (adminsSnap && !adminsSnap.empty) {
          for (const adminDoc of adminsSnap.docs) {
            const docId = adminDoc.id.trim().toLowerCase();
            const dData = adminDoc.data();
            const emailField = (dData.Email_ID || dData.email_id || dData.EmailID || dData.email || "").toString().trim().toLowerCase();

            if (docId === userEmail || emailField === userEmail) {
              isVerifiedAdmin = true;
              break;
            }

            const arrField = dData.Email_ID || dData.emails || dData.email_list;
            if (Array.isArray(arrField)) {
              if (arrField.some((e: any) => typeof e === "string" && e.trim().toLowerCase() === userEmail)) {
                isVerifiedAdmin = true;
                break;
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("Firestore admins collection Email_ID check error:", err);
    }

    // Root admin email fallback
    if (!isVerifiedAdmin && userEmail === "rita48050@gmail.com") {
      isVerifiedAdmin = true;
    }

    if (isVerifiedAdmin) {
      setIsAdmin(true);
      setAdminEmail(userEmail);
      setError(null);
      return true;
    }

    // Access Denied if email is not inside admins collection under Email_ID
    await firebaseSignOut(auth);
    setUser(null);
    setIsAdmin(false);
    setAdminEmail(null);
    setError(`Access Denied: Logged in Gmail (${userEmail}) is not found in admins collection (Email_ID).`);
    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const verified = await verifyAdminRole(currentUser);
        if (verified && pathname === "/") {
          router.push("/dashboard");
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setAdminEmail(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname]);

  const loginWithGoogle = async (): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const verified = await verifyAdminRole(res.user);
      setLoading(false);
      if (verified) {
        router.push("/dashboard");
        return true;
      }
      return false;
    } catch (err: any) {
      setLoading(false);
      console.error("Google Sign-In popup error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Google Sign-In failed.");
      }
      return false;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsAdmin(false);
      setAdminEmail(null);
      router.push("/");
    } catch (err: any) {
      console.error("Logout error", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        adminEmail,
        isAdmin,
        loading,
        error,
        loginWithGoogle,
        logout,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
