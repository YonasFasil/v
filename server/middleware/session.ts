import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { db } from '../db';

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable must be set');
}

const pgSession = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new pgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: 'sessions'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

// Extend Express Request type to include session with user data
declare global {
  namespace Express {
    interface Request {
      session: session.Session & {
        userId?: string;
        user?: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
        };
      };
    }
  }
}