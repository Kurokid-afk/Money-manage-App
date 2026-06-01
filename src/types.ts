export type TransactionType = "expense" | "income" | "transfer" | "refund";

export type Transaction = {
  id: string;
  date: string;
  time: string | null;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string | null;
  merchant: string | null;
  paymentMethod: string | null;
  account: string | null;
  note: string | null;
  tags: string | null;
  source: string | null;
  rawText: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TransactionInput = {
  id?: string;
  date: string;
  time?: string | null;
  type: TransactionType;
  amount: number | string;
  currency?: string | null;
  category?: string | null;
  merchant?: string | null;
  paymentMethod?: string | null;
  account?: string | null;
  note?: string | null;
  tags?: string | null;
  source?: string | null;
  rawText?: string | null;
};

export type Category = {
  id: string;
  name: string;
  type: "expense" | "income";
  color: string | null;
  icon: string | null;
  createdAt: string;
};

export type Settings = {
  id: string;
  defaultCurrency: string;
  defaultPaymentMethod: string;
  autoCategoryEnabled: number;
  duplicateCheckEnabled: number;
  createdAt: string;
  updatedAt: string;
};

export type ImportBatch = {
  id: string;
  fileName: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errorRows: number;
  createdAt: string;
};

export type TransactionFilters = {
  month?: string;
  type?: TransactionType | "all";
  category?: string | "all";
  keyword?: string;
};

export type CsvPreviewStatus = "ok" | "duplicate" | "suspected" | "error";

export type CsvPreviewRow = {
  rowId: number;
  status: CsvPreviewStatus;
  reason: string;
  selected: boolean;
  data: TransactionInput;
};

export type CsvImportResult = {
  importedRows: number;
  skippedRows: number;
  errorRows: number;
  suspectedRows: number;
};
