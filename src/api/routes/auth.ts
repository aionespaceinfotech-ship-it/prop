import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../db.ts';
import { authenticate, validate } from '../middleware.ts';
import { loginSchema, registerSchema } from '../validation.ts';
import { JWT_SECRET, isAdminRole } from '../constants.ts';

const router = Router();

// Login
router.post('/auth/login', validate(loginSchema), (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt for: ${email}`);
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) {
    console.log(`User not found: ${email}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (!bcrypt.compareSync(password, user.password)) {
    console.log(`Password mismatch for: ${email}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (Number(user.active ?? 1) !== 1) {
    console.log(`User deactivated: ${email}`);
    return res.status(403).json({ error: 'User is deactivated' });
  }
  console.log(`Login successful for: ${email} (${user.role})`);
  const token = jwt.sign({ 
    id: user.id, 
    email: user.email, 
    role: user.role, 
    name: user.name, 
    commission_pct: user.commission_pct 
  }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, commission_pct: user.commission_pct } });
});

// Register
router.post('/auth/register', validate(registerSchema), (req, res) => {
  const { name, email, password, role, commission_pct } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password, role, commission_pct) VALUES (?, ?, ?, ?, ?)').run(name, email, hashedPassword, role || 'Sales', commission_pct || 2.0);
    res.json({ id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Sales Users Management
router.get('/users/sales', authenticate, (req: any, res) => {
  if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
  const rows = db.prepare("SELECT id, name, email, phone, role, active, created_at FROM users WHERE role = 'Sales' ORDER BY created_at DESC").all();
  res.json(rows);
});

router.post('/users/sales', authenticate, (req: any, res) => {
  if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !phone || !password) return res.status(400).json({ error: 'Name, email, phone and password are required' });
  const hashedPassword = bcrypt.hashSync(password, 10);
  const safeRole = role === 'Sales' ? 'Sales' : 'Sales';
  const result = db.prepare('INSERT INTO users (name, email, phone, password, role, active) VALUES (?, ?, ?, ?, ?, 1)').run(name, email, phone, hashedPassword, safeRole);
  res.json({ id: result.lastInsertRowid });
});

router.put('/users/sales/:id', authenticate, (req: any, res) => {
  if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
  const { name, email, phone, password } = req.body;
  const existing = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'Sales'").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Sales user not found' });
  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET name = ?, email = ?, phone = ?, password = ? WHERE id = ?').run(name || existing.name, email || existing.email, phone || existing.phone, hashedPassword, req.params.id);
  } else {
    db.prepare('UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?').run(name || existing.name, email || existing.email, phone || existing.phone, req.params.id);
  }
  res.json({ success: true });
});

router.put('/users/sales/:id/active', authenticate, (req: any, res) => {
  if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
  const { active } = req.body;
  db.prepare("UPDATE users SET active = ? WHERE id = ? AND role = 'Sales'").run(active ? 1 : 0, req.params.id);
  res.json({ success: true });
});

export default router;
