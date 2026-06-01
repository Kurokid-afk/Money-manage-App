import { getDatabase } from "@/db/database";
import { createId, nowIso } from "@/utils/format";

export async function addImportBatch(input: {
  fileName: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errorRows: number;
}) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO import_batches
      (id, fileName, totalRows, importedRows, skippedRows, errorRows, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    createId("import"),
    input.fileName,
    input.totalRows,
    input.importedRows,
    input.skippedRows,
    input.errorRows,
    nowIso()
  );
}
