import type { Express } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export function registerDevRoutes(app: Express) {
  // GET /api/dev/make-superadmin - Create superadmin user for development
  app.get('/api/dev/make-superadmin', async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Not available in production' });
      }

      // Check if superadmin already exists
      const result = await db.execute(sql`
        SELECT * FROM users WHERE role = ${'superadmin'} LIMIT 1
      `);
      const existingSuperadmin = result.rows[0];

      if (existingSuperadmin) {
        return res.json({ 
          message: 'Superadmin already exists',
          email: existingSuperadmin.email,
          accessUrl: '/superadmin'
        });
      }

      // Create superadmin user using direct SQL
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const result2 = await db.execute(sql`
        INSERT INTO users (email, password, first_name, last_name, role, email_verified)
        VALUES (${'admin@venuin.com'}, ${hashedPassword}, ${'Super'}, ${'Admin'}, ${'superadmin'}, ${true})
        RETURNING *
      `);
      const superadmin = result2.rows[0];

      res.json({
        message: 'Superadmin created successfully',
        email: 'admin@venuin.com',
        password: 'admin123',
        accessUrl: '/superadmin',
        instructions: 'Login with the credentials above, then navigate to /superadmin'
      });
    } catch (error) {
      console.error('Error creating superadmin:', error);
      res.status(500).json({ message: 'Error creating superadmin' });
    }
  });
}