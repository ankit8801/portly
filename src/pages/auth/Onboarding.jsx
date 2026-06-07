import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { checkUsernameAvailable, createUserProfile } from '../../firebase/services/userService';

export default function Onboarding() {
  const { user, profile, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
    if (!loading && profile) {
      navigate('/dashboard'); // Already onboarded
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3) {
        setIsAvailable(null);
        return;
      }
      setIsChecking(true);
      try {
        const available = await checkUsernameAvailable(username);
        setIsAvailable(available);
      } catch (err) {
        console.error(err);
      } finally {
        setIsChecking(false);
      }
    };

    const timer = setTimeout(() => {
      if (username) checkUsername();
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAvailable) {
      setError('Please choose an available username');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      await createUserProfile(
        user.uid,
        user.email,
        username,
        displayName,
        user.photoURL || ''
      );
      // After creating profile, AuthContext will re-fetch it and redirect to dashboard
      window.location.href = '/dashboard'; // Force reload to ensure context picks it up fresh
    } catch (err) {
      setError(err.message || 'Failed to create profile');
      setSubmitting(false);
    }
  };

  if (loading || !user) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-secondary/30 p-8 rounded-2xl border border-border">
        <h1 className="text-3xl font-bold mb-2 text-center">Complete your profile</h1>
        <p className="text-foreground/60 text-center mb-6">Choose a unique username for your portfolio URL.</p>
        
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Display Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Jane Doe"
              className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent transition-colors"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Username</label>
            <div className="flex">
              <span className="bg-white/5 border border-border px-4 py-2 rounded-l-lg text-foreground/40 border-r-0 flex items-center whitespace-nowrap">
                {window.location.host}/u/
              </span>
              <div className="relative flex-1">
                <input 
                  type="text" 
                  required
                  pattern="[a-zA-Z0-9_-]+"
                  title="Only letters, numbers, underscores, and dashes are allowed."
                  minLength={3}
                  maxLength={30}
                  className="w-full bg-background border border-border rounded-r-lg pr-10 py-2 pl-3 focus:outline-none focus:border-accent transition-colors"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                />
                {username.length >= 3 && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {isChecking ? (
                    <div className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                  ) : isAvailable ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              )}
            </div>
            </div>
            {username.length > 0 && username.length < 3 && (
              <p className="text-xs text-red-500 mt-1">Username must be at least 3 characters</p>
            )}
            {username.length >= 3 && !isChecking && !isAvailable && (
              <p className="text-xs text-red-500 mt-1">This username is taken</p>
            )}
          </div>
          <button 
            type="submit" 
            disabled={submitting || !isAvailable || isChecking}
            className="w-full bg-foreground text-background font-medium py-2 rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 mt-4"
          >
            {submitting ? 'Creating...' : 'Continue to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
