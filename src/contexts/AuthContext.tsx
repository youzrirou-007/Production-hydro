import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface UserProfile {
  role: 'secretary' | 'responsible' | 'chief' | 'direction' | 'admin';
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
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubProfile = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
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
      });
      return () => unsubProfile();
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
