import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './src/db.ts';
import dotenv from 'dotenv';
import path from 'path';
import { 
  authenticate, 
  validate, 
  errorHandler 
} from './src/api/middleware.ts';
import { 
  loginSchema, 
  registerSchema, 
  projectSchema, 
  propertySchema, 
  leadCreateSchema, 
  leadUpdateSchema, 
  followupSchema,
  clientSchema, 
  visitSchema, 
  dealSchema 
} from './src/api/validation.ts';
import { PROPERTY_TYPES } from './src/constants/realEstate.ts';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

const LEGACY_PROPERTY_TYPE_MAP: Record<string, (typeof PROPERTY_TYPES)[number]> = {
  Apartment: 'Flat',
  'Apartment / Flat': 'Flat',
  Commercial: 'Shop',
  'Commercial Space': 'Shop',
  'Commercial Shop': 'Shop',
  'Office Space': 'Office',
};

function normalizeLegacyPropertyType(value?: string) {
  if (!value) return undefined;
  return LEGACY_PROPERTY_TYPE_MAP[value] || value;
}

function normalizePreferredLocations(
  preferred_locations?: string[],
  preferred_location?: string
) {
  if (preferred_locations && preferred_locations.length > 0) {
    return JSON.stringify(preferred_locations.map((item) => item.trim()).filter(Boolean));
  }
  if (preferred_location && preferred_location.trim()) {
    return JSON.stringify(
      preferred_location
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }
  return JSON.stringify([]);
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isAdminRole = (role?: string) => role === 'Admin' || role === 'Super Admin';

  app.use(express.json());

  // --- Public Routes ---
  app.get('/api/public/properties', (req, res) => {
    const properties = db.prepare("SELECT id, title, type, location, price, area, facing, status, description, images FROM properties WHERE status = 'Available' ORDER BY created_at DESC").all();
    res.json(properties);
  });

  // --- Auth Routes ---
  app.post('/api/auth/login', validate(loginSchema), (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (Number(user.active ?? 1) !== 1) {
      return res.status(403).json({ error: 'User is deactivated' });
    }
    const token = jwt.sign({ 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      name: user.name, 
      commission_pct: user.commission_pct 
    }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, commission_pct: user.commission_pct } });
  });

  app.post('/api/auth/register', validate(registerSchema), (req, res) => {
    const { name, email, password, role, commission_pct } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (name, email, password, role, commission_pct) VALUES (?, ?, ?, ?, ?)').run(name, email, hashedPassword, role || 'Sales', commission_pct || 2.0);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/users/sales', authenticate, (req: any, res) => {
    if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const rows = db.prepare("SELECT id, name, email, phone, role, active, created_at FROM users WHERE role = 'Sales' ORDER BY created_at DESC").all();
    res.json(rows);
  });

  app.post('/api/users/sales', authenticate, (req: any, res) => {
    if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !phone || !password) return res.status(400).json({ error: 'Name, email, phone and password are required' });
    const hashedPassword = bcrypt.hashSync(password, 10);
    const safeRole = role === 'Sales' ? 'Sales' : 'Sales';
    const result = db.prepare('INSERT INTO users (name, email, phone, password, role, active) VALUES (?, ?, ?, ?, ?, 1)').run(name, email, phone, hashedPassword, safeRole);
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/users/sales/:id', authenticate, (req: any, res) => {
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

  app.put('/api/users/sales/:id/active', authenticate, (req: any, res) => {
    if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const { active } = req.body;
    db.prepare("UPDATE users SET active = ? WHERE id = ? AND role = 'Sales'").run(active ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  // --- Project Routes ---
  app.get('/api/projects', authenticate, (req, res) => {
    const projects = db.prepare(`
      SELECT
        p.*,
        COALESCE((SELECT COUNT(*) FROM project_plots pp WHERE pp.project_id = p.id), 0) as total_plots_count,
        COALESCE((SELECT COUNT(*) FROM project_plots pp WHERE pp.project_id = p.id AND pp.status = 'Available'), 0) as available_plots_count,
        COALESCE((SELECT COUNT(*) FROM project_plots pp WHERE pp.project_id = p.id AND pp.status = 'Sold'), 0) as sold_plots_count
      FROM projects p
      ORDER BY p.created_at DESC
    `).all();
    res.json(projects);
  });

  app.post('/api/projects', authenticate, validate(projectSchema), (req, res) => {
    const { name, location, total_land_area, total_plots, plot_size_options, description, amenities, status, layout_map, developer_name } = req.body;
    const result = db.prepare(`
      INSERT INTO projects (name, location, total_land_area, total_plots, plot_size_options, description, amenities, status, layout_map, developer_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, location, total_land_area, total_plots, plot_size_options, description, amenities, status, layout_map, developer_name);
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/projects/:id', authenticate, validate(projectSchema), (req, res) => {
    const { name, location, total_land_area, total_plots, plot_size_options, description, amenities, status, layout_map, developer_name } = req.body;
    db.prepare(`
      UPDATE projects SET name=?, location=?, total_land_area=?, total_plots=?, plot_size_options=?, description=?, amenities=?, status=?, layout_map=?, developer_name=?
      WHERE id=?
    `).run(name, location, total_land_area, total_plots, plot_size_options, description, amenities, status, layout_map, developer_name, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/projects/:id', authenticate, (req, res) => {
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    db.prepare('DELETE FROM project_plots WHERE project_id = ?').run(req.params.id);
    db.prepare('UPDATE properties SET project_id = NULL, is_standalone = 1 WHERE project_id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/projects/:id/plots', authenticate, (req, res) => {
    const rows = db.prepare('SELECT * FROM project_plots WHERE project_id = ? ORDER BY plot_number ASC').all(req.params.id);
    res.json(rows);
  });

  app.post('/api/projects/:id/plots/bulk', authenticate, (req, res) => {
    const { plot_ranges, default_size, facing, road_width_ft, price, status } = req.body as any;
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any;
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!plot_ranges) return res.status(400).json({ error: 'plot_ranges is required' });

    const numbers = new Set<number>();
    String(plot_ranges)
      .split(',')
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .forEach((chunk) => {
        const [startRaw, endRaw] = chunk.split('-').map((v) => Number(v.trim()));
        if (!Number.isNaN(startRaw) && !Number.isNaN(endRaw) && endRaw >= startRaw) {
          for (let n = startRaw; n <= endRaw; n += 1) numbers.add(n);
          return;
        }
        const single = Number(chunk);
        if (!Number.isNaN(single)) numbers.add(single);
      });
    if (numbers.size === 0) return res.status(400).json({ error: 'Invalid plot_ranges' });

    const insertProperty = db.prepare(`
      INSERT INTO properties (project_id, title, type, location, price, area, plot_size, facing, road_width_ft, status, plot_number, is_standalone)
      VALUES (?, ?, 'Plot', ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);
    const insertPlot = db.prepare(`
      INSERT INTO project_plots (project_id, plot_number, size, facing, road_width_ft, status, property_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const n of Array.from(numbers).sort((a, b) => a - b)) {
      const plotNumber = String(n);
      const plotStatus = status === 'Sold' ? 'Sold' : 'Available';
      const propResult = insertProperty.run(
        req.params.id,
        `${project.name} - Plot ${plotNumber}`,
        project.location,
        Number(price) || 0,
        Number(default_size) || 0,
        default_size || '',
        facing || null,
        road_width_ft || null,
        plotStatus,
        plotNumber
      );
      insertPlot.run(req.params.id, plotNumber, default_size || '', facing || null, road_width_ft || null, plotStatus, propResult.lastInsertRowid);
    }
    res.json({ success: true, created: numbers.size });
  });

  app.post('/api/projects/:id/plots', authenticate, (req, res) => {
    const { plot_number, size, facing, road_width_ft, price, status } = req.body as any;
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any;
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!plot_number) return res.status(400).json({ error: 'Plot number is required' });

    const propertyStatus = status === 'Sold' ? 'Sold' : 'Available';
    const propResult = db.prepare(`
      INSERT INTO properties (project_id, title, type, location, price, area, plot_size, facing, road_width_ft, status, plot_number, is_standalone)
      VALUES (?, ?, 'Plot', ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      req.params.id,
      `${project.name} - Plot ${plot_number}`,
      project.location,
      Number(price) || 0,
      Number(size) || 0,
      size || '',
      facing || null,
      road_width_ft || null,
      propertyStatus,
      plot_number
    );

    const result = db.prepare(`
      INSERT INTO project_plots (project_id, plot_number, size, facing, road_width_ft, status, property_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.id, plot_number, size || '', facing || null, road_width_ft || null, status || 'Available', propResult.lastInsertRowid);
    res.json({ id: result.lastInsertRowid, property_id: propResult.lastInsertRowid });
  });

  // --- Property Routes ---
  app.get('/api/properties', authenticate, (req, res) => {
    const properties = db.prepare(`
      SELECT p.*, pr.name as project_name 
      FROM properties p 
      LEFT JOIN projects pr ON p.project_id = pr.id 
      ORDER BY p.created_at DESC
    `).all();
    res.json(properties);
  });

  app.post('/api/properties', authenticate, validate(propertySchema), (req, res) => {
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

  app.put('/api/properties/:id', authenticate, validate(propertySchema), (req, res) => {
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

  app.delete('/api/properties/:id', authenticate, (req, res) => {
    db.prepare('DELETE FROM properties WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // --- Lead Routes ---
  app.get('/api/agents', authenticate, (req, res) => {
    const agents = db
      .prepare("SELECT id, name FROM users WHERE role IN ('Super Admin', 'Admin', 'Sales') ORDER BY name ASC")
      .all();
    res.json(agents);
  });

  app.get('/api/leads', authenticate, (req: any, res) => {
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

  app.get('/api/leads/check-phone/:phone', authenticate, (req, res) => {
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

  app.post('/api/leads', authenticate, validate(leadCreateSchema), (req: any, res) => {
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

  app.put('/api/leads/:id', authenticate, validate(leadUpdateSchema), (req: any, res) => {
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

  app.get('/api/leads/:id/followups', authenticate, (req: any, res) => {
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

  app.post('/api/leads/:id/followups', authenticate, validate(followupSchema), (req: any, res) => {
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

  // --- Client Routes ---
  app.get('/api/clients', authenticate, (req, res) => {
    const clients = db.prepare('SELECT * FROM clients ORDER BY name ASC').all();
    res.json(clients);
  });

  app.post('/api/clients', authenticate, validate(clientSchema), (req, res) => {
    const { name, email, phone, type, notes } = req.body;
    const result = db.prepare('INSERT INTO clients (name, email, phone, type, notes) VALUES (?, ?, ?, ?, ?)').run(name, email, phone, type, notes);
    res.json({ id: result.lastInsertRowid });
  });

  // --- Visit Routes ---
  app.get('/api/visits', authenticate, (req, res) => {
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

  app.post('/api/visits', authenticate, validate(visitSchema), (req, res) => {
    const { lead_id, property_id, visit_date, feedback, status } = req.body;
    const result = db.prepare('INSERT INTO visits (lead_id, property_id, visit_date, feedback, status) VALUES (?, ?, ?, ?, ?)').run(lead_id, property_id, visit_date, feedback, status || 'Scheduled');
    res.json({ id: result.lastInsertRowid });
  });

  // --- Dashboard Stats ---
  app.get('/api/stats', authenticate, (req, res) => {
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

  // --- Deal Routes ---
  app.get('/api/deals', authenticate, (req: any, res) => {
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

  app.post('/api/deals', authenticate, validate(dealSchema), (req: any, res) => {
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

  // --- Reports ---
  app.get('/api/reports/sales', authenticate, (req, res) => {
    const sales = db.prepare(`
      SELECT strftime('%Y-%m', closing_date) as month, SUM(final_value) as total_sales, SUM(commission_amount) as total_commission, COUNT(*) as deal_count
      FROM deals
      WHERE status = 'Closed'
      GROUP BY month
      ORDER BY month DESC
    `).all();
    res.json(sales);
  });

  // Global Error Handler
  app.use(errorHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
