import type { Category } from "@/types";
import { getDatabase } from "@/db/database";
import { createId, nowIso } from "@/utils/format";

export async function getCategories(type?: "expense" | "income") {
  const db = await getDatabase();
  if (type) {
    return db.getAllAsync<Category>("SELECT * FROM categories WHERE type = ? ORDER BY createdAt ASC", type);
  }

  return db.getAllAsync<Category>("SELECT * FROM categories ORDER BY type ASC, createdAt ASC");
}

export async function addCategory(input: { name: string; type: "expense" | "income"; color: string; icon: string }) {
  const db = await getDatabase();
  const category: Category = {
    id: createId("cat"),
    name: input.name.trim(),
    type: input.type,
    color: input.color,
    icon: input.icon,
    createdAt: nowIso()
  };

  await db.runAsync(
    "INSERT INTO categories (id, name, type, color, icon, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    category.id,
    category.name,
    category.type,
    category.color,
    category.icon,
    category.createdAt
  );

  return category;
}

export async function updateCategory(category: Category) {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE categories SET name = ?, type = ?, color = ?, icon = ? WHERE id = ?",
    category.name,
    category.type,
    category.color,
    category.icon,
    category.id
  );
}

export async function deleteCategory(id: string) {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM categories WHERE id = ?", id);
}
