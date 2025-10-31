import { Router } from 'express';
import { pool } from '../db/db';
import bcrypt from 'bcrypt';
import { signToken } from '../utils/jwt';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Регистрация
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const hashed = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO "User"(email, password_hash, name) VALUES($1,$2,$3) RETURNING id,email,role,name',
      [email, hashed, name]
    );
    const user = result.rows[0];
    const token = signToken({ id: user.id, role: user.role });
    res.json({ user, token });
  } catch (err: any) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Логин
router.post('/login', async (req, res) => {
  console.log('Login attempt:', req.body);
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM "User" WHERE email=$1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid password' });

    const token = signToken({ id: user.id, role: user.role });
    res.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name }, token });
  } finally {
    client.release();
  }
});

// Пример защищённого роута
router.get('/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Пример роута для админа
router.get('/admin', authenticate, authorize('ADMIN'), (req, res) => {
  res.json({ message: 'Welcome, admin!' });
});

export default router;
