import { Router } from 'express';
import db from '../../db.ts';
import { authenticate, validate } from '../middleware.ts';
import { leadCreateSchema, leadUpdateSchema, followupSchema } from '../validation.ts';
import { normalizeLegacyPropertyType, normalizePreferredLocations } from '../utils.ts';

const router = Router();

router.get('/leads', authenticate, (req: any, res) => {
  const salespersonFilter = req.user?.role === 'Sales' ? 'WHERE l.assigned_to = ?' : '';
  const query = `
    SELECT
      l.*,
      c.name as client_name,
      c.phone as client_phone,
      COALESCE(l.email, c.email) as client_email,
      u.name as broker_name,
      lr.plot_size,
      lr.corner_plot as req_corner_plot,
      lr.road_width as req_road_width,
      lr.facing as req_facing,
      lr.gated_colony as req_gated_colony,
      lr.park_facing as req_park_facing,
      lr.bhk as req_bhk,
      lr.floor_preference as req_floor_preference,
      lr.lift_required as req_lift_required,
      lr.parking as req_parking,
      lr.furnishing as req_furnishing
    FROM leads l 
    LEFT JOIN clients c ON l.client_id = c.id 
    LEFT JOIN users u ON l.assigned_to = u.id
    LEFT JOIN lead_requirements lr ON lr.lead_id = l.id
    ${salespersonFilter}
    ORDER BY l.created_at DESC
  `;
  const leads = req.user?.role === 'Sales'
    ? db.prepare(query).all(req.user.id)
    : db.prepare(query).all();
  res.json(leads);
});

router.get('/leads/check-phone/:phone', authenticate, (req, res) => {
  const existing = db
    .prepare(`
      SELECT l.id, c.name as customer_name, c.phone, l.status, l.created_at
      FROM leads l
      JOIN clients c ON c.id = l.client_id
      WHERE c.phone = ?
      ORDER BY l.created_at DESC
      LIMIT 1
    `)
    .get(req.params.phone) as any;
  res.json({ exists: !!existing, lead: existing || null });
});

router.post('/leads', authenticate, validate(leadCreateSchema), (req: any, res) => {
  const { 
    client_id, title, source, status, assigned_to, 
    min_budget, max_budget, preferred_location, preferred_locations, property_type, property_type_interested,
    required_area, required_area_value, required_area_unit, road_requirement_ft, road_requirement_custom,
    authority_preference, bhk_requirement, parking_requirement, facing_preference, construction_status, alternate_phone,
    email, notes, plot_size, corner_plot, road_width, facing, gated_colony, park_facing, bhk, floor_preference,
    lift_required, parking, furnishing
  } = req.body;
  const locationsJson = normalizePreferredLocations(preferred_locations, preferred_location);
  const normalizedType = normalizeLegacyPropertyType(property_type || property_type_interested);
  const safeAssignedTo = req.user?.role === 'Sales' ? req.user.id : assigned_to;
  const result = db.prepare(`
    INSERT INTO leads (
      client_id, title, source, status, assigned_to, 
      min_budget, max_budget, preferred_location, property_type,
      required_area, bhk_requirement, parking_requirement,
      facing_preference, construction_status, alternate_phone, email, notes,
      preferred_locations, property_type_interested, required_area_value, required_area_unit,
      road_requirement_ft, road_requirement_custom, authority_preference
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    client_id, title, source, status || 'New Lead', safeAssignedTo, 
    min_budget, max_budget, preferred_location, normalizedType,
    required_area, bhk_requirement, parking_requirement,
    facing_preference, construction_status, alternate_phone,
    email, notes, locationsJson, normalizedType, required_area_value,
    required_area_unit, road_requirement_ft, road_requirement_custom, authority_preference
  );
  db.prepare(`
    INSERT INTO lead_requirements (
      lead_id, plot_size, corner_plot, road_width, facing, gated_colony, park_facing,
      bhk, floor_preference, lift_required, parking, furnishing
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(lead_id) DO UPDATE SET
      plot_size=excluded.plot_size,
      corner_plot=excluded.corner_plot,
      road_width=excluded.road_width,
      facing=excluded.facing,
      gated_colony=excluded.gated_colony,
      park_facing=excluded.park_facing,
      bhk=excluded.bhk,
      floor_preference=excluded.floor_preference,
      lift_required=excluded.lift_required,
      parking=excluded.parking,
      furnishing=excluded.furnishing,
      updated_at=CURRENT_TIMESTAMP
  `).run(
    result.lastInsertRowid,
    plot_size ?? null,
    corner_plot ?? null,
    road_width ?? road_requirement_ft ?? null,
    facing ?? facing_preference ?? null,
    gated_colony ?? null,
    park_facing ?? null,
    bhk ?? null,
    floor_preference ?? null,
    lift_required ?? null,
    parking ?? (parking_requirement ? 1 : 0),
    furnishing ?? null
  );
  res.json({ id: result.lastInsertRowid });
});

router.put('/leads/:id', authenticate, validate(leadUpdateSchema), (req: any, res) => {
  const { 
    status, notes, assigned_to, min_budget, max_budget, 
    preferred_location, preferred_locations, property_type, property_type_interested, required_area, required_area_value, required_area_unit,
    road_requirement_ft, road_requirement_custom, authority_preference,
    bhk_requirement, parking_requirement, facing_preference, 
    construction_status, alternate_phone, email,
    plot_size, corner_plot, road_width, facing, gated_colony, park_facing, bhk, floor_preference,
    lift_required, parking, furnishing
  } = req.body;

  const currentLead = db.prepare('SELECT * FROM leads WHERE id=?').get(req.params.id) as any;
  if (!currentLead) return res.status(404).json({ error: 'Lead not found' });
  if (req.user?.role === 'Sales' && currentLead.assigned_to !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const mergedPreferredLocation = preferred_location ?? currentLead.preferred_location;
  const mergedPreferredLocations = preferred_locations
    ? JSON.stringify(preferred_locations.map((item: string) => item.trim()).filter(Boolean))
    : (currentLead.preferred_locations || normalizePreferredLocations(undefined, mergedPreferredLocation));
  const normalizedType = normalizeLegacyPropertyType(property_type || property_type_interested || currentLead.property_type_interested || currentLead.property_type);

  db.prepare(`
    UPDATE leads SET 
      status=?, notes=?, assigned_to=?, min_budget=?, max_budget=?, 
      preferred_location=?, property_type=?, required_area=?, 
      bhk_requirement=?, parking_requirement=?, facing_preference=?, 
      construction_status=?, alternate_phone=?, email=?, preferred_locations=?,
      property_type_interested=?, required_area_value=?, required_area_unit=?,
      road_requirement_ft=?, road_requirement_custom=?, authority_preference=?
    WHERE id=?
  `).run(
    status ?? currentLead.status,
    notes ?? currentLead.notes,
    req.user?.role === 'Sales' ? req.user.id : (assigned_to ?? currentLead.assigned_to),
    min_budget ?? currentLead.min_budget,
    max_budget ?? currentLead.max_budget,
    mergedPreferredLocation,
    normalizedType,
    required_area ?? currentLead.required_area,
    bhk_requirement ?? currentLead.bhk_requirement,
    parking_requirement ?? currentLead.parking_requirement,
    facing_preference ?? currentLead.facing_preference,
    construction_status ?? currentLead.construction_status,
    alternate_phone ?? currentLead.alternate_phone,
    email ?? currentLead.email,
    mergedPreferredLocations,
    normalizedType,
    required_area_value ?? currentLead.required_area_value,
    required_area_unit ?? currentLead.required_area_unit,
    road_requirement_ft ?? currentLead.road_requirement_ft,
    road_requirement_custom ?? currentLead.road_requirement_custom,
    authority_preference ?? currentLead.authority_preference,
    req.params.id
  );

  db.prepare(`
    INSERT INTO lead_requirements (
      lead_id, plot_size, corner_plot, road_width, facing, gated_colony, park_facing,
      bhk, floor_preference, lift_required, parking, furnishing
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(lead_id) DO UPDATE SET
      plot_size=excluded.plot_size,
      corner_plot=excluded.corner_plot,
      road_width=excluded.road_width,
      facing=excluded.facing,
      gated_colony=excluded.gated_colony,
      park_facing=excluded.park_facing,
      bhk=excluded.bhk,
      floor_preference=excluded.floor_preference,
      lift_required=excluded.lift_required,
      parking=excluded.parking,
      furnishing=excluded.furnishing,
      updated_at=CURRENT_TIMESTAMP
  `).run(
    req.params.id,
    plot_size ?? null,
    corner_plot ?? null,
    road_width ?? road_requirement_ft ?? null,
    facing ?? facing_preference ?? null,
    gated_colony ?? null,
    park_facing ?? null,
    bhk ?? null,
    floor_preference ?? null,
    lift_required ?? null,
    parking ?? (parking_requirement ? 1 : 0),
    furnishing ?? null
  );
  res.json({ success: true });
});

router.get('/leads/:id/followups', authenticate, (req: any, res) => {
  const lead = db.prepare('SELECT assigned_to FROM leads WHERE id = ?').get(req.params.id) as any;
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (req.user?.role === 'Sales' && lead.assigned_to !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const rows = db.prepare(`
    SELECT f.*, u.name as created_by_name
    FROM followups f
    LEFT JOIN users u ON u.id = f.created_by
    WHERE f.lead_id = ?
    ORDER BY f.followup_date ASC, f.created_at ASC
  `).all(req.params.id);
  res.json(rows);
});

router.post('/leads/:id/followups', authenticate, validate(followupSchema), (req: any, res) => {
  const { followup_date, notes } = req.body;
  const lead = db.prepare('SELECT id FROM leads WHERE id = ?').get(req.params.id) as any;
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const leadOwner = db.prepare('SELECT assigned_to FROM leads WHERE id = ?').get(req.params.id) as any;
  if (req.user?.role === 'Sales' && leadOwner?.assigned_to !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const result = db
    .prepare('INSERT INTO followups (lead_id, followup_date, notes, created_by) VALUES (?, ?, ?, ?)')
    .run(req.params.id, followup_date, notes || '', req.user?.id || null);
  res.json({ id: result.lastInsertRowid });
});

export default router;
