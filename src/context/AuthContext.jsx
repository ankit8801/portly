import { createContext, useContext, useEffect, useState } from "react";
import { subscribeToAuthChanges, getAuthSession } from '../supabase/services/authService';
import { getUserProfile } from '../supabase/services/userService';

const AuthContext = createContext({ user: null, loading: true, profile: null });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Fetch initial session
    const initSession = async () => {
      try {
        const { user: initialUser } = await getAuthSession();
        if (mounted) {
          setUser(initialUser);
          if (initialUser) {
            const userProfile = await getUserProfile(initialUser.uid);
            setProfile(userProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking auth session:", error);
        if (mounted) setLoading(false);
      }
    };

    initSession();

    // Subscribe to auth changes
    const unsubscribe = subscribeToAuthChanges(async (supabaseUser) => {
      if (!mounted) return;
      setUser(supabaseUser);
      if (supabaseUser) {
        try {
          const userProfile = await getUserProfile(supabaseUser.uid);
          setProfile(userProfile);
        } catch (error) {
          console.error("Error fetching user profile in auth context:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, profile }}>
      {children}
    </AuthContext.Provider>
  );
};
