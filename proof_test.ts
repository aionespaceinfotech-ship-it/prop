import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.resolve('data.db'));

const proofTitle = "PROOF_OF_DATABASE_CONNECTION_" + Date.now();

console.log(`Inserting proof property: ${proofTitle}`);

db.prepare('INSERT INTO properties (title, type, location, price, area, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
  proofTitle, 
  'Apartment', 
  'Database Proof City', 
  999999, 
  100, 
  'Available', 
  'This property was inserted directly into data.db via a script.'
);

const result = db.prepare('SELECT * FROM properties WHERE title = ?').get(proofTitle);
console.log('Verification from DB file:', result);

db.close();
