import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { CsvPreviewRow, Transaction, TransactionInput } from "@/types";
import { formatSignedAmount } from "@/utils/format";
export { parseCsv, rowToTransactionInput } from "@/utils/csvFallback";

export const csvHeaders = [
  "date",
  "time",
  "type",
  "amount",
  "currency",
  "category",
  "merchant",
  "payment_method",
  "account",
  "note",
  "tags",
  "source",
  "raw_text",
  "count_in_expense"
];

function escapeCell(value: unknown) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function transactionsToCsv(transactions: Transaction[]) {
  const rows = transactions.map((transaction) => [
    transaction.date,
    transaction.time ?? "",
    transaction.type,
    transaction.amount.toFixed(2),
    transaction.currency,
    transaction.category ?? "",
    transaction.merchant ?? "",
    transaction.paymentMethod ?? "",
    transaction.account ?? "",
    transaction.note ?? "",
    transaction.tags ?? "",
    transaction.source ?? "",
    transaction.rawText ?? "",
    transaction.countInExpense === true || transaction.countInExpense === 1 ? "true" : "false"
  ]);

  return [csvHeaders, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");
}

export async function exportCsvFile(fileName: string, transactions: Transaction[]) {
  const csv = transactionsToCsv(transactions);
  const file = new File(Paths.document, fileName);
  file.create({
    intermediates: true,
    overwrite: true
  });
  file.write(csv);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: "导出 MoneyTrack CSV"
    });
  }

  return file.uri;
}

export function previewSummary(rows: CsvPreviewRow[]) {
  return {
    totalRows: rows.length,
    importableRows: rows.filter((row) => row.status === "ok").length,
    duplicateRows: rows.filter((row) => row.status === "duplicate").length,
    suspectedRows: rows.filter((row) => row.status === "suspected").length,
    errorRows: rows.filter((row) => row.status === "error").length
  };
}

export function amountPreview(transaction: TransactionInput) {
  return formatSignedAmount(Number(transaction.amount || 0), transaction.type, transaction.currency ?? "CNY");
}
