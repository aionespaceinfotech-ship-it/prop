import { Router } from 'express';
import db from '../../db.ts';
import { authenticate, authorize } from '../middleware.ts';

const router = Router();

router.get('/agents', authenticate, authorize(['Admin', 'Super Admin']), (req, res) => {
  const agents = db
    .prepare("SELECT id, name FROM users WHERE role IN ('Super Admin', 'Admin', 'Sales') ORDER BY name ASC")
    .all();
  res.json(agents);
});

export default router;
