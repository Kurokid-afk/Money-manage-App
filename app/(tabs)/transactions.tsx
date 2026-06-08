import { useCallback, useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Transaction, TransactionType } from "@/types";
import { FilterChips } from "@/components/FilterChips";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { StatCard } from "@/components/StatCard";
import { TransactionCard } from "@/components/TransactionCard";
import { TransactionForm } from "@/components/TransactionForm";
import { getCategories } from "@/db/categories";
import { getSettings } from "@/db/settings";
import { deleteTransaction, getTransactions, updateTransaction } from "@/db/transactions";
import { exportCsvFile } from "@/utils/csv";
import { currentMonthText, formatCurrency, shiftMonth, typeLabels } from "@/utils/format";

type FilterType = "all" | "expense" | "income" | "transfer" | "investment" | "refund";

function countsInExpense(transaction: Transaction) {
  return transaction.countInExpense === true || transaction.countInExpense === 1;
}

function visibleByType(transaction: Transaction, type: FilterType) {
  if (type === "all") return true;
  if (type === "expense") return (transaction.type === "expense" || transaction.type === "fee") && countsInExpense(transaction);
  return transaction.type === type;
}

export default function TransactionsScreen() {
  const [month, setMonth] = useState(currentMonthText());
  const [type, setType] = useState<FilterType>("all");
  const [category, setCategory] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof getCategories>>>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const load = useCallback(async () => {
    const [nextTransactions, nextCategories] = await Promise.all([
      getTransactions({ month, category, keyword }),
      getCategories()
    ]);
    setTransactions(nextTransactions);
    setCategories(nextCategories);
  }, [category, keyword, month]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const visibleTransactions = useMemo(
    () => transactions.filter((transaction) => visibleByType(transaction, type)),
    [transactions, type]
  );

  const categoryOptions = useMemo(
    () => [
      { label: "全部", value: "all" },
      ...categories.map((item) => ({
        label: item.name,
        value: item.name
      }))
    ],
    [categories]
  );

  const totalExpense = transactions.filter((item) => visibleByType(item, "expense")).reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = transactions.filter((item) => item.type === "income" || item.type === "refund").reduce((sum, item) => sum + item.amount, 0);
  const totalFlow = transactions.filter((item) => item.type === "transfer" || item.type === "investment").reduce((sum, item) => sum + item.amount, 0);

  async function handleDelete(transaction: Transaction) {
    Alert.alert("删除交易", `确定删除「${transaction.merchant || "未知商家"}」这条记录吗？`, [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          await deleteTransaction(transaction.id);
          await load();
        }
      }
    ]);
  }

  async function handleExport() {
    const fileName = `moneytrack_${month}_transactions.csv`;
    const uri = await exportCsvFile(fileName, visibleTransactions);
    Alert.alert("导出完成", `CSV 已生成：${uri}`);
  }

  return (
    <Screen>
      <View className="mb-4 flex-row items-start justify-between">
        <PageTitle title="明细" subtitle={`${visibleTransactions.length} 笔 · 当前筛选`} />
        <Pressable className="rounded-full bg-blue-600 px-4 py-2" onPress={handleExport}>
          <Text className="text-sm font-semibold text-white">导出</Text>
        </Pressable>
      </View>

      <View className="mb-4 flex-row items-center justify-between">
        <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-white" onPress={() => setMonth((value) => shiftMonth(value, -1))}>
          <Ionicons name="chevron-back" size={18} color="#334155" />
        </Pressable>
        <Text className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-800">{month}</Text>
        <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-white" onPress={() => setMonth((value) => shiftMonth(value, 1))}>
          <Ionicons name="chevron-forward" size={18} color="#334155" />
        </Pressable>
      </View>

      <View className="mb-4 flex-row flex-wrap justify-between gap-y-3">
        <StatCard label="本月消费" value={formatCurrency(totalExpense)} tone="red" />
        <StatCard label="收入" value={formatCurrency(totalIncome)} tone="green" />
        <StatCard label="资金流动" value={formatCurrency(totalFlow)} tone="blue" />
        <StatCard label="净流出" value={formatCurrency(totalExpense - totalIncome)} tone="slate" />
      </View>

      <View className="mb-4 flex-row items-center rounded-2xl bg-white px-4 py-2">
        <Ionicons name="search-outline" size={18} color="#94a3b8" />
        <TextInput
          className="ml-2 flex-1 py-2 text-base text-slate-900"
          placeholder="搜索商家、备注、标签"
          placeholderTextColor="#94a3b8"
          value={keyword}
          onChangeText={setKeyword}
        />
      </View>

      <FilterChips
        label="类型"
        value={type}
        options={[
          { label: "全部", value: "all" },
          { label: "消费", value: "expense" },
          { label: typeLabels.income, value: "income" },
          { label: typeLabels.transfer, value: "transfer" },
          { label: typeLabels.investment, value: "investment" },
          { label: typeLabels.refund, value: "refund" }
        ]}
        onChange={(value) => setType(value as FilterType)}
      />
      <FilterChips label="类别" value={category} options={categoryOptions} onChange={setCategory} />

      <View className="mt-2">
        {visibleTransactions.length > 0 ? (
          visibleTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <View className="items-center rounded-card bg-white p-8">
            <Ionicons name="document-text-outline" size={52} color="#bfdbfe" />
            <Text className="mt-3 text-base font-semibold text-slate-900">还没有交易记录</Text>
            <Text className="mt-1 text-sm text-slate-500">添加记录或导入 CSV 后会显示在这里</Text>
          </View>
        )}
      </View>

      <Modal animationType="slide" visible={Boolean(editing)} onRequestClose={() => setEditing(null)}>
        <Screen>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-slate-950">编辑记录</Text>
            <Pressable onPress={() => setEditing(null)}>
              <Text className="text-base font-semibold text-blue-600">关闭</Text>
            </Pressable>
          </View>
          <TransactionForm
            categories={categories}
            initialTransaction={editing}
            submitLabel="保存修改"
            onSubmit={async (input) => {
              if (!editing) return;
              const settings = await getSettings();
              await updateTransaction(editing.id, input, {
                autoCategoryEnabled: settings.autoCategoryEnabled === 1
              });
              setEditing(null);
              await load();
            }}
          />
        </Screen>
      </Modal>
    </Screen>
  );
}
