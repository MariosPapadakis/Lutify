import * as SQLite from 'expo-sqlite';

export interface LUT {
  id: number;
  name: string;
  path: string;
  size: number;
  domainMin: string; // JSON stringified array
  domainMax: string; // JSON stringified array
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string;
}

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  try {
    db = await SQLite.openDatabaseAsync('lutify.db');
    
    // Create LUTs table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS LUTs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        size INTEGER NOT NULL,
        domainMin TEXT NOT NULL,
        domainMax TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);
    
    // Create Settings table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export async function insertLUT(
  name: string,
  path: string,
  size: number,
  domainMin: [number, number, number],
  domainMax: [number, number, number]
): Promise<number> {
  if (!db) throw new Error('Database not initialized');
  
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO LUTs (name, path, size, domainMin, domainMax, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    [name, path, size, JSON.stringify(domainMin), JSON.stringify(domainMax), createdAt]
  );
  
  return result.lastInsertRowId;
}

export async function getAllLUTs(): Promise<LUT[]> {
  if (!db) throw new Error('Database not initialized');
  
  const result = await db.getAllAsync<LUT>('SELECT * FROM LUTs ORDER BY createdAt DESC');
  return result;
}

export async function getLUTById(id: number): Promise<LUT | null> {
  if (!db) throw new Error('Database not initialized');
  
  const result = await db.getFirstAsync<LUT>('SELECT * FROM LUTs WHERE id = ?', [id]);
  return result || null;
}

export async function deleteLUT(id: number): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  await db.runAsync('DELETE FROM LUTs WHERE id = ?', [id]);
}

export async function getSetting(key: string): Promise<string | null> {
  if (!db) throw new Error('Database not initialized');
  
  const result = await db.getFirstAsync<Setting>('SELECT value FROM Settings WHERE key = ?', [key]);
  return result?.value || null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  await db.runAsync(
    'INSERT OR REPLACE INTO Settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}


