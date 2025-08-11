import session from 'express-session';
import { Pool } from 'pg';

// Configure session store
export const configureSession = () => {
  // Use memory store for now, but can be upgraded to PostgreSQL store later
  return session({
    secret: process.env.SESSION_SECRET || 'venuin-session-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict', // CSRF protection
    },
    name: 'venuin.sid', // Custom session name
  });
};