import { Router } from 'express';
import db from '../../db.ts';
import { authenticate, validate } from '../middleware.ts';
import { projectSchema } from '../validation.ts';

const router = Router();

router.get('/projects', authenticate, (req, res) => {
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

router.post('/projects', authenticate, validate(projectSchema), (req, res) => {
  const { name, location, total_land_area, total_plots, plot_size_options, description, amenities, status, layout_map, developer_name } = req.body;
  const result = db.prepare(`
    INSERT INTO projects (name, location, total_land_area, total_plots, plot_size_options, description, amenities, status, layout_map, developer_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, location, total_land_area, total_plots, plot_size_options, description, amenities, status, layout_map, developer_name);
  res.json({ id: result.lastInsertRowid });
});

router.put('/projects/:id', authenticate, validate(projectSchema), (req, res) => {
  const { name, location, total_land_area, total_plots, plot_size_options, description, amenities, status, layout_map, developer_name } = req.body;
  db.prepare(`
    UPDATE projects SET name=?, location=?, total_land_area=?, total_plots=?, plot_size_options=?, description=?, amenities=?, status=?, layout_map=?, developer_name=?
    WHERE id=?
  `).run(name, location, total_land_area, total_plots, plot_size_options, description, amenities, status, layout_map, developer_name, req.params.id);
  res.json({ success: true });
});

router.delete('/projects/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  db.prepare('DELETE FROM project_plots WHERE project_id = ?').run(req.params.id);
  db.prepare('UPDATE properties SET project_id = NULL, is_standalone = 1 WHERE project_id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/projects/:id/plots', authenticate, (req, res) => {
  const rows = db.prepare('SELECT * FROM project_plots WHERE project_id = ? ORDER BY plot_number ASC').all(req.params.id);
  res.json(rows);
});

router.post('/projects/:id/plots/bulk', authenticate, (req, res) => {
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

router.post('/projects/:id/plots', authenticate, (req, res) => {
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

export default router;
