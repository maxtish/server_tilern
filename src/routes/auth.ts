import { Router } from 'express';
import { pool } from '../db/db';
import bcrypt from 'bcrypt';
import { DBUser, mapDBUserToUser, User } from '../types/user';
import { signAccessToken } from '../utils/jwt';
import { createRefreshToken } from '../utils/refreshToken';
const router = Router();

// Регистрация

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

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

    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = await createRefreshToken(user.id, req.headers['user-agent']);

    res.json({ user, accessToken, refreshToken });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- Логин ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const client = await pool.connect();

  try {
    const result = await client.query<DBUser>('SELECT * FROM "User" WHERE email = $1', [email]);

    const dbUser = result.rows[0];
    if (!dbUser) {
      return res.status(400).json({ error: 'User not found' });
    }

    const match = await bcrypt.compare(password, dbUser.password_hash || '');
    if (!match) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const user = mapDBUserToUser(dbUser);

    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = await createRefreshToken(user.id, req.headers['user-agent']);

    res.json({ user, accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  const result = await pool.query(
    `SELECT * FROM "RefreshToken"
     WHERE token = $1 AND revoked = false AND expires_at > NOW()`,
    [refreshToken]
  );

  if (!result.rows.length) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const stored = result.rows[0];

  await pool.query(`UPDATE "RefreshToken" SET revoked = true WHERE id = $1`, [stored.id]);

  const userRes = await pool.query(`SELECT id, role FROM "User" WHERE id = $1`, [stored.user_id]);

  const user = userRes.rows[0];

  const newAccessToken = signAccessToken({
    id: user.id,
    role: user.role,
  });

  const newRefreshToken = await createRefreshToken(user.id);

  res.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
});

// logout
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await pool.query(`UPDATE "RefreshToken" SET revoked = true WHERE token = $1`, [refreshToken]);
  }

  res.json({ success: true });
});

export default router;
