import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.resolve('data.db'));
const tables = ['users', 'projects', 'properties', 'clients', 'leads'];

console.log('--- Database Verification ---');
tables.forEach(table => {
  try {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
    console.log(`Table "${table}": ${count.count} rows`);
    if (count.count > 0) {
        const first = db.prepare(`SELECT * FROM ${table} LIMIT 1`).get();
        console.log(`  Sample data from ${table}:`, JSON.stringify(first).substring(0, 100) + '...');
    }
  } catch (e) {
    console.log(`Table "${table}": Error - ${e.message}`);
  }
});
db.close();
