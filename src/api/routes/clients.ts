import { Router } from 'express';
import db from '../../db.ts';
import { authenticate, validate } from '../middleware.ts';
import { clientSchema } from '../validation.ts';

const router = Router();

router.get('/clients', authenticate, (req, res) => {
  const clients = db.prepare('SELECT * FROM clients ORDER BY name ASC').all();
  res.json(clients);
});

router.post('/clients', authenticate, validate(clientSchema), (req, res) => {
  const { name, email, phone, type, notes } = req.body;
  const result = db.prepare('INSERT INTO clients (name, email, phone, type, notes) VALUES (?, ?, ?, ?, ?)').run(name, email, phone, type, notes);
  res.json({ id: result.lastInsertRowid });
});

export default router;
