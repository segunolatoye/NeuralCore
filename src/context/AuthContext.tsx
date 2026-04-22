import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setError(null);
          // Ensure user profile exists in Firestore
          const userRef = doc(db, 'profiles', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Neural Learner',
              joinedAt: new Date().toISOString(),
              lastDebitScore: 0,
              lastAnalysisInsights: '',
              preferences: {
                primaryGoal: 'Optimized Cognitive Flow',
                preferredSessionDuration: 45,
                dailyTargetMinutes: 120,
                learningStyle: 'visual',
                focusMusic: true
              }
            });
          }
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth profile sync failed:", err);
        // Even if profile sync fails, set the user so the app can attempt to function
        if (user) setUser(user);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const formatAuthError = (message: string) => {
    if (message.includes('auth/email-already-in-use')) return "This email is already registered in the neural network.";
    if (message.includes('auth/invalid-email')) return "The provided email format is invalid.";
    if (message.includes('auth/weak-password')) return "The security cipher must be at least 6 characters.";
    if (message.includes('auth/user-not-found') || message.includes('auth/wrong-password') || message.includes('auth/invalid-credential')) {
      return "Invalid neural credentials. Please check your email and cipher.";
    }
    if (message.includes('auth/popup-blocked')) return "Login popup was blocked by your browser settings.";
    if (message.includes('auth/popup-closed-by-user')) return "Login window was closed before completion.";
    return message;
  };

  const signIn = async () => {
    setLoading(true);
    setError(null);

    // 1. Immediately open a blank popup to reserve the user gesture window.
    // This is critical to prevent browsers from blocking the popup.
    let authWindow: Window | null = null;
    try {
      authWindow = window.open('about:blank', 'google_auth', 'width=500,height=600');
      
      if (authWindow) {
        authWindow.document.write(`
          <div style="font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; color: #6366f1; background: #0f172a; text-align: center; padding: 20px;">
            <div style="margin-bottom: 24px; width: 64px; height: 64px; border: 4px solid rgba(99, 102, 241, 0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #f8fafc;">Initiating Neural Sync</h3>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 12px; max-width: 250px; line-height: 1.5;">Preparing secure authentication tunnel via Google Identity Protocol...</p>
            <style>
              @keyframes spin { to { transform: rotate(360deg); } }
              body { margin: 0; overflow: hidden; }
            </style>
          </div>
        `);
      }
    } catch (e) {
      console.warn("Initial popup attempt failed:", e);
    }

    if (!authWindow) {
      setError("Login popup was blocked. In this preview environment, you MUST use the 'Open in New Tab' button in the top right corner of the AI Studio preview to complete authentication.");
      setLoading(false);
      return;
    }

    try {
      // 2. Fetch the actual Auth URL from our backend
      const urlResponse = await fetch('/api/auth/google/url');
      
      if (!urlResponse.ok) {
        throw new Error('Failed to reach authentication server');
      }
      
      const { url } = await urlResponse.json();

      if (authWindow.closed) {
        throw new Error('auth/popup-closed-by-user');
      }

      // 3. Move the already-open window to Google
      authWindow.location.href = url;

      // 4. Listen for the success message from our /auth/callback page
      await new Promise<void>((resolve, reject) => {
        let isFinished = false;
        
        const cleanup = () => {
          isFinished = true;
          window.removeEventListener('message', handleAuthMessage);
          clearInterval(checkWindowInterval);
        };

        const handleAuthMessage = async (event: MessageEvent) => {
          if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
            const { code } = event.data;
            cleanup();
            
            try {
              const tokenResponse = await fetch('/api/auth/google/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
              });

              if (!tokenResponse.ok) throw new Error('Token exchange failed');
              
              const { id_token } = await tokenResponse.json();
              const credential = GoogleAuthProvider.credential(id_token);
              await signInWithCredential(auth, credential);
              resolve();
            } catch (err) {
              reject(err);
            }
          }
        };

        window.addEventListener('message', handleAuthMessage);
        
        // Polling for window closure
        const checkWindowInterval = setInterval(() => {
          if (authWindow?.closed && !isFinished) {
            cleanup();
            // Final check: did a success message just arrive in the same tick?
            setTimeout(() => {
              if (isFinished) return; // Already resolved by message
              reject(new Error('auth/popup-closed-by-user'));
            }, 100);
          }
        }, 500);
      });

    } catch (error: any) {
      if (authWindow && !authWindow.closed) authWindow.close();
      
      console.error("Authentication Process Error:", error);
      
      let displayMessage = formatAuthError(error.message);
      
      if (!authWindow) {
        displayMessage = "Login popup was blocked. Please 'Open in New Tab' using the button in the top right to complete authentication.";
      }
      
      setError(displayMessage);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName: name });
      // Profile creation in Firestore happens via useEffect/onAuthStateChanged
    } catch (err: any) {
      console.error("Sign up failed:", err);
      setError(formatAuthError(err.message || "Failed to create account"));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error("Sign in failed:", err);
      setError(formatAuthError(err.message || "Invalid email or password"));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.error("Password reset failed:", err);
      setError(formatAuthError(err.message || "Failed to send reset email"));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signInWithEmail, signUpWithEmail, sendPasswordReset, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
