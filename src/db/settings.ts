import type { Settings } from "@/types";
import { getDatabase } from "@/db/database";
import { createId, nowIso } from "@/utils/format";

export async function getSettings() {
  const db = await getDatabase();
  let settings = await db.getFirstAsync<Settings>("SELECT * FROM settings ORDER BY createdAt ASC LIMIT 1");

  if (!settings) {
    const timestamp = nowIso();
    settings = {
      id: createId("settings"),
      defaultCurrency: "CNY",
      defaultPaymentMethod: "银行卡",
      autoCategoryEnabled: 1,
      duplicateCheckEnabled: 1,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await db.runAsync(
      `INSERT INTO settings
        (id, defaultCurrency, defaultPaymentMethod, autoCategoryEnabled, duplicateCheckEnabled, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      settings.id,
      settings.defaultCurrency,
      settings.defaultPaymentMethod,
      settings.autoCategoryEnabled,
      settings.duplicateCheckEnabled,
      settings.createdAt,
      settings.updatedAt
    );
  }

  return settings;
}

export async function updateSettings(input: Partial<Settings>) {
  const db = await getDatabase();
  const current = await getSettings();
  const next: Settings = {
    ...current,
    ...input,
    updatedAt: nowIso()
  };

  await db.runAsync(
    `UPDATE settings
     SET defaultCurrency = ?, defaultPaymentMethod = ?, autoCategoryEnabled = ?, duplicateCheckEnabled = ?, updatedAt = ?
     WHERE id = ?`,
    next.defaultCurrency,
    next.defaultPaymentMethod,
    next.autoCategoryEnabled,
    next.duplicateCheckEnabled,
    next.updatedAt,
    next.id
  );

  return next;
}
