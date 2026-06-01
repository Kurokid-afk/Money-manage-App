import type { Transaction } from "@/types";
import { getAllTransactions, getRecentTransactions, getTransactions } from "@/db/transactions";
import { getCategoryColor } from "@/utils/categoryRules";
import { currentMonthText, daysInMonth, shiftMonth, todayText } from "@/utils/format";

function sum(transactions: Transaction[], predicate: (transaction: Transaction) => boolean) {
  return Number(transactions.filter(predicate).reduce((total, transaction) => total + transaction.amount, 0).toFixed(2));
}

function eachDayKey(date: string) {
  return date.slice(5);
}

export async function getDashboardData(month = currentMonthText()) {
  const [transactions, recentTransactions] = await Promise.all([
    getTransactions({ month }),
    getRecentTransactions(10)
  ]);

  const today = todayText();
  const expense = sum(transactions, (transaction) => transaction.type === "expense");
  const income = sum(transactions, (transaction) => transaction.type === "income" || transaction.type === "refund");
  const todayExpense = sum(transactions, (transaction) => transaction.type === "expense" && transaction.date === today);

  const categoryMap = new Map<string, number>();
  for (const transaction of transactions.filter((item) => item.type === "expense")) {
    const category = transaction.category || "其他";
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + transaction.amount);
  }

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
      color: getCategoryColor(name)
    }))
    .sort((a, b) => b.value - a.value);

  const last7Dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  });

  const recent7Days = last7Dates.map((date) => ({
    label: date.slice(5),
    value: sum(transactions, (transaction) => transaction.type === "expense" && transaction.date === date)
  }));

  const dailyExpenses = Array.from({ length: daysInMonth(month) }, (_, index) => {
    const date = `${month}-${String(index + 1).padStart(2, "0")}`;
    return {
      label: eachDayKey(date),
      value: sum(transactions, (transaction) => transaction.type === "expense" && transaction.date === date)
    };
  });

  return {
    month,
    stats: {
      expense,
      income,
      balance: Number((income - expense).toFixed(2)),
      todayExpense
    },
    categoryBreakdown,
    recent7Days,
    dailyExpenses,
    recentTransactions
  };
}

export async function getAnalyticsData(month = currentMonthText()) {
  const allTransactions = await getAllTransactions();
  const selectedTransactions = allTransactions.filter((transaction) => transaction.date.startsWith(month));
  const months = Array.from({ length: 6 }, (_, index) => shiftMonth(month, index - 5));

  const monthlyExpenseTrend = months.map((item) => ({
    label: item.slice(5),
    value: sum(allTransactions, (transaction) => transaction.type === "expense" && transaction.date.startsWith(item))
  }));

  const incomeVsExpense = months.map((item) => ({
    label: item.slice(5),
    income: sum(allTransactions, (transaction) => ["income", "refund"].includes(transaction.type) && transaction.date.startsWith(item)),
    expense: sum(allTransactions, (transaction) => transaction.type === "expense" && transaction.date.startsWith(item))
  }));

  function rankBy(field: "category" | "merchant" | "paymentMethod") {
    const map = new Map<string, number>();
    for (const transaction of selectedTransactions.filter((item) => item.type === "expense")) {
      const key = transaction[field] || "未知";
      map.set(key, (map.get(key) ?? 0) + transaction.amount);
    }

    return Array.from(map.entries())
      .map(([name, amount]) => ({
        name,
        amount: Number(amount.toFixed(2)),
        color: field === "category" ? getCategoryColor(name) : "#2563eb"
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }

  const expenses = selectedTransactions.filter((transaction) => transaction.type === "expense");
  const totalExpense = sum(selectedTransactions, (transaction) => transaction.type === "expense");
  const totalIncome = sum(selectedTransactions, (transaction) => transaction.type === "income" || transaction.type === "refund");

  return {
    month,
    monthlyExpenseTrend,
    categoryRanking: rankBy("category"),
    merchantRanking: rankBy("merchant"),
    paymentMethodShare: rankBy("paymentMethod"),
    incomeVsExpense,
    summary: {
      totalExpense,
      totalIncome,
      maxExpense: Number(Math.max(0, ...expenses.map((transaction) => transaction.amount)).toFixed(2)),
      averageDailyExpense: Number((totalExpense / daysInMonth(month)).toFixed(2)),
      transactionTotal: selectedTransactions.length,
      incomeCount: selectedTransactions.filter((transaction) => transaction.type === "income").length,
      expenseCount: expenses.length
    }
  };
}
