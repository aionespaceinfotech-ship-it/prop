import { Router } from 'express';
import db from '../../db.ts';
import { authenticate } from '../middleware.ts';

const router = Router();

router.get('/stats', authenticate, (req, res) => {
  const totalProperties = db.prepare('SELECT COUNT(*) as count FROM properties').get() as any;
  const availableProperties = db.prepare("SELECT COUNT(*) as count FROM properties WHERE status = 'Available'").get() as any;
  const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get() as any;
  const activeDeals = db.prepare("SELECT COUNT(*) as count FROM deals WHERE status = 'Negotiation'").get() as any;
  const upcomingVisits = db.prepare("SELECT COUNT(*) as count FROM visits WHERE visit_date > datetime('now') AND status = 'Scheduled'").get() as any;

  res.json({
    totalProperties: totalProperties.count,
    availableProperties: availableProperties.count,
    totalLeads: totalLeads.count,
    activeDeals: activeDeals.count,
    upcomingVisits: upcomingVisits.count
  });
});

export default router;
