import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface UserProfile {
  role: 'secretary' | 'responsible' | 'chief' | 'direction' | 'admin' | 'direction_technique';
  siteIds: string[];
  name: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety fallback timeout to prevent infinite loading screen
    const timer = setTimeout(() => {
      setLoading(false);
    }, 6000);

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
        clearTimeout(timer);
      }
    });

    return () => {
      unsubAuth();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (user) {
      // Safety fallback timeout for profile loading
      const profileTimer = setTimeout(() => {
        console.warn("Profile loading timed out, using fallback.");
        setLoading(false);
      }, 5000);

      const unsubProfile = onSnapshot(
        doc(db, 'users', user.uid),
        async (docSnap) => {
          clearTimeout(profileTimer);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const userEmailLower = user.email?.toLowerCase();
            if (userEmailLower === 'youzrirou@gmail.com' && data.role !== 'admin') {
              try {
                await setDoc(doc(db, 'users', user.uid), {
                  ...data,
                  role: 'admin'
                }, { merge: true });
              } catch (err) {
                console.error("Auto-promoting profile to admin failed", err);
                setProfile(data);
                setLoading(false);
              }
            } else {
              setProfile(data);
              setLoading(false);
            }
          } else {
            // Auto bootstrap default profile as admin
            try {
              await setDoc(doc(db, 'users', user.uid), {
                role: 'admin',
                siteIds: ['SMI'],
                name: user.displayName || user.email?.split('@')[0] || 'Utilisateur'
              });
              setLoading(false);
            } catch (err) {
              console.error("Bootstrapping profile failed", err);
              setProfile(null);
              setLoading(false);
            }
          }
        },
        (error) => {
          clearTimeout(profileTimer);
          console.error("Error fetching user profile snapshot:", error);
          setProfile(null);
          setLoading(false);
        }
      );
      return () => {
        unsubProfile();
        clearTimeout(profileTimer);
      };
    }
  }, [user]);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
