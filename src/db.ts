import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve('data.db');
console.log(`Initializing database at ${dbPath}...`);
const db = new Database(dbPath);

// Enable WAL mode for better performance and reliability
db.pragma('journal_mode = WAL');

// Force a checkpoint to ensure data is written to the main data.db file for visibility
db.pragma('wal_checkpoint(FULL)');

// Initialize database schema
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('Super Admin', 'Admin', 'Sales')) NOT NULL DEFAULT 'Sales',
      active INTEGER DEFAULT 1,
      commission_pct REAL DEFAULT 2.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      total_land_area REAL,
      total_plots INTEGER,
      plot_size_options TEXT,
      description TEXT,
      amenities TEXT,
      status TEXT,
      layout_map TEXT,
      developer_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_plots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      plot_number TEXT NOT NULL,
      size TEXT,
      facing TEXT,
      road_width_ft INTEGER,
      status TEXT CHECK(status IN ('Available', 'Sold')) NOT NULL DEFAULT 'Available',
      property_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, plot_number),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      price REAL NOT NULL,
      area REAL NOT NULL,
      plot_size TEXT,
      facing TEXT,
      approval_type TEXT,
      road_width_ft INTEGER,
      road_width_custom TEXT,
      map_link TEXT,
      corner_plot INTEGER DEFAULT 0,
      gated_colony INTEGER DEFAULT 0,
      water_supply INTEGER DEFAULT 0,
      electricity_available INTEGER DEFAULT 0,
      sewerage_connection INTEGER DEFAULT 0,
      property_age_years REAL,
      construction_status TEXT,
      status TEXT NOT NULL DEFAULT 'Available',
      description TEXT,
      images TEXT,
      owner_name TEXT,
      owner_contact TEXT,
      plot_number TEXT,
      is_standalone INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      type TEXT CHECK(type IN ('Buyer', 'Seller', 'Both')) NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'New Lead',
      assigned_to INTEGER,
      budget REAL,
      min_budget REAL,
      max_budget REAL,
      preferred_location TEXT,
      preferred_locations TEXT,
      property_type TEXT,
      property_type_interested TEXT,
      required_area REAL,
      required_area_value REAL,
      required_area_unit TEXT,
      road_requirement_ft INTEGER,
      road_requirement_custom TEXT,
      authority_preference TEXT,
      bhk_requirement TEXT,
      parking_requirement TEXT,
      facing_preference TEXT,
      construction_status TEXT,
      alternate_phone TEXT,
      email TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS lead_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL UNIQUE,
      plot_size TEXT,
      corner_plot INTEGER DEFAULT 0,
      road_width INTEGER,
      facing TEXT,
      gated_colony INTEGER DEFAULT 0,
      park_facing INTEGER DEFAULT 0,
      bhk INTEGER,
      floor_preference TEXT,
      lift_required INTEGER DEFAULT 0,
      parking INTEGER DEFAULT 0,
      furnishing TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      followup_date DATETIME NOT NULL,
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      visit_date DATETIME NOT NULL,
      feedback TEXT,
      status TEXT CHECK(status IN ('Scheduled', 'Completed', 'Cancelled')) NOT NULL DEFAULT 'Scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      broker_id INTEGER NOT NULL,
      final_value REAL NOT NULL,
      commission_rate REAL NOT NULL,
      commission_amount REAL NOT NULL,
      closing_date DATETIME NOT NULL,
      status TEXT CHECK(status IN ('Negotiation', 'Closed')) NOT NULL DEFAULT 'Closed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (broker_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  console.log('Database schema initialized.');
} catch (err) {
  console.error('Failed to initialize database schema:', err);
}

// Migration: Add missing columns if they don't exist
const tables = {
  leads: [
    ['min_budget', 'REAL'],
    ['max_budget', 'REAL'],
    ['property_type', 'TEXT'],
    ['required_area', 'REAL'],
    ['bhk_requirement', 'TEXT'],
    ['parking_requirement', 'TEXT'],
    ['facing_preference', 'TEXT'],
    ['construction_status', 'TEXT'],
    ['alternate_phone', 'TEXT'],
    ['email', 'TEXT'],
    ['preferred_locations', 'TEXT'],
    ['property_type_interested', 'TEXT'],
    ['required_area_value', 'REAL'],
    ['required_area_unit', 'TEXT'],
    ['road_requirement_ft', 'INTEGER'],
    ['road_requirement_custom', 'TEXT'],
    ['authority_preference', 'TEXT']
  ],
  properties: [
    ['project_id', 'INTEGER'],
    ['plot_number', 'TEXT'],
    ['plot_size', 'TEXT'],
    ['is_standalone', 'INTEGER DEFAULT 1'],
    ['approval_type', 'TEXT'],
    ['road_width_ft', 'INTEGER'],
    ['road_width_custom', 'TEXT'],
    ['map_link', 'TEXT'],
    ['corner_plot', 'INTEGER DEFAULT 0'],
    ['gated_colony', 'INTEGER DEFAULT 0'],
    ['water_supply', 'INTEGER DEFAULT 0'],
    ['electricity_available', 'INTEGER DEFAULT 0'],
    ['sewerage_connection', 'INTEGER DEFAULT 0'],
    ['property_age_years', 'REAL'],
    ['construction_status', 'TEXT']
  ]
};

Object.entries(tables).forEach(([table, columns]) => {
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    const existingColumns = tableInfo.map(c => c.name);
    
    columns.forEach(([col, type]) => {
      if (!existingColumns.includes(col)) {
        try {
          db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
          console.log(`Added column ${col} to ${table}`);
        } catch (err) {
          console.error(`Error adding column ${col} to ${table}:`, err);
        }
      }
    });
  } catch (err) {
    console.error(`Error checking table info for ${table}:`, err);
  }
});

try {
  const usersInfo = db.prepare('PRAGMA table_info(users)').all() as any[];
  const hasPhone = usersInfo.some((col) => col.name === 'phone');
  const hasActive = usersInfo.some((col) => col.name === 'active');
  if (!hasPhone) {
    db.exec('ALTER TABLE users ADD COLUMN phone TEXT');
    console.log('Added column phone to users');
  }
  if (!hasActive) {
    db.exec('ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1');
    console.log('Added column active to users');
  }
} catch (err) {
  console.error('Error ensuring users.active column:', err);
}

try {
  const usersTableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get() as { sql: string } | undefined;
  const needsRoleMigration = !!usersTableSql?.sql && !usersTableSql.sql.includes("'Super Admin'");
  if (needsRoleMigration) {
    db.exec(`
      PRAGMA foreign_keys=OFF;
      ALTER TABLE users RENAME TO users_old;
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('Super Admin', 'Admin', 'Sales')) NOT NULL DEFAULT 'Sales',
        active INTEGER DEFAULT 1,
        commission_pct REAL DEFAULT 2.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO users (id, name, email, phone, password, role, active, commission_pct, created_at)
      SELECT
        id,
        name,
        email,
        NULL,
        password,
        CASE
          WHEN role IN ('Broker', 'Salesperson') THEN 'Sales'
          WHEN role = 'Super Admin' THEN 'Super Admin'
          ELSE role
        END,
        1,
        commission_pct,
        created_at
      FROM users_old;
      DROP TABLE users_old;
      PRAGMA foreign_keys=ON;
    `);
    console.log('Migrated users role model to Super Admin/Admin/Sales');
  }
} catch (err) {
  console.error('Error migrating users role model:', err);
}

try {
  const brokenRefs = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND (sql LIKE '%users_old%' OR sql LIKE '%leads_old%')")
    .all() as Array<{ name: string }>;

  if (brokenRefs.length > 0) {
    db.exec(`
      PRAGMA foreign_keys=OFF;

      ALTER TABLE leads RENAME TO leads_old;
      CREATE TABLE leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        title TEXT NOT NULL,
        source TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'New Lead',
        assigned_to INTEGER,
        budget REAL,
        min_budget REAL,
        max_budget REAL,
        preferred_location TEXT,
        preferred_locations TEXT,
        property_type TEXT,
        property_type_interested TEXT,
        required_area REAL,
        required_area_value REAL,
        required_area_unit TEXT,
        road_requirement_ft INTEGER,
        road_requirement_custom TEXT,
        authority_preference TEXT,
        bhk_requirement TEXT,
        parking_requirement TEXT,
        facing_preference TEXT,
        construction_status TEXT,
        alternate_phone TEXT,
        email TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      );
      INSERT INTO leads (
        id, client_id, title, source, status, assigned_to, budget, min_budget, max_budget,
        preferred_location, preferred_locations, property_type, property_type_interested, required_area,
        required_area_value, required_area_unit, road_requirement_ft, road_requirement_custom, authority_preference,
        bhk_requirement, parking_requirement, facing_preference, construction_status, alternate_phone, email, notes, created_at
      )
      SELECT
        id, client_id, title, source, status, assigned_to, budget, min_budget, max_budget,
        preferred_location, preferred_locations, property_type, property_type_interested, required_area,
        required_area_value, required_area_unit, road_requirement_ft, road_requirement_custom, authority_preference,
        bhk_requirement, parking_requirement, facing_preference, construction_status, alternate_phone, email, notes, created_at
      FROM leads_old;
      DROP TABLE leads_old;

      ALTER TABLE lead_requirements RENAME TO lead_requirements_old;
      CREATE TABLE lead_requirements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL UNIQUE,
        plot_size TEXT,
        corner_plot INTEGER DEFAULT 0,
        road_width INTEGER,
        facing TEXT,
        gated_colony INTEGER DEFAULT 0,
        park_facing INTEGER DEFAULT 0,
        bhk INTEGER,
        floor_preference TEXT,
        lift_required INTEGER DEFAULT 0,
        parking INTEGER DEFAULT 0,
        furnishing TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id)
      );
      INSERT INTO lead_requirements SELECT * FROM lead_requirements_old;
      DROP TABLE lead_requirements_old;

      ALTER TABLE visits RENAME TO visits_old;
      CREATE TABLE visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        property_id INTEGER NOT NULL,
        visit_date DATETIME NOT NULL,
        feedback TEXT,
        status TEXT CHECK(status IN ('Scheduled', 'Completed', 'Cancelled')) NOT NULL DEFAULT 'Scheduled',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id),
        FOREIGN KEY (property_id) REFERENCES properties(id)
      );
      INSERT INTO visits SELECT * FROM visits_old;
      DROP TABLE visits_old;

      ALTER TABLE deals RENAME TO deals_old;
      CREATE TABLE deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        property_id INTEGER NOT NULL,
        broker_id INTEGER NOT NULL,
        final_value REAL NOT NULL,
        commission_rate REAL NOT NULL,
        commission_amount REAL NOT NULL,
        closing_date DATETIME NOT NULL,
        status TEXT CHECK(status IN ('Negotiation', 'Closed')) NOT NULL DEFAULT 'Closed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id),
        FOREIGN KEY (property_id) REFERENCES properties(id),
        FOREIGN KEY (broker_id) REFERENCES users(id)
      );
      INSERT INTO deals SELECT * FROM deals_old;
      DROP TABLE deals_old;

      ALTER TABLE notifications RENAME TO notifications_old;
      CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      INSERT INTO notifications SELECT * FROM notifications_old;
      DROP TABLE notifications_old;

      ALTER TABLE followups RENAME TO followups_old;
      CREATE TABLE followups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        followup_date DATETIME NOT NULL,
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
      INSERT INTO followups SELECT * FROM followups_old;
      DROP TABLE followups_old;

      PRAGMA foreign_keys=ON;
    `);
    console.log('Repaired broken foreign keys referencing legacy *_old tables');
  }
} catch (err) {
  console.error('Error repairing users_old foreign keys:', err);
}

try {
  db.exec(`
    UPDATE properties SET type = 'Flat' WHERE type IN ('Apartment', 'Apartment / Flat');
    UPDATE properties SET type = 'Shop' WHERE type IN ('Commercial', 'Commercial Space', 'Commercial Shop');
    UPDATE properties SET type = 'Office' WHERE type = 'Office Space';
    UPDATE leads SET property_type = 'Flat' WHERE property_type IN ('Apartment', 'Apartment / Flat');
    UPDATE leads SET property_type = 'Shop' WHERE property_type IN ('Commercial', 'Commercial Space', 'Commercial Shop');
    UPDATE leads SET property_type_interested = 'Flat' WHERE property_type_interested IN ('Apartment', 'Apartment / Flat');
    UPDATE leads SET property_type_interested = 'Shop' WHERE property_type_interested IN ('Commercial', 'Commercial Space', 'Commercial Shop');
    UPDATE leads SET status = 'New Lead' WHERE status = 'New';
    UPDATE leads
    SET preferred_locations = CASE
      WHEN preferred_location IS NOT NULL AND TRIM(preferred_location) <> ''
      THEN '[' || json_quote(TRIM(preferred_location)) || ']'
      ELSE '[]'
    END
    WHERE preferred_locations IS NULL;
  `);
} catch (err) {
  console.error('Error normalizing legacy property and lead data:', err);
}

const getCount = (table: string) => (db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number }).count;

if (getCount('users') === 0) {
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const brokerPassword = bcrypt.hashSync('broker123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Super Admin', 'superadmin@propcrm.com', adminPassword, 'Super Admin');
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Rahul Sharma', 'rahul@propcrm.com', adminPassword, 'Admin');
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Amit Singh', 'amit@propcrm.com', brokerPassword, 'Sales');
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Neha Verma', 'neha@propcrm.com', brokerPassword, 'Sales');
}

try {
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const brokerPassword = bcrypt.hashSync('broker123', 10);
  db.prepare(`
    INSERT INTO users (name, email, password, role, active)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(email) DO UPDATE SET
      name=excluded.name,
      password=excluded.password,
      role=excluded.role,
      active=1
  `).run('Super Admin', 'superadmin@propcrm.com', adminPassword, 'Super Admin');
  db.prepare(`
    INSERT INTO users (name, email, password, role, active)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(email) DO UPDATE SET
      name=excluded.name,
      password=excluded.password,
      role=excluded.role,
      active=1
  `).run('Rahul Sharma', 'rahul@propcrm.com', adminPassword, 'Admin');
  db.prepare(`
    INSERT INTO users (name, email, password, role, active)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(email) DO UPDATE SET
      name=excluded.name,
      password=excluded.password,
      role=excluded.role,
      active=1
  `).run('Amit Singh', 'amit@propcrm.com', brokerPassword, 'Sales');
  db.prepare(`
    INSERT INTO users (name, email, password, role, active)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(email) DO UPDATE SET
      name=excluded.name,
      password=excluded.password,
      role=excluded.role,
      active=1
  `).run('Neha Verma', 'neha@propcrm.com', brokerPassword, 'Sales');
  db.exec("UPDATE users SET role='Sales' WHERE role IN ('Broker', 'Salesperson');");
} catch (err) {
  console.error('Error ensuring default users:', err);
}

if (getCount('projects') === 0) {
  const insertProject = db.prepare(`
    INSERT INTO projects (name, location, total_land_area, total_plots, plot_size_options, description, amenities, status, developer_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertProject.run('Green Valley Enclave', 'Udaipur', 6.5, 180, '20*50, 30*50, 40*60', 'Plotted development near ring road', 'Road, Water, Electricity, Park', 'Open', 'GV Developers');
  insertProject.run('Sunrise Residency', 'Udaipur', 2.8, 96, '2BHK, 3BHK', 'Residential apartment block', 'Lift, Parking, Security', 'Under Construction', 'Sunrise Infra');
}

if (getCount('properties') === 0) {
  const projects = db.prepare('SELECT id, name FROM projects').all() as Array<{ id: number; name: string }>;
  const projectMap = new Map(projects.map((p) => [p.name, p.id]));
  const insertProp = db.prepare(`
    INSERT INTO properties (
      project_id, title, type, location, price, area, facing, approval_type, road_width_ft, corner_plot, gated_colony,
      status, description, images, owner_name, owner_contact, is_standalone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertProp.run(projectMap.get('Green Valley Enclave') || null, 'Green Valley Plot', 'Plot', 'Udaipur', 3500000, 1200, 'East', 'UDA', 30, 1, 1, 'Available', 'North-east corner option in gated colony', '["https://picsum.photos/seed/greenvalley/800/600"]', 'Owner Green', '9876500100', 0);
  insertProp.run(projectMap.get('Green Valley Enclave') || null, 'Lake View Plot', 'Plot', 'Udaipur', 3200000, 1000, 'North', 'SDO', 30, 0, 1, 'Available', 'Affordable plotted unit with 30ft road', '["https://picsum.photos/seed/lakeview/800/600"]', 'Owner Lake', '9876500101', 0);
  insertProp.run(projectMap.get('Sunrise Residency') || null, 'Sunrise Residency Flat', 'Flat', 'Udaipur', 5500000, 1150, 'East', 'RERA', 30, 0, 1, 'Available', '2 BHK apartment with parking', '["https://picsum.photos/seed/sunriseflat/800/600"]', 'Owner Sunrise', '9876500102', 0);
}

if (getCount('clients') === 0) {
  const insertClient = db.prepare('INSERT INTO clients (name, email, phone, type, notes) VALUES (?, ?, ?, ?, ?)');
  insertClient.run('Raj Sharma', 'raj.sharma@example.com', '9876500001', 'Buyer', 'Prefers verified plot options.');
  insertClient.run('Pooja Patel', 'pooja.patel@example.com', '9876500002', 'Buyer', 'Needs family flat in Udaipur.');
}

if (getCount('leads') === 0) {
  const raj = db.prepare('SELECT id FROM clients WHERE phone = ?').get('9876500001') as { id: number } | undefined;
  const pooja = db.prepare('SELECT id FROM clients WHERE phone = ?').get('9876500002') as { id: number } | undefined;
  const amit = db.prepare('SELECT id FROM users WHERE email = ?').get('amit@propcrm.com') as { id: number } | undefined;
  const neha = db.prepare('SELECT id FROM users WHERE email = ?').get('neha@propcrm.com') as { id: number } | undefined;

  const insertLead = db.prepare(`
    INSERT INTO leads (
      client_id, title, source, status, assigned_to, min_budget, max_budget, preferred_location,
      preferred_locations, property_type, property_type_interested, authority_preference, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  if (raj && amit) {
    insertLead.run(raj.id, 'Raj Sharma Requirement', 'Referral', 'New Lead', amit.id, 3000000, 4000000, 'Udaipur', '["Udaipur"]', 'Plot', 'Plot', 'UDA', 'Corner plot preferred with 30ft road');
  }
  if (pooja && neha) {
    insertLead.run(pooja.id, 'Pooja Patel Requirement', 'Walk-in', 'Contacted', neha.id, 5000000, 6000000, 'Udaipur', '["Udaipur"]', 'Flat', 'Flat', 'RERA', '2 BHK required with parking');
  }
}

if (getCount('lead_requirements') === 0) {
  const rajLead = db.prepare(`SELECT id FROM leads WHERE title = 'Raj Sharma Requirement' LIMIT 1`).get() as { id: number } | undefined;
  const poojaLead = db.prepare(`SELECT id FROM leads WHERE title = 'Pooja Patel Requirement' LIMIT 1`).get() as { id: number } | undefined;
  const insertRequirement = db.prepare(`
    INSERT INTO lead_requirements (
      lead_id, plot_size, corner_plot, road_width, facing, gated_colony, park_facing,
      bhk, floor_preference, lift_required, parking, furnishing
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  if (rajLead) {
    insertRequirement.run(rajLead.id, '20*50', 1, 30, 'East', 1, 0, null, null, null, null, null);
  }
  if (poojaLead) {
    insertRequirement.run(poojaLead.id, null, 0, null, null, null, null, 2, 'Mid Floor', 1, 1, 'Semi Furnished');
  }
}

if (getCount('followups') === 0) {
  const rajLead = db.prepare(`SELECT id FROM leads WHERE title = 'Raj Sharma Requirement' LIMIT 1`).get() as { id: number } | undefined;
  const poojaLead = db.prepare(`SELECT id FROM leads WHERE title = 'Pooja Patel Requirement' LIMIT 1`).get() as { id: number } | undefined;
  const amit = db.prepare('SELECT id FROM users WHERE email = ?').get('amit@propcrm.com') as { id: number } | undefined;
  const neha = db.prepare('SELECT id FROM users WHERE email = ?').get('neha@propcrm.com') as { id: number } | undefined;
  const insertFollowup = db.prepare('INSERT INTO followups (lead_id, followup_date, notes, created_by) VALUES (?, ?, ?, ?)');
  if (rajLead && amit) {
    insertFollowup.run(rajLead.id, new Date().toISOString(), 'Lead Created', amit.id);
    insertFollowup.run(rajLead.id, new Date(Date.now() + 86400000).toISOString(), 'Agent Called and follow-up scheduled', amit.id);
  }
  if (poojaLead && neha) {
    insertFollowup.run(poojaLead.id, new Date().toISOString(), 'Customer requirement reviewed', neha.id);
  }
}

if (getCount('visits') === 0) {
  const rajLead = db.prepare(`SELECT id FROM leads WHERE title = 'Raj Sharma Requirement' LIMIT 1`).get() as { id: number } | undefined;
  const poojaLead = db.prepare(`SELECT id FROM leads WHERE title = 'Pooja Patel Requirement' LIMIT 1`).get() as { id: number } | undefined;
  const greenPlot = db.prepare(`SELECT id FROM properties WHERE title = 'Green Valley Plot' LIMIT 1`).get() as { id: number } | undefined;
  const sunriseFlat = db.prepare(`SELECT id FROM properties WHERE title = 'Sunrise Residency Flat' LIMIT 1`).get() as { id: number } | undefined;
  const insertVisit = db.prepare('INSERT INTO visits (lead_id, property_id, visit_date, feedback, status) VALUES (?, ?, ?, ?, ?)');
  if (rajLead && greenPlot) {
    insertVisit.run(rajLead.id, greenPlot.id, new Date(Date.now() + 2 * 86400000).toISOString(), 'Site visit planned for weekend', 'Scheduled');
  }
  if (poojaLead && sunriseFlat) {
    insertVisit.run(poojaLead.id, sunriseFlat.id, new Date(Date.now() + 3 * 86400000).toISOString(), 'Family requested layout review', 'Scheduled');
  }
}

if (getCount('deals') === 0) {
  const poojaLead = db.prepare(`SELECT id FROM leads WHERE title = 'Pooja Patel Requirement' LIMIT 1`).get() as { id: number } | undefined;
  const sunriseFlat = db.prepare(`SELECT id FROM properties WHERE title = 'Sunrise Residency Flat' LIMIT 1`).get() as { id: number } | undefined;
  const amit = db.prepare('SELECT id FROM users WHERE email = ?').get('amit@propcrm.com') as { id: number } | undefined;
  if (poojaLead && sunriseFlat && amit) {
    const finalValue = 5450000;
    const commissionRate = 2;
    db.prepare(`
      INSERT INTO deals (
        lead_id, property_id, broker_id, final_value, commission_rate, commission_amount, closing_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      poojaLead.id,
      sunriseFlat.id,
      amit.id,
      finalValue,
      commissionRate,
      (finalValue * commissionRate) / 100,
      new Date().toISOString(),
      'Negotiation'
    );
  }
}

export default db;
