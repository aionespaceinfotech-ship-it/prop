import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './src/db.ts';
import dotenv from 'dotenv';
import path from 'path';
import { 
  authenticate, 
  authorize, 
  validate, 
  errorHandler 
} from './src/api/middleware.ts';
import { 
  loginSchema, 
  registerSchema, 
  projectSchema, 
  propertySchema, 
  leadSchema, 
  clientSchema, 
  visitSchema, 
  dealSchema 
} from './src/api/validation.ts';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

async function startServer() {
  const app = express();
  const PORT = 3000;

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
      const result = db.prepare('INSERT INTO users (name, email, password, role, commission_pct) VALUES (?, ?, ?, ?, ?)').run(name, email, hashedPassword, role || 'Broker', commission_pct || 2.0);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- Broker Management (Admin Only) ---
  app.get('/api/brokers', authenticate, authorize(['Admin']), (req: any, res) => {
    const brokers = db.prepare("SELECT id, name, email, role, commission_pct, created_at FROM users WHERE role = 'Broker'").all();
    res.json(brokers);
  });

  app.put('/api/brokers/:id', authenticate, authorize(['Admin']), (req: any, res) => {
    const { name, email, commission_pct } = req.body;
    db.prepare('UPDATE users SET name=?, email=?, commission_pct=? WHERE id=?').run(name, email, commission_pct, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/brokers/:id', authenticate, authorize(['Admin']), (req: any, res) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // --- Project Routes ---
  app.get('/api/projects', authenticate, (req, res) => {
    const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
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
    db.prepare('UPDATE properties SET project_id = NULL, is_standalone = 1 WHERE project_id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // --- Property Routes ---
  app.get('/api/properties', (req, res) => {
    const properties = db.prepare(`
      SELECT p.*, pr.name as project_name 
      FROM properties p 
      LEFT JOIN projects pr ON p.project_id = pr.id 
      ORDER BY p.created_at DESC
    `).all();
    res.json(properties);
  });

  app.post('/api/properties', authenticate, validate(propertySchema), (req, res) => {
    const { title, type, location, price, area, facing, status, description, images, owner_name, owner_contact, project_id, plot_number, is_standalone } = req.body;
    const result = db.prepare(`
      INSERT INTO properties (title, type, location, price, area, facing, status, description, images, owner_name, owner_contact, project_id, plot_number, is_standalone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, type, location, price, area, facing, status || 'Available', description, JSON.stringify(images || []), owner_name, owner_contact, project_id, plot_number, is_standalone ?? 1);
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/properties/:id', authenticate, validate(propertySchema), (req, res) => {
    const { title, type, location, price, area, facing, status, description, images, owner_name, owner_contact, project_id, plot_number, is_standalone } = req.body;
    db.prepare(`
      UPDATE properties SET title=?, type=?, location=?, price=?, area=?, facing=?, status=?, description=?, images=?, owner_name=?, owner_contact=?, project_id=?, plot_number=?, is_standalone=?
      WHERE id=?
    `).run(title, type, location, price, area, facing, status, description, JSON.stringify(images || []), owner_name, owner_contact, project_id, plot_number, is_standalone ?? 1, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/properties/:id', authenticate, (req, res) => {
    db.prepare('DELETE FROM properties WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // --- Lead Routes ---
  app.get('/api/leads', authenticate, (req, res) => {
    const leads = db.prepare(`
      SELECT l.*, c.name as client_name, u.name as broker_name 
      FROM leads l 
      LEFT JOIN clients c ON l.client_id = c.id 
      LEFT JOIN users u ON l.assigned_to = u.id
      ORDER BY l.created_at DESC
    `).all();
    res.json(leads);
  });

  app.post('/api/leads', authenticate, validate(leadSchema), (req, res) => {
    const { 
      client_id, title, source, status, assigned_to, 
      min_budget, max_budget, preferred_location, property_type,
      required_area, bhk_requirement, parking_requirement,
      facing_preference, construction_status, alternate_phone,
      email, notes 
    } = req.body;
    const result = db.prepare(`
      INSERT INTO leads (
        client_id, title, source, status, assigned_to, 
        min_budget, max_budget, preferred_location, property_type,
        required_area, bhk_requirement, parking_requirement,
        facing_preference, construction_status, alternate_phone,
        email, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      client_id, title, source, status || 'New', assigned_to, 
      min_budget, max_budget, preferred_location, property_type,
      required_area, bhk_requirement, parking_requirement,
      facing_preference, construction_status, alternate_phone,
      email, notes
    );
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/leads/:id', authenticate, validate(leadSchema), (req, res) => {
    const { 
      status, notes, assigned_to, min_budget, max_budget, 
      preferred_location, property_type, required_area, 
      bhk_requirement, parking_requirement, facing_preference, 
      construction_status, alternate_phone, email 
    } = req.body;
    db.prepare(`
      UPDATE leads SET 
        status=?, notes=?, assigned_to=?, min_budget=?, max_budget=?, 
        preferred_location=?, property_type=?, required_area=?, 
        bhk_requirement=?, parking_requirement=?, facing_preference=?, 
        construction_status=?, alternate_phone=?, email=?
      WHERE id=?
    `).run(
      status, notes, assigned_to, min_budget, max_budget, 
      preferred_location, property_type, required_area, 
      bhk_requirement, parking_requirement, facing_preference, 
      construction_status, alternate_phone, email, req.params.id
    );
    res.json({ success: true });
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
  app.get('/api/deals', authenticate, (req, res) => {
    const deals = db.prepare(`
      SELECT d.*, l.title as lead_title, p.title as property_title, u.name as broker_name
      FROM deals d
      JOIN leads l ON d.lead_id = l.id
      JOIN properties p ON d.property_id = p.id
      JOIN users u ON d.broker_id = u.id
      ORDER BY d.closing_date DESC
    `).all();
    res.json(deals);
  });

  app.post('/api/deals', authenticate, validate(dealSchema), (req, res) => {
    const { lead_id, property_id, broker_id, final_value, commission_rate, closing_date, status } = req.body;
    const commission_amount = (final_value * commission_rate) / 100;
    const result = db.prepare(`
      INSERT INTO deals (lead_id, property_id, broker_id, final_value, commission_rate, commission_amount, closing_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(lead_id, property_id, broker_id, final_value, commission_rate, commission_amount, closing_date, status || 'Closed');
    
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
