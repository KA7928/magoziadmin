const fs = require('fs');
const envText = fs.readFileSync('.env.local', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const k = parts[0].trim();
    const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    if (k) env[k] = v;
  }
});

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, deleteDoc } = require('firebase/firestore');

const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID
});
const db = getFirestore(app);

async function clearAllProducts() {
  const snap = await getDocs(collection(db, 'products'));
  console.log(`Deleting ${snap.size} product items from Cloud Firestore 'products' collection...`);

  for (const productDoc of snap.docs) {
    await deleteDoc(doc(db, 'products', productDoc.id));
    console.log(`Deleted product document: ${productDoc.id}`);
  }

  console.log("All products cleared successfully from Cloud Firestore!");
  process.exit(0);
}

clearAllProducts().catch(e => { console.error(e); process.exit(1); });
