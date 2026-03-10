import { Router } from 'express';
import db from '../../db.ts';
import { authenticate } from '../middleware.ts';

const router = Router();

router.get('/reports/sales', authenticate, (req, res) => {
  const sales = db.prepare(`
    SELECT strftime('%Y-%m', closing_date) as month, SUM(final_value) as total_sales, SUM(commission_amount) as total_commission, COUNT(*) as deal_count
    FROM deals
    WHERE status = 'Closed'
    GROUP BY month
    ORDER BY month DESC
  `).all();
  res.json(sales);
});

export default router;
