import type { TransactionInput, TransactionType } from "@/types";
import { autoCategorize } from "@/utils/categoryRules";
import { normalizeDate, normalizeTime, parsePositiveAmount, safeText, transactionTypes } from "@/utils/format";

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
    (type === "income" ? "其他收入" : shouldAutoCategory ? autoCategorize({ merchant, note, rawText }) : "其他");

  return {
    id: input.id,
    date,
    time: normalizeTime(input.time),
    type,
    amount,
    currency: safeText(input.currency, "CNY"),
    category,
    merchant,
    paymentMethod: safeText(input.paymentMethod) || null,
    account: safeText(input.account) || null,
    note: note || null,
    tags: safeText(input.tags) || null,
    source: safeText(input.source, "manual"),
    rawText: rawText || null
  };
}
