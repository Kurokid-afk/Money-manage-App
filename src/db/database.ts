import * as SQLite from "expo-sqlite";
import { categoryRowsForSeed } from "@/utils/categoryRules";
import { createId, nowIso } from "@/utils/format";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync("moneytrack.db");
  }

  return databasePromise;
}

export async function initializeDatabase() {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      time TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'CNY',
      category TEXT,
      merchant TEXT,
      paymentMethod TEXT,
      account TEXT,
      note TEXT,
      tags TEXT,
      source TEXT,
      rawText TEXT,
      count_in_expense INTEGER DEFAULT 1,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant);

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      color TEXT,
      icon TEXT,
      createdAt TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_type ON categories(name, type);

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      defaultCurrency TEXT,
      defaultPaymentMethod TEXT,
      autoCategoryEnabled INTEGER,
      duplicateCheckEnabled INTEGER,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS import_batches (
      id TEXT PRIMARY KEY,
      fileName TEXT,
      totalRows INTEGER,
      importedRows INTEGER,
      skippedRows INTEGER,
      errorRows INTEGER,
      createdAt TEXT
    );
  `);

  try {
    await db.execAsync("ALTER TABLE transactions ADD COLUMN count_in_expense INTEGER DEFAULT 1;");
  } catch {
    // Column already exists in upgraded databases.
  }

  await db.execAsync(`
    UPDATE transactions
    SET count_in_expense = CASE
      WHEN type IN ('transfer', 'investment', 'refund') THEN 0
      ELSE 1
    END
    WHERE count_in_expense IS NULL;
  `);

  for (const category of categoryRowsForSeed()) {
    await db.runAsync(
      "INSERT OR IGNORE INTO categories (id, name, type, color, icon, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      category.id,
      category.name,
      category.type,
      category.color,
      category.icon,
      category.createdAt
    );
  }

  const settingsCount = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM settings");
  if (!settingsCount?.count) {
    const timestamp = nowIso();
    await db.runAsync(
      `INSERT INTO settings
        (id, defaultCurrency, defaultPaymentMethod, autoCategoryEnabled, duplicateCheckEnabled, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      createId("settings"),
      "CNY",
      "银行卡",
      1,
      1,
      timestamp,
      timestamp
    );
  }
}

export async function resetDatabaseData() {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM transactions;
    DELETE FROM import_batches;
  `);
}
