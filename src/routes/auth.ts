import { Router } from 'express';
import { pool } from '../db/db';
import bcrypt from 'bcrypt';
import { signToken } from '../utils/jwt';
import { authenticate, authorize } from '../middleware/auth';
import { DBUser, mapDBUserToUser, User } from '../types/user';

const router = Router();

// Регистрация
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const hashed = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    const result = await client.query<DBUser>(
      `INSERT INTO "User"(email, password_hash, name)
       VALUES($1, $2, $3)
       RETURNING *`,
      [email, hashed, name]
    );

    const dbUser = result.rows[0];
    const user: User = mapDBUserToUser(dbUser);
    const token = signToken({ id: user.id, role: user.role });
    res.json({ user, token });
  } catch (err: any) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- Логин ---
router.post('/login', async (req, res) => {
  console.log('Login attempt:', req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const client = await pool.connect();
  try {
    // Ищем пользователя по email
    const result = await client.query<DBUser>('SELECT * FROM "User" WHERE email = $1', [email]);
    const dbUser = result.rows[0];

    if (!dbUser) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Проверяем пароль
    const match = await bcrypt.compare(password, dbUser.password_hash || '');
    if (!match) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Формируем ответ
    const user = mapDBUserToUser(dbUser);
    const token = signToken({ id: user.id, role: user.role });

    res.json({ user, token });
  } catch (err: any) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
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
