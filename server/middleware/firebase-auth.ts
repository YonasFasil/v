import { Request, Response, NextFunction } from 'express';
import { verifyIdToken, getFirestoreUser } from '../firebase-admin';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    isSuperAdmin?: boolean;
    [key: string]: any;
  };
}

export async function authenticateFirebase(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);
    
    if (!decodedToken) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get additional user data from Firestore
    const firestoreUser = await getFirestoreUser(decodedToken.uid);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      ...firestoreUser
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Check if user is super admin - for now, we'll check if they're the designated super admin
  if (req.user.email !== 'yonasfasil.sl@gmail.com') {
    return res.status(403).json({ message: 'Super admin access required' });
  }

  next();
}

export function requireAuthenticated(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}