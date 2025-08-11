import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange } from '@/lib/firebase';
import { createOrUpdateUser, FirestoreUser } from '@/lib/firestore';

export interface AuthUser extends FirestoreUser {}

export function useFirebaseAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser: User | null) => {
      try {
        if (firebaseUser) {
          // Create or update user in Firestore and get the complete user data
          const firestoreUser = await createOrUpdateUser(firebaseUser);
          setUser(firestoreUser);
          console.log('Firebase user authenticated and synced with Firestore:', firestoreUser);
        } else {
          setUser(null);
          console.log('User signed out');
        }
      } catch (error) {
        console.error('Error syncing user with Firestore:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}