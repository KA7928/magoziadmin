const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc, collection, getDocs } = require("firebase/firestore");

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

async function inspectMore() {
  console.log("=== Inspecting app_config collection docs ===");
  const appConfigSnap = await getDocs(collection(db, "app_config"));
  appConfigSnap.forEach(d => {
    console.log(`Doc ID: ${d.id} =>`, JSON.stringify(d.data(), null, 2));
  });

  console.log("=== Inspecting stores collection docs ===");
  const storesSnap = await getDocs(collection(db, "stores"));
  storesSnap.forEach(d => {
    console.log(`Store Doc ID: ${d.id} =>`, JSON.stringify(d.data(), null, 2));
  });

  process.exit(0);
}

inspectMore().catch(err => {
  console.error(err);
  process.exit(1);
});
