import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange } from '@/lib/firebase';
import { createOrUpdateUser, FirestoreUser } from '@/lib/firestore';

export interface AuthUser extends FirestoreUser {}

export function useFirebaseAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up Firebase auth listener...');
    const unsubscribe = onAuthChange(async (firebaseUser: User | null) => {
      console.log('Firebase auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
      
      try {
        if (firebaseUser) {
          console.log('Creating/updating user in Firestore...');
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