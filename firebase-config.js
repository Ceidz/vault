  const firebaseConfig = {
  apiKey: "AIzaSyCPfE-LjzskrAyurIfj8dG4aRmv5fFAwpg",
  authDomain: "vault-nexus-project.firebaseapp.com",
  projectId: "vault-nexus-project",
  storageBucket: "vault-nexus-project.firebasestorage.app",
  messagingSenderId: "990256291742",
  appId: "1:990256291742:web:b50d4af6ca5c2a7468008f",
  measurementId: "G-S4TSR8LRFL"
};

try {
  firebase.initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  alert('Firebase is not configured correctly. Please check firebase-config.js');
}

const auth = firebase.auth();
const db = firebase.firestore();
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
}, { merge: true });

console.log('Firebase Auth and Firestore initialized');