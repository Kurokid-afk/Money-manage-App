import type { Category } from "@/types";
import { createId, nowIso } from "@/utils/format";

export const expenseCategories = [
  "餐饮",
  "交通",
  "购物",
  "娱乐",
  "游戏",
  "学习",
  "房租",
  "水电网",
  "医疗",
  "健身",
  "旅行",
  "数码",
  "社交",
  "日用品",
  "订阅服务",
  "存钱",
  "投资理财",
  "账户转移",
  "其他"
];

export const defaultCategories: Array<Omit<Category, "id" | "createdAt">> = [
  { name: "餐饮", type: "expense", color: "#2563eb", icon: "restaurant-outline" },
  { name: "交通", type: "expense", color: "#06b6d4", icon: "train-outline" },
  { name: "购物", type: "expense", color: "#f97316", icon: "bag-outline" },
  { name: "娱乐", type: "expense", color: "#8b5cf6", icon: "film-outline" },
  { name: "游戏", type: "expense", color: "#ef4444", icon: "game-controller-outline" },
  { name: "学习", type: "expense", color: "#0ea5e9", icon: "book-outline" },
  { name: "房租", type: "expense", color: "#64748b", icon: "home-outline" },
  { name: "水电网", type: "expense", color: "#22c55e", icon: "wifi-outline" },
  { name: "医疗", type: "expense", color: "#dc2626", icon: "medkit-outline" },
  { name: "健身", type: "expense", color: "#16a34a", icon: "barbell-outline" },
  { name: "旅行", type: "expense", color: "#14b8a6", icon: "airplane-outline" },
  { name: "数码", type: "expense", color: "#475569", icon: "phone-portrait-outline" },
  { name: "社交", type: "expense", color: "#ec4899", icon: "people-outline" },
  { name: "日用品", type: "expense", color: "#84cc16", icon: "cube-outline" },
  { name: "订阅服务", type: "expense", color: "#6366f1", icon: "repeat-outline" },
  { name: "存钱", type: "expense", color: "#0f766e", icon: "file-tray-full-outline" },
  { name: "投资理财", type: "expense", color: "#2563eb", icon: "trending-up-outline" },
  { name: "账户转移", type: "expense", color: "#64748b", icon: "swap-horizontal-outline" },
  { name: "其他", type: "expense", color: "#94a3b8", icon: "ellipse-outline" },
  { name: "工资", type: "income", color: "#16a34a", icon: "wallet-outline" },
  { name: "兼职", type: "income", color: "#22c55e", icon: "briefcase-outline" },
  { name: "投资", type: "income", color: "#0f766e", icon: "trending-up-outline" },
  { name: "退款", type: "income", color: "#0ea5e9", icon: "return-up-back-outline" },
  { name: "其他收入", type: "income", color: "#64748b", icon: "add-circle-outline" }
];

const rules = [
  {
    category: "餐饮",
    keywords: ["kfc", "mcdonald", "restaurant", "cafe", "coffee", "starbucks", "饭", "餐", "奶茶", "外卖", "美团", "饿了么"]
  },
  {
    category: "交通",
    keywords: ["ptv", "uber", "taxi", "滴滴", "地铁", "公交", "train", "tram", "bus"]
  },
  {
    category: "购物",
    keywords: ["amazon", "淘宝", "京东", "拼多多", "kmart", "coles", "woolworths", "超市"]
  },
  {
    category: "娱乐",
    keywords: ["cinema", "movie", "ktv", "bilibili", "netflix", "spotify"]
  },
  {
    category: "游戏",
    keywords: ["steam", "playstation", "xbox", "nintendo", "battle.net", "epic games"]
  },
  {
    category: "学习",
    keywords: ["monash", "course", "book", "udemy", "coursera", "教材", "学费"]
  },
  {
    category: "房租",
    keywords: ["rent", "房租", "rental"]
  },
  {
    category: "水电网",
    keywords: ["electricity", "water", "gas", "internet", "phone bill", "宽带", "电费", "水费", "网费"]
  },
  {
    category: "健身",
    keywords: ["gym", "fitness", "protein", "supplement", "健身"]
  },
  {
    category: "存钱",
    keywords: ["saving", "savings", "deposit", "vault", "存钱", "储蓄", "存款", "定存", "理财", "余额宝"]
  },
  {
    category: "投资理财",
    keywords: ["fund", "基金", "理财通", "余额宝", "零钱通", "买入", "赎回", "定投", "收益"]
  },
  {
    category: "账户转移",
    keywords: ["transfer", "top up", "withdraw", "提现", "充值", "转账", "转入", "转出"]
  }
];

export function autoCategorize(input: { merchant?: string | null; note?: string | null; rawText?: string | null }) {
  const text = `${input.merchant ?? ""} ${input.note ?? ""} ${input.rawText ?? ""}`.toLowerCase();
  return rules.find((rule) => rule.keywords.some((keyword) => text.includes(keyword.toLowerCase())))?.category ?? "其他";
}

export function getCategoryColor(name?: string | null) {
  return defaultCategories.find((category) => category.name === name)?.color ?? "#94a3b8";
}

export function categoryRowsForSeed() {
  return defaultCategories.map((category) => ({
    id: createId("cat"),
    createdAt: nowIso(),
    ...category
  }));
}
