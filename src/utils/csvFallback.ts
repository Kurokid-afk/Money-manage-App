import Papa from "papaparse";
import type { TransactionInput, TransactionType } from "@/types";

type CanonicalKey =
  | "date"
  | "datetime"
  | "time"
  | "type"
  | "amount"
  | "expenseAmount"
  | "incomeAmount"
  | "currency"
  | "category"
  | "merchant"
  | "paymentMethod"
  | "account"
  | "note"
  | "tags"
  | "source"
  | "rawText"
  | "countInExpense";

const standardImportHeaders = [
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

const aliases: Record<CanonicalKey, string[]> = {
  date: ["date", "transaction date", "posting date", "日期", "交易日期", "记账日期", "账单日期", "入账日期", "发生日期"],
  datetime: ["datetime", "date time", "date_time", "交易时间", "交易日期时间", "创建时间", "完成时间", "付款时间"],
  time: ["time", "交易时刻", "时间点", "时刻", "时间"],
  type: ["type", "transaction type", "类型", "交易类型", "收支", "收/支", "方向", "交易方向"],
  amount: ["amount", "money", "value", "total", "price", "金额", "交易金额", "金额元", "总金额", "支付金额", "实付金额"],
  expenseAmount: ["expense", "debit", "outflow", "paid out", "支出", "支出金额", "付款金额", "扣款金额"],
  incomeAmount: ["income", "credit", "inflow", "received", "收入", "收入金额", "收款金额", "入账金额"],
  currency: ["currency", "currency code", "货币", "币种", "单位"],
  category: ["category", "类别", "分类", "消费分类", "账单分类"],
  merchant: ["merchant", "payee", "counterparty", "name", "商家", "商户", "交易对方", "对方", "收款方", "付款方", "店铺"],
  paymentMethod: ["payment_method", "payment method", "method", "支付方式", "付款方式", "收付款方式", "支付渠道", "支付工具", "方式"],
  account: ["account", "账户", "账号", "银行卡", "付款账户", "收款账户", "资金账户"],
  note: ["note", "memo", "remark", "comment", "comments", "description", "备注", "说明", "描述", "商品", "商品名称", "商品说明", "交易说明"],
  tags: ["tags", "tag", "标签"],
  source: ["source", "来源", "数据来源"],
  rawText: ["raw_text", "raw text", "rawtext", "raw", "ocr", "原始文本", "原文", "截图文本"],
  countInExpense: ["count_in_expense", "count in expense", "计入消费", "是否计入消费"]
};

const aliasMap = new Map<string, CanonicalKey>(
  Object.entries(aliases).flatMap(([canonical, values]) =>
    values.map((value) => [normalizeHeader(value), canonical as CanonicalKey])
  )
);

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s._\-:/\\()[\]{}<>【】（）"'“”‘’|,，。;；]+/g, "");
}

function canonicalKey(value: unknown): CanonicalKey | null {
  return aliasMap.get(normalizeHeader(value)) ?? null;
}

function cellText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(cellText).filter(Boolean).join(" ");
  }

  return String(value ?? "").replace(/^\uFEFF/, "").trim();
}

function rowHasValues(row: Record<string, unknown>): boolean {
  return Object.values(row).some((value) => cellText(value).length > 0);
}

function canonicalCount(values: unknown[]): number {
  return values.reduce<number>((count, value) => count + (canonicalKey(value) ? 1 : 0), 0);
}

function hasRecognizedHeader(fields?: unknown[]): boolean {
  if (!fields?.length) {
    return false;
  }

  const joinedFields = fields.map(cellText).join(",");
  const hasDateValue = /\d{4}[-/.年]\d{1,2}|\d{1,2}月\d{1,2}日?/.test(joinedFields);
  const hasAmountValue = /[¥￥$]?\s*[+-]?\d+(?:\.\d{1,2})?/.test(joinedFields);
  if (hasDateValue && hasAmountValue) {
    return false;
  }

  const canonical = fields.map(canonicalKey).filter(Boolean);
  const hasDate = canonical.includes("date") || canonical.includes("datetime");
  const hasAmount = canonical.includes("amount") || canonical.includes("expenseAmount") || canonical.includes("incomeAmount");
  return canonical.length >= 3 || (canonical.length >= 2 && (hasDate || hasAmount));
}

function looksLikeCsvLine(line: string): boolean {
  if (!line.trim()) {
    return false;
  }

  const hasDelimiter = /[,;\t，]/.test(line);
  const parts = line.split(/[,;\t，]/);
  const aliasHits = canonicalCount(parts);
  const hasDateLikeValue = /\d{4}[-/.年]\d{1,2}|\d{1,2}月\d{1,2}日?/.test(line);
  return aliasHits >= 2 || (hasDelimiter && (aliasHits >= 1 || hasDateLikeValue));
}

function prepareCsvContent(content: string) {
  const lines = String(content ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^\uFEFF/, "").trimEnd())
    .filter((line) => !line.trim().startsWith("```"))
    .filter((line) => !/^sep\s*=/i.test(line.trim()));

  while (lines.length && !lines[0].trim()) {
    lines.shift();
  }

  while (lines.length && !lines[lines.length - 1].trim()) {
    lines.pop();
  }

  const start = lines.findIndex(looksLikeCsvLine);
  const usableLines = start >= 0 ? lines.slice(start) : lines;
  return usableLines.join("\n").replace(/，/g, ",");
}

function parseAsObjects(content: string) {
  const result = Papa.parse<Record<string, unknown>>(content, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => cellText(header)
  });

  const rows = result.data.filter(rowHasValues);
  return {
    fields: result.meta.fields ?? [],
    rows
  };
}

function parseAsArrays(content: string) {
  const result = Papa.parse<string[]>(content, {
    header: false,
    skipEmptyLines: "greedy"
  });

  return result.data.filter((row) => row.some((value) => cellText(value).length > 0));
}

function mapArrayRows(rows: string[][]): Array<Record<string, string>> {
  if (!rows.length) {
    return [];
  }

  const firstRow = rows[0];
  const hasHeader = hasRecognizedHeader(firstRow);
  const headers = hasHeader ? firstRow.map(cellText) : standardImportHeaders;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows.map((row) =>
    headers.reduce<Record<string, string>>((data, header, index) => {
      data[header] = cellText(row[index]);
      return data;
    }, {})
  );
}

export function parseCsv(content: string) {
  const prepared = prepareCsvContent(content);
  if (!prepared.trim()) {
    return [];
  }

  const objectResult = parseAsObjects(prepared);
  if (hasRecognizedHeader(objectResult.fields) && objectResult.rows.length > 0) {
    return objectResult.rows;
  }

  const arrayRows = parseAsArrays(prepared);
  if (arrayRows.length > 0) {
    return mapArrayRows(arrayRows);
  }

  if (objectResult.fields.length > 0 && !hasRecognizedHeader(objectResult.fields)) {
    return mapArrayRows([objectResult.fields.map(cellText)]);
  }

  return [];
}

type NormalizedRow = Partial<Record<CanonicalKey, string>> & {
  allText: string;
};

function normalizeRow(row: Record<string, unknown>): NormalizedRow {
  const normalized: NormalizedRow = { allText: "" };
  const rawTextParts: string[] = [];
  const allParts: string[] = [];

  for (const [key, rawValue] of Object.entries(row)) {
    const value = cellText(rawValue);
    if (!value) {
      continue;
    }

    allParts.push(value);
    if (key === "__parsed_extra") {
      rawTextParts.push(value);
      continue;
    }

    const canonical = canonicalKey(key);
    if (canonical && !normalized[canonical]) {
      normalized[canonical] = value;
    } else if (!canonical) {
      rawTextParts.push(value);
    }
  }

  if (!normalized.rawText && rawTextParts.length > 0) {
    normalized.rawText = rawTextParts.join(" ");
  }

  normalized.allText = allParts.join(" ");
  return normalized;
}

function normalizeDateText(value?: string | null) {
  const text = cellText(value);
  if (!text) {
    return "";
  }

  const excelSerial = Number(text);
  if (/^\d{5}$/.test(text) && Number.isFinite(excelSerial)) {
    const date = new Date(Date.UTC(1899, 11, 30 + excelSerial));
    return formatDateParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }

  const ymd = text.match(/(\d{4})[年./-]\s*(\d{1,2})[月./-]\s*(\d{1,2})/);
  if (ymd) {
    return formatDateParts(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]));
  }

  const compact = text.match(/\b(\d{4})(\d{2})(\d{2})\b/);
  if (compact) {
    return formatDateParts(Number(compact[1]), Number(compact[2]), Number(compact[3]));
  }

  const monthDay = text.match(/(?:^|\s)(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
  if (monthDay) {
    return formatDateParts(new Date().getFullYear(), Number(monthDay[1]), Number(monthDay[2]));
  }

  const slashYearLast = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (slashYearLast) {
    const first = Number(slashYearLast[1]);
    const second = Number(slashYearLast[2]);
    const year = normalizeYear(Number(slashYearLast[3]));
    const month = first > 12 ? second : first;
    const day = first > 12 ? first : second;
    return formatDateParts(year, month, day);
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return formatDateParts(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }

  return text;
}

function normalizeYear(year: number) {
  return year < 100 ? 2000 + year : year;
}

function formatDateParts(year: number, month: number, day: number) {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    return "";
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeTimeText(value?: string | null) {
  const text = cellText(value);
  if (!text) {
    return "";
  }

  const hhmm = text.match(/(?:^|\s)(\d{1,2})[:：](\d{1,2})(?::\d{1,2})?/);
  if (hhmm) {
    return formatTimeParts(Number(hhmm[1]), Number(hhmm[2]));
  }

  const chinese = text.match(/(\d{1,2})\s*时\s*(\d{1,2})\s*分?/);
  if (chinese) {
    return formatTimeParts(Number(chinese[1]), Number(chinese[2]));
  }

  const compact = text.match(/\b(\d{2})(\d{2})\b/);
  if (compact) {
    return formatTimeParts(Number(compact[1]), Number(compact[2]));
  }

  return "";
}

function formatTimeParts(hour: number, minute: number) {
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return "";
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseMoney(value?: string | null) {
  const text = cellText(value);
  const lower = text.toLowerCase();
  const negativeByText = /支出|消费|付款|扣款|debit|outflow|paid/.test(lower);
  const positiveByText = /收入|收款|入账|credit|inflow|received/.test(lower);
  const negativeByParens = /\([^)]*\d[^)]*\)/.test(text);
  const negativeBySign = /-\s*[¥￥$a-zA-Z]*\s*\d|\d\s*-/.test(text);
  const positiveBySign = /\+\s*[¥￥$a-zA-Z]*\s*\d/.test(text);
  const cleaned = text
    .replace(/[,\s，]/g, "")
    .replace(/[()（）]/g, "")
    .replace(/人民币|澳元|美元|元|cny|rmb|aud|usd|a\$|¥|￥|\$/gi, "");
  const match = cleaned.match(/[+-]?\d+(?:\.\d+)?/);
  const rawAmount = match ? Number(match[0]) : Number.NaN;

  if (!Number.isFinite(rawAmount)) {
    return { amount: "", sign: null as -1 | 1 | null };
  }

  const sign: -1 | 1 | null = negativeByText || negativeByParens || negativeBySign || rawAmount < 0 ? -1 : positiveByText || positiveBySign ? 1 : null;
  return {
    amount: Math.abs(rawAmount).toFixed(2),
    sign
  };
}

function normalizeCurrencyText(value: string | undefined, rowText: string) {
  const text = `${value ?? ""} ${rowText}`.toLowerCase();
  if (/aud|a\$|澳元/.test(text)) {
    return "AUD";
  }

  if (/usd|\$|美元/.test(text)) {
    return "USD";
  }

  return "CNY";
}

function normalizeTypeText(value: string | undefined, rowText: string, sign: -1 | 1 | null, amountSource: "amount" | "expense" | "income") {
  const text = `${value ?? ""} ${rowText}`.toLowerCase();

  if (/refund|reversal|退款|退回|退还|返还/.test(text)) {
    return "refund";
  }

  if (/\bfee\b|手续费|服务费/.test(text)) {
    return "fee";
  }

  if (/investment|fund|finance|基金|理财|余额宝|零钱通|理财通|买入|赎回|定投/.test(text)) {
    return "investment";
  }

  if (/transfer|转账|转出|转入|互转/.test(text)) {
    return "transfer";
  }

  if (/income|salary|credit|收入|收款|入账|工资|兼职/.test(text) || amountSource === "income") {
    return "income";
  }

  if (/expense|debit|支出|消费|付款|扣款/.test(text) || amountSource === "expense") {
    return "expense";
  }

  if (sign === -1) {
    return "expense";
  }

  if (sign === 1) {
    return "income";
  }

  return "expense";
}

export function rowToTransactionInput(row: Record<string, unknown>): TransactionInput {
  const normalized = normalizeRow(row);
  const amountSource = normalized.amount ? "amount" : normalized.expenseAmount ? "expense" : normalized.incomeAmount ? "income" : "amount";
  const money = parseMoney(normalized.amount || normalized.expenseAmount || normalized.incomeAmount);
  const rowText = normalized.allText || normalized.rawText || "";
  const type = normalizeTypeText(normalized.type, rowText, money.sign, amountSource) as TransactionType;
  const date = normalizeDateText(normalized.date || normalized.datetime);
  const time = normalizeTimeText(normalized.time || normalized.datetime);
  const note = normalized.note || "";
  const rawText = normalized.rawText || rowText;
  const currency = normalizeCurrencyText(normalized.currency, rowText);
  const countInExpense = type === "expense" || type === "fee";
  const countOverride = normalized.countInExpense ? /^(1|true|yes|y|是)$/i.test(normalized.countInExpense) : countInExpense;

  return {
    date,
    time,
    type,
    amount: money.amount,
    currency,
    category: normalized.category || "",
    merchant: normalized.merchant || "",
    paymentMethod: normalized.paymentMethod || "",
    account: normalized.account || "",
    note,
    tags: normalized.tags || "",
    source: normalized.source || "csv",
    rawText,
    countInExpense: countOverride
  };
}
