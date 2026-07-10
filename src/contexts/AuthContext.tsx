import React, { createContext, useContext, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';

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

const dummyUser: any = {
  uid: 'admin-bypass-user-id',
  email: 'youzrirou@gmail.com',
  displayName: 'Administrateur',
  photoURL: null,
};

const dummyProfile: UserProfile = {
  role: 'admin',
  siteIds: ['SMI'],
  name: 'Administrateur',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<FirebaseUser | null>(dummyUser);
  const [profile] = useState<UserProfile | null>(dummyProfile);
  const [loading] = useState(false);

  const signIn = async () => {};
  const logout = async () => {};

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
