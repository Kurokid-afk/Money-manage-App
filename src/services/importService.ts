import type { CsvImportOptions, CsvImportResult, CsvPreviewRow, TransactionInput } from "@/types";
import { addImportBatch } from "@/db/importBatches";
import { getSettings } from "@/db/settings";
import { createTransactions, getDuplicateCandidates } from "@/db/transactions";
import { detectDuplicate } from "@/utils/duplicateCheck";
import { parseCsv, rowToTransactionInput } from "@/utils/csv";
import { normalizeTransactionInput } from "@/utils/transaction";

function applyImportOptions(input: TransactionInput, options: CsvImportOptions): TransactionInput {
  const type = input.type;
  const isFlow = type === "transfer" || type === "investment";
  const countInExpense = isFlow && options.transferExcludedFromExpense !== false ? false : input.countInExpense;

  return {
    ...input,
    countInExpense,
    category:
      options.fundSeparateStats && type === "investment"
        ? "投资理财"
        : type === "transfer"
          ? input.category || "账户转移"
          : input.category
  };
}

export async function buildCsvPreview(fileName: string, content: string, options: CsvImportOptions = {}) {
  const rows = parseCsv(content);
  const settings = await getSettings();
  const duplicateCheckEnabled = options.duplicateCheckEnabled ?? settings.duplicateCheckEnabled === 1;
  const autoCategoryEnabled = options.autoCategoryEnabled ?? settings.autoCategoryEnabled === 1;
  const existing = duplicateCheckEnabled ? await getDuplicateCandidates() : [];
  const acceptedRows: TransactionInput[] = [];

  const previewRows: CsvPreviewRow[] = rows.map((row, index) => {
    try {
      const input = rowToTransactionInput(row);
      if (options.onlyCny && input.currency && input.currency !== "CNY") {
        return {
          rowId: index + 1,
          status: "duplicate" as const,
          reason: "非 CNY 记录，已按设置跳过",
          selected: false,
          data: input
        };
      }

      const normalized = normalizeTransactionInput(applyImportOptions(input, options), {
        autoCategoryEnabled
      });
      const data: TransactionInput = {
        ...normalized,
        amount: normalized.amount,
        source: normalized.source || "csv"
      };
      const duplicate = duplicateCheckEnabled ? detectDuplicate(data, existing, acceptedRows) : { status: "ok" as const, reason: "" };

      if (duplicate.status !== "duplicate") {
        acceptedRows.push(data);
      }

      return {
        rowId: index + 1,
        status: duplicate.status,
        reason: duplicate.reason,
        selected: duplicate.status === "ok",
        data
      };
    } catch (error) {
      return {
        rowId: index + 1,
        status: "error",
        reason: error instanceof Error ? error.message : "无法解析该行",
        selected: false,
        data: rowToTransactionInput(row)
      };
    }
  });

  return {
    fileName,
    rows: previewRows
  };
}

export async function confirmCsvImport(fileName: string, rows: CsvPreviewRow[], options: CsvImportOptions = {}): Promise<CsvImportResult> {
  const settings = await getSettings();
  const autoCategoryEnabled = options.autoCategoryEnabled ?? settings.autoCategoryEnabled === 1;
  const duplicateCheckEnabled = options.duplicateCheckEnabled ?? settings.duplicateCheckEnabled === 1;
  const existing = duplicateCheckEnabled ? await getDuplicateCandidates() : [];
  const acceptedRows: TransactionInput[] = [];
  const toCreate: TransactionInput[] = [];
  let skippedRows = 0;
  let errorRows = 0;
  let suspectedRows = 0;

  for (const row of rows) {
    if (row.status === "error") {
      errorRows += 1;
      continue;
    }

    if (row.status === "duplicate") {
      skippedRows += 1;
      continue;
    }

    if (row.status === "suspected") {
      suspectedRows += 1;
    }

    if (!row.selected && row.status === "suspected") {
      skippedRows += 1;
      continue;
    }

    try {
      if (options.onlyCny && row.data.currency && row.data.currency !== "CNY") {
        skippedRows += 1;
        continue;
      }

      const normalized = normalizeTransactionInput(applyImportOptions(row.data, options), {
        autoCategoryEnabled
      });
      const data: TransactionInput = {
        ...normalized,
        source: normalized.source || "csv"
      };

      if (duplicateCheckEnabled) {
        const duplicate = detectDuplicate(data, existing, acceptedRows);
        if (duplicate.status === "duplicate") {
          skippedRows += 1;
          continue;
        }
      }

      acceptedRows.push(data);
      toCreate.push(data);
    } catch {
      errorRows += 1;
    }
  }

  await createTransactions(toCreate, {
    autoCategoryEnabled
  });

  await addImportBatch({
    fileName,
    totalRows: rows.length,
    importedRows: toCreate.length,
    skippedRows,
    errorRows
  });

  return {
    importedRows: toCreate.length,
    skippedRows,
    errorRows,
    suspectedRows
  };
}
