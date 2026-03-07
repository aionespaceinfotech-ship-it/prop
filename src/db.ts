import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
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
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('Admin', 'Broker')) NOT NULL DEFAULT 'Broker',
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

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      price REAL NOT NULL,
      area REAL NOT NULL,
      facing TEXT,
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
      status TEXT NOT NULL DEFAULT 'New',
      assigned_to INTEGER,
      budget REAL,
      min_budget REAL,
      max_budget REAL,
      preferred_location TEXT,
      property_type TEXT,
      required_area REAL,
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
    ['email', 'TEXT']
  ],
  properties: [
    ['project_id', 'INTEGER'],
    ['plot_number', 'TEXT'],
    ['is_standalone', 'INTEGER DEFAULT 1']
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

// Seed initial data if users table is empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const brokerPassword = bcrypt.hashSync('broker123', 10);

  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Admin User', 'admin@propcrm.com', adminPassword, 'Admin'
  );
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'John Broker', 'john@propcrm.com', brokerPassword, 'Broker'
  );

  // Seed Properties
  const properties = [
    ['Luxury 3BHK Apartment', 'Apartment', 'Downtown, City Center', 12000000, 1800, 'Available', 'Spacious 3BHK with modern amenities.', '["https://picsum.photos/seed/prop1/800/600"]', 'Robert Smith', '9876543210'],
    ['Modern Office Space', 'Commercial', 'Business District', 25000000, 3500, 'Available', 'Prime location office space.', '["https://picsum.photos/seed/prop2/800/600"]', 'Alice Jones', '9876543211'],
    ['Green Valley Plot', 'Plot', 'Suburbs', 4500000, 2400, 'Available', 'Residential plot in a quiet area.', '["https://picsum.photos/seed/prop3/800/600"]', 'Michael Brown', '9876543212'],
    ['Seaside Villa', 'Villa', 'Coastal Road', 45000000, 5000, 'Available', 'Beautiful villa with ocean view.', '["https://picsum.photos/seed/prop4/800/600"]', 'Sarah Wilson', '9876543213']
  ];

  const insertProp = db.prepare('INSERT INTO properties (title, type, location, price, area, status, description, images, owner_name, owner_contact) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  properties.forEach(p => insertProp.run(...p));

  // Seed Clients
  const clients = [
    ['David Miller', 'david@example.com', '9876543214', 'Buyer', 'Looking for a villa.'],
    ['Emma Garcia', 'emma@example.com', '9876543215', 'Seller', 'Wants to sell her apartment.'],
    ['James Taylor', 'james@example.com', '9876543216', 'Buyer', 'Interested in commercial plots.']
  ];
  const insertClient = db.prepare('INSERT INTO clients (name, email, phone, type, notes) VALUES (?, ?, ?, ?, ?)');
  clients.forEach(c => insertClient.run(...c));

  // Seed Leads
  const leads = [
    [1, 'Villa Inquiry', 'Website', 'New', 2, 50000000, 'Coastal', 'High priority buyer.'],
    [3, 'Plot Interest', 'Call', 'Contacted', 2, 5000000, 'Suburbs', 'Needs immediate follow-up.']
  ];
  const insertLead = db.prepare('INSERT INTO leads (client_id, title, source, status, assigned_to, budget, preferred_location, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  leads.forEach(l => insertLead.run(...l));
}

export default db;
