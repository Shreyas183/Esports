import { initializeApp } from 'firebase/app';
import { getFirestore, setDoc, doc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBql2gCIEWViQyFJC6VlNrzwfNkhANs37k",
  authDomain: "esports-53611.firebaseapp.com",
  projectId: "esports-53611",
  storageBucket: "esports-53611.appspot.com",
  messagingSenderId: "829788020658",
  appId: "1:829788020658:web:9554e06dce4d6ad3fa8eab",
  measurementId: "G-ZQ0BZ6LTTM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedAdmin() {
  const adminUid = 'admin-demo-uid'; // Change this to your actual UID after first login
  await setDoc(doc(db, 'users', adminUid), {
    uid: adminUid,
    email: 'admin@esports.com',
    displayName: 'Admin User',
    photoURL: '',
    role: 'admin',
    gameIds: { BGMI: '', FREE_FIRE: '' },
    stats: { tournamentsJoined: 0, tournamentsWon: 0, totalEarnings: 0 },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  console.log('Default admin seeded!');
}

seedAdmin();
