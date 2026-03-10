import { Router } from 'express';
import db from '../../db.ts';
import { authenticate, validate } from '../middleware.ts';
import { visitSchema } from '../validation.ts';

const router = Router();

router.get('/visits', authenticate, (req, res) => {
  const visits = db.prepare(`
    SELECT v.*, l.title as lead_title, p.title as property_title, c.name as client_name
    FROM visits v
    JOIN leads l ON v.lead_id = l.id
    JOIN properties p ON v.property_id = p.id
    JOIN clients c ON l.client_id = c.id
    ORDER BY v.visit_date ASC
  `).all();
  res.json(visits);
});

router.post('/visits', authenticate, validate(visitSchema), (req, res) => {
  const { lead_id, property_id, visit_date, feedback, status } = req.body;
  const result = db.prepare('INSERT INTO visits (lead_id, property_id, visit_date, feedback, status) VALUES (?, ?, ?, ?, ?)').run(lead_id, property_id, visit_date, feedback, status || 'Scheduled');
  res.json({ id: result.lastInsertRowid });
});

export default router;
