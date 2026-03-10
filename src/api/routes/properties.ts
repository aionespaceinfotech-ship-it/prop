import { Router } from 'express';
import db from '../../db.ts';
import { authenticate, validate } from '../middleware.ts';
import { propertySchema } from '../validation.ts';
import { normalizeLegacyPropertyType } from '../utils.ts';

const router = Router();

router.get('/properties', authenticate, (req, res) => {
  const properties = db.prepare(`
    SELECT p.*, pr.name as project_name 
    FROM properties p 
    LEFT JOIN projects pr ON p.project_id = pr.id 
    ORDER BY p.created_at DESC
  `).all();
  res.json(properties);
});

router.post('/properties', authenticate, validate(propertySchema), (req, res) => {
  const {
    title, type, location, price, area, plot_size, facing, status, description, images,
    owner_name, owner_contact, project_id, plot_number, is_standalone,
    approval_type, road_width_ft, road_width_custom, corner_plot, gated_colony,
    water_supply, electricity_available, sewerage_connection, property_age_years, map_link,
    construction_status
  } = req.body;
  const result = db.prepare(`
    INSERT INTO properties (
      title, type, location, price, area, plot_size, facing, status, description, images,
      owner_name, owner_contact, project_id, plot_number, is_standalone,
      approval_type, road_width_ft, road_width_custom, corner_plot, gated_colony,
      water_supply, electricity_available, sewerage_connection, property_age_years, map_link, construction_status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, normalizeLegacyPropertyType(type), location, price, area, plot_size, facing, status || 'Available',
    description, JSON.stringify(images || []), owner_name, owner_contact, project_id, plot_number,
    is_standalone ?? 1, approval_type, road_width_ft, road_width_custom, corner_plot ?? 0, gated_colony ?? 0,
    water_supply ?? 0, electricity_available ?? 0, sewerage_connection ?? 0, property_age_years, map_link, construction_status
  );
  res.json({ id: result.lastInsertRowid });
});

router.put('/properties/:id', authenticate, validate(propertySchema), (req, res) => {
  const {
    title, type, location, price, area, plot_size, facing, status, description, images,
    owner_name, owner_contact, project_id, plot_number, is_standalone,
    approval_type, road_width_ft, road_width_custom, corner_plot, gated_colony,
    water_supply, electricity_available, sewerage_connection, property_age_years, map_link,
    construction_status
  } = req.body;
  db.prepare(`
    UPDATE properties SET
      title=?, type=?, location=?, price=?, area=?, plot_size=?, facing=?, status=?, description=?, images=?, owner_name=?,
      owner_contact=?, project_id=?, plot_number=?, is_standalone=?, approval_type=?, road_width_ft=?,
      road_width_custom=?, corner_plot=?, gated_colony=?, water_supply=?, electricity_available=?,
      sewerage_connection=?, property_age_years=?, map_link=?, construction_status=?
    WHERE id=?
  `).run(
    title, normalizeLegacyPropertyType(type), location, price, area, plot_size, facing, status, description,
    JSON.stringify(images || []), owner_name, owner_contact, project_id, plot_number, is_standalone ?? 1,
    approval_type, road_width_ft, road_width_custom, corner_plot ?? 0, gated_colony ?? 0,
    water_supply ?? 0, electricity_available ?? 0, sewerage_connection ?? 0, property_age_years, map_link,
    construction_status, req.params.id
  );
  res.json({ success: true });
});

router.delete('/properties/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM properties WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
