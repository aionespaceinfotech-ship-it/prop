import { Router } from 'express';
import db from '../../db.ts';

const router = Router();

router.get('/properties', (req, res) => {
  const properties = db.prepare("SELECT id, title, type, location, price, area, facing, status, description, images, approval_type, corner_plot, gated_colony FROM properties WHERE status = 'Available' ORDER BY created_at DESC").all();
  res.json(properties);
});

export default router;
