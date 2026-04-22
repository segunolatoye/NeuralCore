import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
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

  const signIn = async () => {
    setLoading(true);
    setError(null);
    // 1. Try Custom OAuth Client if configured (server-side flow)
    try {
      // Step A: Get Auth URL from our server
      const urlResponse = await fetch('/api/auth/google/url');
      if (urlResponse.ok) {
        const { url } = await urlResponse.json();
        
        // Open popup
        const authWindow = window.open(url, 'google_auth', 'width=500,height=600');
        
        if (!authWindow) {
          throw { code: 'auth/popup-blocked' };
        }

        // Step B: Listen for the callback message
        await new Promise<void>((resolve, reject) => {
          const handleAuthMessage = async (event: MessageEvent) => {
            if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
              window.removeEventListener('message', handleAuthMessage);
              const { code } = event.data;
              
              try {
                // Step C: Exchange code for tokens on server
                const tokenResponse = await fetch('/api/auth/google/callback', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code })
                });

                if (!tokenResponse.ok) throw new Error('Token exchange failed');
                
                const { id_token } = await tokenResponse.json();
                
                // Step D: Sign in to Firebase with the obtained credential
                const credential = GoogleAuthProvider.credential(id_token);
                await signInWithCredential(auth, credential);
                resolve();
              } catch (err) {
                reject(err);
              }
            }
          };

          window.addEventListener('message', handleAuthMessage);
          
          // Fallback: resolution via onAuthStateChanged will handle the final state
          // but we still need a timeout or window interval to detect close
          const checkWindow = setInterval(() => {
            if (authWindow.closed) {
              clearInterval(checkWindow);
              // Small delay to allow message to process if it just finished
              setTimeout(() => reject({ code: 'auth/popup-closed-by-user' }), 1000);
            }
          }, 500);
        });
        return; // Success handled by onAuthStateChanged
      }
    } catch (error: any) {
      console.warn("Custom OAuth failed or not configured, falling back to standard popup:", error);
      if (error.code === 'auth/popup-blocked') {
        setError("Login popup was blocked. In this preview environment, you may need to 'Open in New Tab' using the button in the top right to complete authentication.");
        setLoading(false);
        throw error;
      }
      // Fallback to standard Firebase popup if custom server fails or isn't set up
    }

    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Sign in failed:", error);
      let message = "Authentication failed. Please try again.";
      
      if (error.code === 'auth/popup-blocked') {
        message = "Login popup was blocked. In this preview environment, you may need to 'Open in New Tab' using the button in the top right to complete authentication.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = "Login request was cancelled.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = "The login window was closed before completion.";
      } else if (error.code === 'auth/unauthorized-domain') {
        message = "This domain is not authorized for login. Check Firebase Console settings.";
      }
      
      setError(message);
      setLoading(false);
      throw error;
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

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, logout }}>
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
