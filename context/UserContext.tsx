import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

type UserData = {
  uid: string;
  name: string;
  flatNo: string;
  wing: string;
  phone: string;
  role: string;
  approved: boolean;
  societyId: string;
} | null;

type UserContextType = {
  user: UserData;
  loading: boolean;
};

const UserContext = createContext<UserContextType>({ user: null, loading: true });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, firebaseUser => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      const unsubDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), snap => {
        if (snap.exists()) {
          setUser({ uid: firebaseUser.uid, ...snap.data() } as UserData);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return unsubDoc;
    });
    return unsubAuth;
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);