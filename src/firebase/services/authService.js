import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth } from "../config";

const googleProvider = new GoogleAuthProvider();

export const loginWithEmail = async (email, password) => {
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};

export const signupWithEmail = async (email, password) => {
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Signup Error:", error);
    throw error;
  }
}

export const loginWithGoogle = async () => {
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Google Login Error:", error);
    throw error;
  }
}

export const logoutUser = async () => {
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Logout Error:", error);
    throw new Error("Failed to sign out");
  }
};

export const subscribeToAuthChanges = (callback) => {
  if (!auth) {
    callback(null);
    return () => {}; 
  }
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};
