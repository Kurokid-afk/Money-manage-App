import type { TransactionType } from "@/types";

export const transactionTypes: TransactionType[] = ["expense", "income", "transfer", "investment", "refund", "fee"];

export const typeLabels: Record<TransactionType, string> = {
  expense: "支出",
  income: "收入",
  transfer: "转账",
  investment: "投资",
  refund: "退款",
  fee: "手续费"
};

export const currencySymbols: Record<string, string> = {
  CNY: "¥",
  AUD: "A$",
  USD: "$"
};

export function createId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function todayText() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function currentTimeText() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function currentMonthText() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string) {
  const [year, monthNumber] = month.split("-");
  return `${year}年${Number(monthNumber)}月`;
}

export function daysInMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

export function normalizeDate(value: string) {
  const text = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

export function normalizeTime(value?: string | null) {
  const text = String(value ?? "").trim();
  if (!text) {
    return null;
  }

  const match = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) {
    return text;
  }

  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function formatCurrency(amount: number, currency = "CNY") {
  const symbol = currencySymbols[currency] ?? `${currency} `;
  return `${symbol}${Math.abs(amount).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function formatSignedAmount(amount: number, type: string, currency = "CNY") {
  const formatted = formatCurrency(amount, currency);
  if (type === "expense" || type === "fee") {
    return `-${formatted}`;
  }

  if (type === "income" || type === "refund") {
    return `+${formatted}`;
  }

  if (type === "transfer" || type === "investment") {
    return `↔${formatted}`;
  }

  return formatted;
}

export function amountColor(type: string) {
  if (type === "expense" || type === "fee") {
    return "#dc2626";
  }

  if (type === "income" || type === "refund") {
    return "#16a34a";
  }

  if (type === "transfer" || type === "investment") {
    return "#2563eb";
  }

  return "#334155";
}

export function safeText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text.length ? text : fallback;
}

export function parsePositiveAmount(value: unknown) {
  const amount = Number(String(value ?? "").replace(/,/g, "").trim());
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Number(amount.toFixed(2));
}
