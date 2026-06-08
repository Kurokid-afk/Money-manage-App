import type { TransactionInput, TransactionType } from "@/types";
import { autoCategorize } from "@/utils/categoryRules";
import { normalizeDate, normalizeTime, parsePositiveAmount, safeText, transactionTypes } from "@/utils/format";

function defaultCountInExpense(type: TransactionType) {
  return type === "expense" || type === "fee";
}

function normalizeBooleanFlag(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const text = value.trim().toLowerCase();
    if (["1", "true", "yes", "y"].includes(text)) {
      return true;
    }

    if (["0", "false", "no", "n"].includes(text)) {
      return false;
    }
  }

  return fallback;
}

export function normalizeTransactionInput(input: TransactionInput, options: { autoCategoryEnabled?: boolean } = {}) {
  const type = safeText(input.type) as TransactionType;
  if (!transactionTypes.includes(type)) {
    throw new Error("type 必须是 expense / income / transfer / refund");
  }

  const amount = parsePositiveAmount(input.amount);
  if (amount === null) {
    throw new Error("amount 必须是大于 0 的数字");
  }

  const date = normalizeDate(input.date);
  if (!date) {
    throw new Error("date 必填，格式应为 YYYY-MM-DD");
  }

  const merchant = safeText(input.merchant, "未知商家");
  const rawText = safeText(input.rawText);
  const note = safeText(input.note);
  const shouldAutoCategory = options.autoCategoryEnabled ?? true;
  const category =
    safeText(input.category) ||
    (type === "income" || type === "refund"
      ? "其他收入"
      : type === "investment"
        ? "投资理财"
        : shouldAutoCategory
          ? autoCategorize({ merchant, note, rawText })
          : "其他");
  const countInExpense = normalizeBooleanFlag(input.countInExpense, defaultCountInExpense(type));

  return {
    id: input.id,
    date,
    time: normalizeTime(input.time),
    type,
    amount,
    currency: safeText(input.currency, "CNY").toUpperCase(),
    category,
    merchant,
    paymentMethod: safeText(input.paymentMethod) || null,
    account: safeText(input.account) || null,
    note: note || null,
    tags: safeText(input.tags) || null,
    source: safeText(input.source, "manual"),
    rawText: rawText || null,
    countInExpense
  };
}
