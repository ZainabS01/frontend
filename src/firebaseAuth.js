import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Signup and create user profile in Firestore
export async function signupWithRole(email, password, profile) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  // By default, role: "student"
  await setDoc(doc(db, "users", user.uid), { ...profile, email, role: "student", uid: user.uid });
  return user;
}

// Login and get user profile
export async function loginAndGetRole(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Force token refresh to ensure we have the latest token
    await user.getIdToken(true);
    
    // Get user document
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }
    
    const profile = userDoc.data();
    
    // Verify the user has a role
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
    throw error; // Re-throw to be handled by the caller
  }
}

// Logout
export function logout() {
  return signOut(auth);
}