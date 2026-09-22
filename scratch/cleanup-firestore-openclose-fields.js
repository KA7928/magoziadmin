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

async function cleanupDoc() {
  console.log("=== Cleaning up app_config/app_open_close in Firestore ===");
  const openCloseRef = doc(db, "app_config", "app_open_close");
  const snap = await getDoc(openCloseRef);

  if (snap.exists()) {
    const data = snap.data();
    console.log("Current document before cleanup:", data);

    const openTime = data.openTime || data["App open timing"] || data.open_time || "06:00 AM";
    const closeTime = data.closeTime || data["close timing"] || data.close_time || "11:30 PM";
    const isStoreOpen = data.isStoreOpen !== undefined ? Boolean(data.isStoreOpen) : (data.isOpen !== undefined ? Boolean(data.isOpen) : true);
    const openingHours = data.openingHours || `${openTime} - ${closeTime}`;
    const closedMessage = data.closedMessage || "We are currently closed for orders.";
    const autoTimingEnabled = data.autoTimingEnabled !== undefined ? Boolean(data.autoTimingEnabled) : true;

    // Clean single field object (NO duplicates!)
    const cleanPayload = {
      isStoreOpen: isStoreOpen,
      openTime: openTime,
      closeTime: closeTime,
      openingHours: openingHours,
      closedMessage: closedMessage,
      autoTimingEnabled: autoTimingEnabled,
      updatedAt: new Date().toISOString(),
      lastUpdated: Date.now()
    };

    // Replace document completely (without merge) to wipe out all duplicate alias fields
    await setDoc(openCloseRef, cleanPayload, { merge: false });
    console.log("Clean payload saved successfully:", cleanPayload);

    const freshSnap = await getDoc(openCloseRef);
    console.log("Fresh Firestore document after cleanup:", freshSnap.data());
  }

  process.exit(0);
}

cleanupDoc().catch(err => {
  console.error(err);
  process.exit(1);
});
