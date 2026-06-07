import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp, limit, startAfter } from "firebase/firestore";
import { db } from "../config";

export const checkUsernameAvailable = async (username) => {
  if (!username) return false;
  try {
    const docRef = doc(db, "usernames", username.toLowerCase());
    const docSnap = await getDoc(docRef);
    return !docSnap.exists();
  } catch (err) {
    console.error("Error checking username:", err);
    throw err;
  }
};

export const createUserProfile = async (uid, email, username, displayName, photoURL = "") => {
  try {
    const lowerUsername = username.toLowerCase();
    
    // Create username doc first (reserves the username)
    await setDoc(doc(db, "usernames", lowerUsername), { uid });

    // Create user doc
    await setDoc(doc(db, "users", uid), {
      uid,
      username: lowerUsername,
      displayName: displayName || email.split('@')[0],
      photoURL,
      bio: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Create default portfolio settings
    await setDoc(doc(db, "portfolioSettings", uid), {
      theme: "minimal",
      accentColor: "#000000",
      websiteTitle: displayName || email.split('@')[0],
      seoTitle: "",
      seoDescription: "",
      customDomain: "",
      instagram: "",
      linkedin: "",
      behance: "",
      dribbble: ""
    });

    return true;
  } catch (err) {
    console.error("Error creating user profile:", err);
    throw err;
  }
};

export const getUserProfile = async (uid) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    throw err;
  }
};

export const getUsersPage = async (lastVisible = null, pageSize = 20) => {
  try {
    let q = query(collection(db, "users"), limit(pageSize));
    if (lastVisible) {
      q = query(collection(db, "users"), startAfter(lastVisible), limit(pageSize));
    }
    const snap = await getDocs(q);
    return {
      users: snap.docs.map(d => d.data()),
      lastDoc: snap.docs[snap.docs.length - 1] || null,
      hasMore: snap.docs.length === pageSize
    };
  } catch (err) {
    console.error("Error fetching users page:", err);
    throw err;
  }
};

export const getUserByUsername = async (username) => {
  try {
    const lowerUsername = username.toLowerCase();
    const usernameDoc = await getDoc(doc(db, "usernames", lowerUsername));
    if (!usernameDoc.exists()) return null;
    
    const uid = usernameDoc.data().uid;
    return await getUserProfile(uid);
  } catch (err) {
    console.error("Error fetching user by username:", err);
    throw err;
  }
};

export const getPortfolioSettings = async (uid) => {
  try {
    const docRef = doc(db, "portfolioSettings", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (err) {
    console.error("Error fetching portfolio settings:", err);
    throw err;
  }
};

export const updatePortfolioSettings = async (uid, settingsData) => {
  try {
    const docRef = doc(db, "portfolioSettings", uid);
    await updateDoc(docRef, settingsData);
    return true;
  } catch (err) {
    console.error("Error updating portfolio settings:", err);
    throw err;
  }
};
