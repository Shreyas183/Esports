import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, doc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// New Firebase config for new-esports project
const newEsportsConfig = {
  apiKey: "AIzaSyCQtFH97RaDH9BzFgrbltQC_69rLnKUyr0",
  authDomain: "new-esports.firebaseapp.com",
  projectId: "new-esports",
  storageBucket: "new-esports.appspot.com",
  messagingSenderId: "746052259984",
  appId: "1:746052259984:web:1107e3e2d32638c20d0815",
  measurementId: "G-8JRNWS20YM"
};

// Note: test and fallback configs removed to avoid accidental misconfiguration

// Get Firebase config with priority
const getFirebaseConfig = () => {
  // Always use the new-esports config for now
  console.log('✅ Using new-esports Firebase config');
  console.log('✅ Project ID:', newEsportsConfig.projectId);
  console.log('✅ API Key:', newEsportsConfig.apiKey.substring(0, 10) + '...');
  return newEsportsConfig;
};

// Initialize Firebase with validated config
const firebaseConfig = getFirebaseConfig();
console.log('🔧 Firebase config being used:', firebaseConfig);
console.log('🔧 Project ID:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
console.log('✅ Firebase app initialized successfully');

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

console.log('✅ Firebase services initialized:');
console.log('  - Auth:', auth ? '✅' : '❌');
console.log('  - Firestore:', db ? '✅' : '❌');
console.log('  - Storage:', storage ? '✅' : '❌');
console.log('  - Functions:', functions ? '✅' : '❌');

// Initialize Analytics (only in production)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined" && import.meta.env.PROD) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}
export { analytics };

// Initialize Firebase Cloud Messaging
let messaging: ReturnType<typeof getMessaging> | null = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('FCM initialization failed:', error);
  }
}

// Don't use emulators - connect directly to Firebase
console.log('🔧 Connecting directly to Firebase project:', firebaseConfig.projectId);

// Firebase Cloud Messaging helpers
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!messaging) {
    console.warn('FCM not available');
    return null;
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

export const onMessageListener = () => {
  if (!messaging) {
    console.warn('FCM not available');
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    onMessage(messaging!, (payload) => {
      resolve(payload);
    });
  });
};

// Database helper functions
export const getCollectionRef = (collectionName: string) => {
  return collection(db, collectionName);
};

export const getDocumentRef = (collectionName: string, docId: string) => {
  return doc(db, collectionName, docId);
};

// Storage helper functions
export const getStorageRef = (path: string) => {
  return ref(storage, path);
};

export const uploadFile = async (path: string, file: File): Promise<string> => {
  const storageRef = getStorageRef(path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

export { messaging };
export default app;