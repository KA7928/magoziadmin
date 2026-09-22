const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc, setDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBt9TrSku74AOHFko7345iUGCB21LUv2yI",
  authDomain: "magoziproject.firebaseapp.com",
  projectId: "magoziproject",
  storageBucket: "magoziproject.firebasestorage.app",
  messagingSenderId: "441501080743",
  appId: "1:441501080743:web:7fbbcdb4a3fa8e60008f82"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixDefaults() {
  console.log("=== Checking and Unifying Firestore Open/Close Times ===");

  const ref = doc(db, "app_config", "app_open_close");
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    console.log("Current data:", data);

    const openT = data.openTime || data.open_time || data["App open timing"] || "06:00 AM";
    const closeT = data.closeTime || data.close_time || data["close timing"] || "11:30 PM";

    const updatedPayload = {
      ...data,
      openTime: openT,
      open_time: openT,
      "App open timing": openT,
      open_timing: openT,
      closeTime: closeT,
      close_time: closeT,
      "close timing": closeT,
      close_timing: closeT,
      openingHours: `${openT} - ${closeT}`,
      openCloseTiming: `${openT} - ${closeT}`,
      updatedAt: new Date().toISOString(),
      lastUpdated: Date.now(),
    };

    await setDoc(ref, updatedPayload, { merge: true });
    console.log("Updated app_config/app_open_close to:", updatedPayload);
  }

  process.exit(0);
}

fixDefaults().catch((err) => {
  console.error(err);
  process.exit(1);
});
