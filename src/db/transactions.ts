import type { Transaction, TransactionFilters, TransactionInput } from "@/types";
import { getDatabase } from "@/db/database";
import { createId, nowIso } from "@/utils/format";
import { normalizeTransactionInput } from "@/utils/transaction";

const transactionSelect = `
  id, date, time, type, amount, currency, category, merchant, paymentMethod, account, note, tags, source, rawText,
  count_in_expense as countInExpense, createdAt, updatedAt
`;

function buildWhere(filters: TransactionFilters = {}) {
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (filters.month) {
    clauses.push("date >= ? AND date < ?");
    params.push(`${filters.month}-01`);
    const [year, month] = filters.month.split("-").map(Number);
    const nextMonth = new Date(year, month, 1);
    params.push(`${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`);
  }

  if (filters.type && filters.type !== "all") {
    clauses.push("type = ?");
    params.push(filters.type);
  }

  if (filters.category && filters.category !== "all") {
    clauses.push("category = ?");
    params.push(filters.category);
  }

  if (filters.keyword?.trim()) {
    const keyword = `%${filters.keyword.trim()}%`;
    clauses.push("(merchant LIKE ? OR note LIKE ? OR tags LIKE ? OR account LIKE ? OR paymentMethod LIKE ? OR category LIKE ?)");
    params.push(keyword, keyword, keyword, keyword, keyword, keyword);
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params
  };
}

export async function getTransactions(filters: TransactionFilters = {}) {
  const db = await getDatabase();
  const { where, params } = buildWhere(filters);
  return db.getAllAsync<Transaction>(
    `SELECT ${transactionSelect} FROM transactions ${where} ORDER BY date DESC, time DESC, createdAt DESC`,
    ...params
  );
}

export async function getRecentTransactions(limit = 10) {
  const db = await getDatabase();
  return db.getAllAsync<Transaction>(
    `SELECT ${transactionSelect} FROM transactions ORDER BY date DESC, time DESC, createdAt DESC LIMIT ?`,
    limit
  );
}

export async function getAllTransactions() {
  const db = await getDatabase();
  return db.getAllAsync<Transaction>(`SELECT ${transactionSelect} FROM transactions ORDER BY date DESC, time DESC, createdAt DESC`);
}

export async function getDuplicateCandidates() {
  const db = await getDatabase();
  return db.getAllAsync<Transaction>(
    `SELECT ${transactionSelect} FROM transactions`
  );
}

export async function createTransaction(input: TransactionInput, options: { autoCategoryEnabled?: boolean } = {}) {
  const db = await getDatabase();
  const normalized = normalizeTransactionInput(input, options);
  const timestamp = nowIso();
  const transaction: Transaction = {
    id: normalized.id ?? createId("txn"),
    date: normalized.date,
    time: normalized.time,
    type: normalized.type,
    amount: normalized.amount,
    currency: normalized.currency,
    category: normalized.category,
    merchant: normalized.merchant,
    paymentMethod: normalized.paymentMethod,
    account: normalized.account,
    note: normalized.note,
    tags: normalized.tags,
    source: normalized.source,
    rawText: normalized.rawText,
    countInExpense: normalized.countInExpense,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await db.runAsync(
    `INSERT INTO transactions
      (id, date, time, type, amount, currency, category, merchant, paymentMethod, account, note, tags, source, rawText, count_in_expense, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    transaction.id,
    transaction.date,
    transaction.time,
    transaction.type,
    transaction.amount,
    transaction.currency,
    transaction.category,
    transaction.merchant,
    transaction.paymentMethod,
    transaction.account,
    transaction.note,
    transaction.tags,
    transaction.source,
    transaction.rawText,
    transaction.countInExpense ? 1 : 0,
    transaction.createdAt,
    transaction.updatedAt
  );

  return transaction;
}

export async function createTransactions(inputs: TransactionInput[], options: { autoCategoryEnabled?: boolean } = {}) {
  const created: Transaction[] = [];
  for (const input of inputs) {
    created.push(await createTransaction(input, options));
  }

  return created;
}

export async function updateTransaction(id: string, input: TransactionInput, options: { autoCategoryEnabled?: boolean } = {}) {
  const db = await getDatabase();
  const normalized = normalizeTransactionInput({ ...input, id }, options);
  const timestamp = nowIso();

  await db.runAsync(
    `UPDATE transactions
     SET date = ?, time = ?, type = ?, amount = ?, currency = ?, category = ?, merchant = ?, paymentMethod = ?,
         account = ?, note = ?, tags = ?, source = ?, rawText = ?, count_in_expense = ?, updatedAt = ?
     WHERE id = ?`,
    normalized.date,
    normalized.time,
    normalized.type,
    normalized.amount,
    normalized.currency,
    normalized.category,
    normalized.merchant,
    normalized.paymentMethod,
    normalized.account,
    normalized.note,
    normalized.tags,
    normalized.source,
    normalized.rawText,
    normalized.countInExpense ? 1 : 0,
    timestamp,
    id
  );
}

export async function deleteTransaction(id: string) {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM transactions WHERE id = ?", id);
}

export async function clearAllTransactions() {
  const db = await getDatabase();
  await db.execAsync("DELETE FROM transactions; DELETE FROM import_batches;");
}
