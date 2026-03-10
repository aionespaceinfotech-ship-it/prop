import { Router } from 'express';
import db from '../../db.ts';
import { authenticate, validate } from '../middleware.ts';
import { dealSchema } from '../validation.ts';

const router = Router();

router.get('/deals', authenticate, (req: any, res) => {
  const salesFilter = req.user?.role === 'Sales' ? 'WHERE l.assigned_to = ?' : '';
  const query = `
    SELECT d.*, l.title as lead_title, p.title as property_title, u.name as broker_name
    FROM deals d
    JOIN leads l ON d.lead_id = l.id
    JOIN properties p ON d.property_id = p.id
    JOIN users u ON d.broker_id = u.id
    ${salesFilter}
    ORDER BY d.closing_date DESC
  `;
  const deals = req.user?.role === 'Sales' ? db.prepare(query).all(req.user.id) : db.prepare(query).all();
  res.json(deals);
});

router.post('/deals', authenticate, validate(dealSchema), (req: any, res) => {
  const { lead_id, property_id, broker_id, final_value, commission_rate, closing_date, status } = req.body;
  if (req.user?.role === 'Sales') {
    const lead = db.prepare('SELECT assigned_to FROM leads WHERE id = ?').get(lead_id) as any;
    if (!lead || lead.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  const commission_amount = (final_value * commission_rate) / 100;
  const result = db.prepare(`
    INSERT INTO deals (lead_id, property_id, broker_id, final_value, commission_rate, commission_amount, closing_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(lead_id, property_id, req.user?.role === 'Sales' ? req.user.id : broker_id, final_value, commission_rate, commission_amount, closing_date, status || 'Closed');
  
  if (status === 'Closed') {
    db.prepare("UPDATE properties SET status = 'Sold' WHERE id = ?").run(property_id);
    db.prepare("UPDATE leads SET status = 'Closed' WHERE id = ?").run(lead_id);
  }

  res.json({ id: result.lastInsertRowid });
});

export default router;
