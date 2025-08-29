import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
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
const auth = getAuth(app);
const db = getFirestore(app);

async function seedAdminWithAuth() {
  const email = 'admin@esports.com';
  const password = 'Admin@1234';
  const displayName = 'Admin User';
  try {
    // Try to create the user
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email,
      displayName,
      photoURL: user.photoURL || '',
      role: 'admin',
      gameIds: { BGMI: '', FREE_FIRE: '' },
      stats: { tournamentsJoined: 0, tournamentsWon: 0, totalEarnings: 0 },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Admin user created and seeded!');
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists.');
    } else {
      console.error('Error creating admin user:', error.message);
    }
  }
}

seedAdminWithAuth();
