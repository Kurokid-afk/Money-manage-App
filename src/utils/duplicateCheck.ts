import type { Transaction, TransactionInput } from "@/types";
import { normalizeTime } from "@/utils/format";

type Candidate = Pick<Transaction, "id" | "date" | "time" | "type" | "amount" | "merchant" | "paymentMethod"> | TransactionInput;

function clean(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function amountText(value: number | string) {
  return Number(value).toFixed(2);
}

function timeMinutes(value?: string | null) {
  const time = normalizeTime(value);
  if (!time) {
    return null;
  }

  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

export function fullDuplicateKey(transaction: Candidate) {
  const date = transaction.date;
  const type = transaction.type;
  const amount = amountText(transaction.amount);
  const merchant = clean(transaction.merchant || "未知商家");
  const time = normalizeTime(transaction.time);

  if (!time) {
    return [date, amount, merchant, type].join("|");
  }

  return [date, time, amount, merchant, type, clean(transaction.paymentMethod)].join("|");
}

export function isExactDuplicate(a: Candidate, b: Candidate) {
  return fullDuplicateKey(a) === fullDuplicateKey(b);
}

export function isSuspectedDuplicate(a: Candidate, b: Candidate) {
  if (a.date !== b.date) {
    return false;
  }

  if (amountText(a.amount) !== amountText(b.amount)) {
    return false;
  }

  if (a.type !== b.type) {
    return false;
  }

  if (clean(a.merchant || "未知商家") !== clean(b.merchant || "未知商家")) {
    return false;
  }

  const aMinutes = timeMinutes(a.time);
  const bMinutes = timeMinutes(b.time);
  if (aMinutes === null || bMinutes === null) {
    return false;
  }

  const diff = Math.abs(aMinutes - bMinutes);
  return diff > 0 && diff <= 5;
}

export function detectDuplicate(
  transaction: TransactionInput,
  existing: Candidate[],
  acceptedRows: Candidate[]
): { status: "ok" | "duplicate" | "suspected"; reason: string } {
  if (existing.some((candidate) => isExactDuplicate(transaction, candidate))) {
    return { status: "duplicate", reason: "与已有交易完全重复" };
  }

  if (acceptedRows.some((candidate) => isExactDuplicate(transaction, candidate))) {
    return { status: "duplicate", reason: "与本次 CSV 中的交易完全重复" };
  }

  if (existing.some((candidate) => isSuspectedDuplicate(transaction, candidate))) {
    return { status: "suspected", reason: "与已有交易疑似重复" };
  }

  if (acceptedRows.some((candidate) => isSuspectedDuplicate(transaction, candidate))) {
    return { status: "suspected", reason: "与本次 CSV 中的交易疑似重复" };
  }

  return { status: "ok", reason: "" };
}
