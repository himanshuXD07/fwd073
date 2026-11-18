require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const name = (process.env.ADMIN_NAME || 'Portal Administrator').trim();
const email = (process.env.ADMIN_EMAIL || 'admin@students.sau.ac.in').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!/^[^\s@]+@students\.sau\.ac\.in$/i.test(email) || !password || password.length < 12) {
  throw new Error('Set ADMIN_EMAIL to an SAU student email and ADMIN_PASSWORD to at least 12 characters in .env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST,
  port: process.env.DATABASE_URL ? undefined : Number(process.env.DB_PORT || 26257),
  user: process.env.DATABASE_URL ? undefined : process.env.DB_USER,
  password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
  database: process.env.DATABASE_URL ? undefined : (process.env.DB_NAME || 'defaultdb'),
  ssl: process.env.DB_SSL === 'false' ? false : {
    rejectUnauthorized: true,
    ...(process.env.DB_SSL_CA_PATH ? { ca: fs.readFileSync(process.env.DB_SSL_CA_PATH, 'utf8') } : {})
  }
});

(async () => {
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query(
      `INSERT INTO users(name,email,password_hash,role,email_verified_at)
       VALUES($1,$2,$3,'admin',NOW())
       ON CONFLICT(email) DO UPDATE SET
         name=EXCLUDED.name,
         password_hash=EXCLUDED.password_hash,
         role='admin',
         email_verified_at=NOW()`,
      [name, email, passwordHash]
    );
    console.log('Admin account ready.');
  } catch (error) {
    console.error('Could not create the admin account:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
