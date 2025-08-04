import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import logger from '../config/logger';

let db: any = null;

export async function initDatabase() {
  try {
    // Criar diretÃ³rio data se nÃ£o existir
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = process.env['DATABASE_URL'] || './data/database.sqlite';

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await createTables();
    logger.info('Banco de dados inicializado com sucesso');

    return db;
  } catch (error) {
    logger.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

async function createTables() {
  // Tabela de usuÃ¡rios
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT DEFAULT '',
      name TEXT NOT NULL,
      provider TEXT DEFAULT 'local',
      provider_id TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de instÃ¢ncias do WhatsApp
  await db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_instances (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'disconnected',
      qr_code TEXT,
      phone_number TEXT,
      session_data TEXT,
      webhook_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Tabela de mensagens
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instance_id TEXT NOT NULL,
      message_id TEXT,
      from_number TEXT NOT NULL,
      to_number TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      content TEXT NOT NULL,
      media_url TEXT,
      status TEXT DEFAULT 'pending',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      webhook_delivered BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (instance_id) REFERENCES whatsapp_instances (id) ON DELETE CASCADE
    )
  `);

  // Tabela de contatos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instance_id TEXT NOT NULL,
      number TEXT NOT NULL,
      name TEXT,
      profile_pic_url TEXT,
      is_group BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (instance_id) REFERENCES whatsapp_instances (id) ON DELETE CASCADE,
      UNIQUE(instance_id, number)
    )
  `);

  // Tabela de logs de atividades
  await db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      instance_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
      FOREIGN KEY (instance_id) REFERENCES whatsapp_instances (id) ON DELETE SET NULL
    )
  `);
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export default {
  init: initDatabase,
  get: getDatabase,
};
