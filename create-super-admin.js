const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('SuperAdmin2024!', 12);
    
    // Insert super admin user
    const result = await pool.query(`
      INSERT INTO users (
        id,
        username, 
        password, 
        name, 
        email, 
        tenant_id,
        role, 
        permissions, 
        is_active, 
        created_at
      ) VALUES (
        gen_random_uuid(),
        $1, 
        $2, 
        $3, 
        $4, 
        NULL,
        $5, 
        $6, 
        true, 
        NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        is_active = EXCLUDED.is_active
      RETURNING id, email, name, role
    `, [
      'superadmin',
      hashedPassword,
      'Super Administrator',
      'admin@venuine.com',
      'super_admin',
      JSON.stringify(['all_permissions'])
    ]);

    console.log('Super admin user created/updated:', result.rows[0]);
    console.log('Login credentials:');
    console.log('Email: admin@venuine.com');
    console.log('Password: SuperAdmin2024!');

  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await pool.end();
  }
}

createSuperAdmin();