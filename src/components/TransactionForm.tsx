import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import type { Category, Transaction, TransactionInput, TransactionType } from "@/types";
import { currentTimeText, todayText, transactionTypes, typeLabels } from "@/utils/format";
import { normalizeTransactionInput } from "@/utils/transaction";

type FormState = {
  type: TransactionType;
  amount: string;
  date: string;
  time: string;
  currency: string;
  category: string;
  merchant: string;
  paymentMethod: string;
  account: string;
  note: string;
  tags: string;
  source: string;
};

function fromTransaction(
  transaction?: Transaction | null,
  defaults: { defaultCurrency?: string; defaultPaymentMethod?: string; initialType?: TransactionType } = {}
): FormState {
  return {
    type: transaction?.type ?? defaults.initialType ?? "expense",
    amount: transaction ? String(transaction.amount) : "",
    date: transaction?.date ?? todayText(),
    time: transaction?.time ?? currentTimeText(),
    currency: "CNY",
    category: transaction?.category ?? "",
    merchant: transaction?.merchant ?? "",
    paymentMethod: transaction?.paymentMethod ?? defaults.defaultPaymentMethod ?? "银行卡",
    account: transaction?.account ?? "",
    note: transaction?.note ?? "",
    tags: transaction?.tags ?? "",
    source: transaction?.source ?? "manual"
  };
}

function defaultCountInExpense(type: TransactionType) {
  return type === "expense" || type === "fee";
}

export function TransactionForm({
  categories,
  initialTransaction,
  defaultCurrency,
  defaultPaymentMethod,
  initialType,
  submitLabel = "保存",
  onSubmit
}: {
  categories: Category[];
  initialTransaction?: Transaction | null;
  defaultCurrency?: string;
  defaultPaymentMethod?: string;
  initialType?: TransactionType;
  submitLabel?: string;
  onSubmit: (input: TransactionInput) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(() =>
    fromTransaction(initialTransaction, { defaultCurrency, defaultPaymentMethod, initialType })
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!initialTransaction) {
      setForm(fromTransaction(null, { defaultCurrency, defaultPaymentMethod, initialType }));
    }
  }, [defaultCurrency, defaultPaymentMethod, initialTransaction, initialType]);

  const visibleCategories = useMemo(() => {
    const type = form.type === "income" || form.type === "refund" ? "income" : "expense";
    return categories.filter((category) => category.type === type);
  }, [categories, form.type]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      const normalized = normalizeTransactionInput(
        {
              ...form,
              amount: form.amount,
              source: form.source || "manual",
              countInExpense: defaultCountInExpense(form.type)
            },
        {
          autoCategoryEnabled: true
        }
      );
      await onSubmit(normalized);
      setForm(fromTransaction(null, { defaultCurrency, defaultPaymentMethod }));
    } catch (error) {
      Alert.alert("无法保存", error instanceof Error ? error.message : "请检查输入内容");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="rounded-card border border-slate-100 bg-white p-4 shadow-sm">
      <Text className="mb-2 text-sm font-semibold text-slate-900">类型</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {transactionTypes.map((type) => (
          <Pressable
            key={type}
            className={`rounded-full px-4 py-2 ${form.type === type ? "bg-blue-600" : "bg-slate-100"}`}
            onPress={() => update("type", type)}
          >
            <Text className={`text-sm font-medium ${form.type === type ? "text-white" : "text-slate-600"}`}>{typeLabels[type]}</Text>
          </Pressable>
        ))}
      </View>

      <Field label="金额" value={form.amount} onChangeText={(value) => update("amount", value)} keyboardType="decimal-pad" placeholder="0.00" />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label="日期" value={form.date} onChangeText={(value) => update("date", value)} placeholder="YYYY-MM-DD" />
        </View>
        <View className="flex-1">
          <Field label="时间" value={form.time} onChangeText={(value) => update("time", value)} placeholder="HH:mm" />
        </View>
      </View>

      <Text className="mb-2 text-sm font-semibold text-slate-900">货币</Text>
      <View className="mb-4 self-start rounded-full bg-blue-600 px-4 py-2">
        <Text className="text-sm font-medium text-white">CNY</Text>
      </View>

      {form.type === "expense" || form.type === "fee" ? (
        <>
          <CategoryPicker categories={visibleCategories} value={form.category} onChange={(value) => update("category", value)} />
          <Field label="支付账户" value={form.paymentMethod} onChangeText={(value) => update("paymentMethod", value)} placeholder="银行卡 / 支付宝 / 微信" />
          <Field label="商家" value={form.merchant} onChangeText={(value) => update("merchant", value)} placeholder="未知商家" />
          <Field label="备注" value={form.note} onChangeText={(value) => update("note", value)} placeholder="午餐、订阅、手续费等" />
        </>
      ) : null}

      {form.type === "income" ? (
        <>
          <Field label="收入来源" value={form.merchant} onChangeText={(value) => update("merchant", value)} placeholder="工资 / 兼职 / 收益" />
          <Field label="到账账户" value={form.paymentMethod} onChangeText={(value) => update("paymentMethod", value)} placeholder="银行卡 / 支付宝 / 微信" />
          <Field label="备注" value={form.note} onChangeText={(value) => update("note", value)} placeholder="收入说明" />
        </>
      ) : null}

      {form.type === "transfer" ? (
        <>
          <Field label="转出账户" value={form.paymentMethod} onChangeText={(value) => update("paymentMethod", value)} placeholder="从哪个账户转出" />
          <Field label="转入账户" value={form.account} onChangeText={(value) => update("account", value)} placeholder="转入哪个账户" />
          <Field label="手续费" value={form.note} onChangeText={(value) => update("note", value)} placeholder="无手续费可留空" />
          <Field label="备注" value={form.merchant} onChangeText={(value) => update("merchant", value)} placeholder="转账、提现、充值" />
        </>
      ) : null}

      {form.type === "investment" ? (
        <>
          <Field label="买入 / 赎回" value={form.category} onChangeText={(value) => update("category", value)} placeholder="买入 / 赎回" />
          <Field label="投资产品" value={form.merchant} onChangeText={(value) => update("merchant", value)} placeholder="基金、余额宝、理财通" />
          <Field label="账户" value={form.account} onChangeText={(value) => update("account", value)} placeholder="资金账户" />
          <Field label="备注" value={form.note} onChangeText={(value) => update("note", value)} placeholder="投资说明" />
        </>
      ) : null}

      {form.type === "refund" ? (
        <>
          <Field label="关联原交易" value={form.merchant} onChangeText={(value) => update("merchant", value)} placeholder="原商家或原订单" />
          <Field label="退款账户" value={form.paymentMethod} onChangeText={(value) => update("paymentMethod", value)} placeholder="退回到哪个账户" />
          <Field label="备注" value={form.note} onChangeText={(value) => update("note", value)} placeholder="退款原因" />
        </>
      ) : null}

      <Field label="标签" value={form.tags} onChangeText={(value) => update("tags", value)} placeholder="food,coffee" />
      <Field label="来源" value={form.source} onChangeText={(value) => update("source", value)} placeholder="manual" />

      <Pressable className={`mt-2 rounded-2xl py-4 ${submitting ? "bg-blue-300" : "bg-blue-600"}`} disabled={submitting} onPress={handleSubmit}>
        <Text className="text-center text-base font-semibold text-white">{submitting ? "保存中..." : submitLabel}</Text>
      </Pressable>
    </View>
  );
}

function CategoryPicker({
  categories,
  value,
  onChange
}: {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <Text className="mb-2 text-sm font-semibold text-slate-900">类别</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {categories.map((category) => (
          <Pressable
            key={category.id}
            className={`rounded-full px-3 py-2 ${value === category.name ? "bg-blue-600" : "bg-slate-100"}`}
            onPress={() => onChange(category.name)}
          >
            <Text className={`text-xs font-medium ${value === category.name ? "text-white" : "text-slate-600"}`}>{category.name}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default"
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad";
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-slate-900">{label}</Text>
      <TextInput
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
      />
    </View>
  );
}
