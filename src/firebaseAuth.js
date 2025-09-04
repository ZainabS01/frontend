import { 
  auth, 
  db 
} from "./firebase";

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  setPersistence, 
  browserLocalPersistence 
} from "firebase/auth";

import { 
  doc, 
  getDoc,
  setDoc 
} from "firebase/firestore";

// Sign up new user with role
export async function signupWithRole(email, password, userData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      ...userData,
      email: user.email,
      role: 'student', // Default role
      createdAt: new Date().toISOString()
    });

    return { user };
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}

// Login and get user profile
export async function loginAndGetRole(email, password) {
  try {
    // ✅ Set persistent login
    await setPersistence(auth, browserLocalPersistence);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Force refresh token
    await user.getIdToken(true);

    // Fetch user profile
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const profile = userDoc.data();

    if (!profile.role) {
      throw new Error('User role not found');
    }

    return {
      user,
      profile: {
        ...profile,
        uid: user.uid
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}