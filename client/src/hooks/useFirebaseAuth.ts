import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange } from '@/lib/firebase';
import { UserService } from '@/lib/firestore';
import type { UserDoc } from '@shared/firestore-schema';

export interface AuthUser extends UserDoc {
  uid: string;
  currentTenant?: {
    id: string;
    slug: string;
    name: string;
    role: string;
  };
}

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
          
          // Create or update user in Firestore
          const userData = {
            email: firebaseUser.email!,
            firstName: firebaseUser.displayName?.split(' ')[0] || '',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            emailVerified: firebaseUser.emailVerified,
          };
          
          await UserService.createOrUpdateUser(userData);
          
          // Get the complete user data including super admin status
          const firestoreUser = await UserService.getUserByEmail(firebaseUser.email!);
          const isSuperAdmin = firestoreUser ? await UserService.checkIsSuperAdmin(firestoreUser.id) : false;
          
          // Get user's tenant relationship if they have one
          let currentTenant = null;
          if (!isSuperAdmin && firestoreUser) {
            try {
              const tenantUserSnapshot = await UserService.getUserTenant(firebaseUser.uid);
              if (tenantUserSnapshot) {
                currentTenant = {
                  id: tenantUserSnapshot.tenantId,
                  slug: tenantUserSnapshot.tenantSlug,
                  name: tenantUserSnapshot.tenantName,
                  role: tenantUserSnapshot.role,
                };
              }
            } catch (error) {
              console.error('Error fetching user tenant:', error);
            }
          }
          
          const authUser: AuthUser = {
            uid: firebaseUser.uid,
            id: firestoreUser?.id || firebaseUser.uid,
            email: firebaseUser.email!,
            firstName: firestoreUser?.firstName || userData.firstName,
            lastName: firestoreUser?.lastName || userData.lastName,
            emailVerified: firebaseUser.emailVerified,
            isSuperAdmin,
            currentTenant,
            createdAt: firestoreUser?.createdAt || new Date(),
            updatedAt: firestoreUser?.updatedAt || new Date(),
          };
          
          setUser(authUser);
          console.log('Firebase user authenticated and synced with Firestore:', authUser);
          
          // Sync session with backend for middleware compatibility
          try {
            const idToken = await firebaseUser.getIdToken();
            const response = await fetch('/api/auth/sync-session', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              console.log('Session synced successfully with backend');
            } else {
              console.error('Failed to sync session:', response.status);
            }
          } catch (sessionError) {
            console.error('Error syncing session:', sessionError);
          }
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