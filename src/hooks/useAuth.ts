import { useState, useEffect, createContext, useContext } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { User, UserRole } from '@/types';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Always use Firebase - no more demo mode
  const isFirebaseConfigured = true;

  useEffect(() => {
    console.log('✅ Firebase configured - connecting to new-esports project');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Get user document from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            console.log('✅ User document found, loading existing user data');
            setUser({ uid: firebaseUser.uid, ...userDoc.data() } as User);
          } else {
            console.log('⚠️ No user document found, but user should have been created during signup');
            // Don't create a new document here - it should have been created during signup
            // Just set a basic user object to prevent errors
            const basicUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Anonymous User',
              photoURL: firebaseUser.photoURL || '',
              role: 'player' as UserRole, // Default fallback
              gameIds: { BGMI: '', FREE_FIRE: '' },
              stats: { tournamentsJoined: 0, tournamentsWon: 0, totalEarnings: 0 },
              createdAt: new Date(),
              updatedAt: new Date()
            };
            setUser(basicUser);
          }
        } catch (error) {
          console.error('Error fetching or creating user data:', error);
          toast({
            title: "Error",
            description: "Failed to load user data. Please check your connection or contact support.",
            variant: "destructive"
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [isFirebaseConfigured]);

  const signIn = async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      // Demo mode - simulate successful login
      const demoUser: User = {
        uid: 'demo-user-id',
        email: email,
        displayName: email.split('@')[0],
        photoURL: '',
        role: 'admin',
        gameIds: { BGMI: '', FREE_FIRE: '' },
        stats: { tournamentsJoined: 0, tournamentsWon: 0, totalEarnings: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setUser(demoUser);
      toast({
        title: "Demo Mode",
        description: "Signed in successfully (Demo Mode)",
      });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Success",
        description: "Signed in successfully!",
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      let message = 'Failed to sign in. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      }
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string, role: UserRole) => {
    try {
      console.log('🚀 Starting account creation process...');
      console.log('📧 Email:', email);
      console.log('👤 Display Name:', displayName);
      console.log('🎭 Role:', role);
      
      // Step 1: Create Firebase Auth user
      console.log('🔐 Creating Firebase Auth user...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase Auth user created:', firebaseUser.uid);
      
      // Step 2: Update Firebase Auth profile
      console.log('👤 Updating Firebase Auth profile...');
      await updateProfile(firebaseUser, { displayName });
      console.log('✅ Firebase Auth profile updated');
      
      // Step 3: Create user document in Firestore
      console.log('📝 Creating Firestore user document...');
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const newUser = {
        email: firebaseUser.email || '',
        displayName: displayName,
        photoURL: firebaseUser.photoURL || '',
        role: role,
        gameIds: {
          BGMI: '',
          FREE_FIRE: ''
        },
        stats: {
          tournamentsJoined: 0,
          tournamentsWon: 0,
          totalEarnings: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('📄 User data to save:', newUser);
      await setDoc(userDocRef, newUser);
      console.log('✅ Firestore user document created');
      
      // Immediately set the user state with the correct role
      const userWithUid = { uid: firebaseUser.uid, ...newUser } as User;
      setUser(userWithUid);
      console.log('✅ User state set with role:', userWithUid.role);
      
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error object:', error);
      
      let message = 'Failed to create account. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address.';
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Email/password accounts are not enabled. Please contact support.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please try again later.';
      } else if (error.code === 'permission-denied') {
        message = 'Permission denied. Please check if Firestore rules are properly configured.';
      }
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      // Demo mode - simulate Google signin
      const demoUser: User = {
        uid: 'demo-google-user-id',
        email: 'demo@gmail.com',
        displayName: 'Demo Google User',
        photoURL: '',
        role: 'player',
        gameIds: { BGMI: '', FREE_FIRE: '' },
        stats: { tournamentsJoined: 0, tournamentsWon: 0, totalEarnings: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setUser(demoUser);
      toast({
        title: "Demo Mode",
        description: "Signed in with Google successfully (Demo Mode)",
      });
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user document exists, if not create it
      const userDocRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        const newUser = {
          email: result.user.email || '',
          displayName: result.user.displayName || 'Anonymous User',
          photoURL: result.user.photoURL || '',
          role: 'player' as UserRole,
          gameIds: {
            BGMI: '',
            FREE_FIRE: ''
          },
          stats: {
            tournamentsJoined: 0,
            tournamentsWon: 0,
            totalEarnings: 0
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(userDocRef, newUser);
      }
      
      toast({
        title: "Success",
        description: "Signed in with Google successfully!",
      });
    } catch (error: any) {
      console.error('Google sign in error:', error);
      let message = 'Failed to sign in with Google. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Sign in was cancelled.';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Pop-up was blocked. Please allow pop-ups for this site.';
      }
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const logout = async () => {
    if (!isFirebaseConfigured) {
      // Demo mode - simulate logout
      setUser(null);
      toast({
        title: "Demo Mode",
        description: "Signed out successfully (Demo Mode)",
      });
      return;
    }

    try {
      await signOut(auth);
      setUser(null);
      toast({
        title: "Success",
        description: "Signed out successfully!",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    if (!isFirebaseConfigured) {
      // Demo mode - simulate profile update
      setUser(prev => prev ? { ...prev, ...data } : null);
      toast({
        title: "Demo Mode",
        description: "Profile updated successfully (Demo Mode)",
      });
      return;
    }
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setUser(prev => prev ? { ...prev, ...data } : null);
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Update profile error:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    updateUserProfile,
    isDemoMode: !isFirebaseConfigured
  };
};

export const AuthProvider = AuthContext.Provider;