import * as SQLite from 'expo-sqlite';

export interface LUT {
  id: number;
  name: string;
  path: string;
  imagePath: string; // Path to pre-converted LUT image
  size: number;
  domainMin: string; // JSON stringified array
  domainMax: string; // JSON stringified array
  createdAt: string;
}

export interface EditedPhoto {
  id: number;
  name: string;
  photoUri: string;
  thumbnailUri: string;
  lutId: number;
  lutName?: string; // Joined from LUTs table
  strength: number;
  exposure: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  isExported: number; // SQLite boolean (0 or 1)
  createdAt: string;
  updatedAt: string;
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
        imagePath TEXT NOT NULL DEFAULT '',
        size INTEGER NOT NULL,
        domainMin TEXT NOT NULL,
        domainMax TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);
    
    // Migration: Add imagePath column if it doesn't exist
    try {
      await db.execAsync(`
        ALTER TABLE LUTs ADD COLUMN imagePath TEXT NOT NULL DEFAULT '';
      `);
    } catch (error) {
      // Column might already exist, ignore error
    }
    
    // Create Settings table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    
    // Create EditedPhotos table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS EditedPhotos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        photoUri TEXT NOT NULL,
        thumbnailUri TEXT NOT NULL,
        lutId INTEGER NOT NULL,
        strength REAL NOT NULL,
        exposure REAL NOT NULL,
        contrast REAL NOT NULL,
        saturation REAL NOT NULL,
        temperature REAL NOT NULL,
        tint REAL NOT NULL,
        isExported INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (lutId) REFERENCES LUTs(id) ON DELETE CASCADE
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
  imagePath: string,
  size: number,
  domainMin: [number, number, number],
  domainMax: [number, number, number]
): Promise<number> {
  if (!db) throw new Error('Database not initialized');
  
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO LUTs (name, path, imagePath, size, domainMin, domainMax, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, path, imagePath, size, JSON.stringify(domainMin), JSON.stringify(domainMax), createdAt]
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

export async function updateLUTImagePath(id: number, imagePath: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  await db.runAsync('UPDATE LUTs SET imagePath = ? WHERE id = ?', [imagePath, id]);
}

export async function updateLUTName(id: number, name: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  await db.runAsync('UPDATE LUTs SET name = ? WHERE id = ?', [name, id]);
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

// EditedPhotos CRUD operations
export async function insertEditedPhoto(
  name: string,
  photoUri: string,
  thumbnailUri: string,
  lutId: number,
  strength: number,
  exposure: number,
  contrast: number,
  saturation: number,
  temperature: number,
  tint: number
): Promise<number> {
  if (!db) throw new Error('Database not initialized');
  
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO EditedPhotos 
    (name, photoUri, thumbnailUri, lutId, strength, exposure, contrast, saturation, temperature, tint, isExported, createdAt, updatedAt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [name, photoUri, thumbnailUri, lutId, strength, exposure, contrast, saturation, temperature, tint, now, now]
  );
  
  return result.lastInsertRowId;
}

export async function getAllEditedPhotos(): Promise<EditedPhoto[]> {
  if (!db) throw new Error('Database not initialized');
  
  const result = await db.getAllAsync<EditedPhoto>(`
    SELECT 
      ep.*,
      l.name as lutName
    FROM EditedPhotos ep
    LEFT JOIN LUTs l ON ep.lutId = l.id
    ORDER BY ep.updatedAt DESC
  `);
  return result;
}

export async function getEditedPhotoById(id: number): Promise<EditedPhoto | null> {
  if (!db) throw new Error('Database not initialized');
  
  const result = await db.getFirstAsync<EditedPhoto>(`
    SELECT 
      ep.*,
      l.name as lutName
    FROM EditedPhotos ep
    LEFT JOIN LUTs l ON ep.lutId = l.id
    WHERE ep.id = ?
  `, [id]);
  return result || null;
}

export async function updateEditedPhoto(
  id: number,
  name: string,
  strength: number,
  exposure: number,
  contrast: number,
  saturation: number,
  temperature: number,
  tint: number
): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  const updatedAt = new Date().toISOString();
  await db.runAsync(
    `UPDATE EditedPhotos 
    SET name = ?, strength = ?, exposure = ?, contrast = ?, saturation = ?, temperature = ?, tint = ?, updatedAt = ?
    WHERE id = ?`,
    [name, strength, exposure, contrast, saturation, temperature, tint, updatedAt, id]
  );
}

export async function updateThumbnailUri(id: number, thumbnailUri: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  const updatedAt = new Date().toISOString();
  await db.runAsync(
    'UPDATE EditedPhotos SET thumbnailUri = ?, updatedAt = ? WHERE id = ?',
    [thumbnailUri, updatedAt, id]
  );
}

export async function markAsExported(id: number): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  const updatedAt = new Date().toISOString();
  await db.runAsync(
    'UPDATE EditedPhotos SET isExported = 1, updatedAt = ? WHERE id = ?',
    [updatedAt, id]
  );
}

export async function deleteEditedPhoto(id: number): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  await db.runAsync('DELETE FROM EditedPhotos WHERE id = ?', [id]);
}


