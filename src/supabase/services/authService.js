import { supabase } from '../../lib/supabase';

// Helper to map Supabase user to the format expected by the app (which expects `uid`)
const mapUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    uid: user.id, // Mapped for Firebase compatibility
  };
};

export const loginWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return { success: true, user: mapUser(data.user) };
};

export const signupWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return { success: true, user: mapUser(data.user) };
};

export const loginWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return { success: true, user: mapUser(data?.user) };
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Failed to sign out");
  return { success: true };
};

export const subscribeToAuthChanges = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(mapUser(session?.user || null));
  });

  // Return unsubscribe function to match Firebase API
  return () => {
    subscription.unsubscribe();
  };
};

export const deleteUserAccount = async () => {
  // Client-side hard deletion requires a secure backend function in Supabase.
  // For now, we sign out. The database documents are already wiped.
  await supabase.auth.signOut();
  return { success: true };
};
export const getAuthSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, user: session?.user ? mapUser(session.user) : null };
};
