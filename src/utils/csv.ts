import Papa from "papaparse";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { CsvPreviewRow, Transaction, TransactionInput } from "@/types";
import { formatSignedAmount } from "@/utils/format";

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
  "raw_text"
];

export function parseCsv(content: string) {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (result.errors.length > 0) {
    throw new Error(result.errors.map((error) => error.message).join("; "));
  }

  return result.data;
}

export function rowToTransactionInput(row: Record<string, unknown>): TransactionInput {
  return {
    date: String(row.date ?? ""),
    time: String(row.time ?? ""),
    type: String(row.type ?? "") as TransactionInput["type"],
    amount: String(row.amount ?? ""),
    currency: String(row.currency ?? ""),
    category: String(row.category ?? ""),
    merchant: String(row.merchant ?? ""),
    paymentMethod: String(row.payment_method ?? row.paymentMethod ?? ""),
    account: String(row.account ?? ""),
    note: String(row.note ?? ""),
    tags: String(row.tags ?? ""),
    source: String(row.source ?? "csv"),
    rawText: String(row.raw_text ?? row.rawText ?? "")
  };
}

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
    transaction.rawText ?? ""
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
