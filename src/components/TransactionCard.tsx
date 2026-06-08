import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import type { Transaction } from "@/types";
import { amountColor, formatSignedAmount, typeLabels } from "@/utils/format";

function typeBadge(type: Transaction["type"]) {
  if (type === "refund") {
    return "退款";
  }

  if (type === "transfer") {
    return "资金流动";
  }

  if (type === "investment") {
    return "投资";
  }

  return typeLabels[type];
}

export function TransactionCard({
  transaction,
  onEdit,
  onDelete
}: {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}) {
  const color = amountColor(transaction.type);

  return (
    <View className="mb-3 rounded-card border border-slate-100 bg-white p-4 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
            {transaction.merchant || "未知商家"}
          </Text>
          <Text className="mt-1 text-xs text-slate-500">
            {transaction.date} {transaction.time || ""} · {typeBadge(transaction.type)} · {transaction.category || "其他"}
          </Text>
        </View>
        <Text className="text-lg font-bold" style={{ color }}>
          {formatSignedAmount(transaction.amount, transaction.type, transaction.currency)}
        </Text>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-xs text-slate-500">支付方式</Text>
          <Text className="mt-1 text-sm text-slate-700">{transaction.paymentMethod || "未填写"}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-slate-500">备注</Text>
          <Text className="mt-1 text-sm text-slate-700" numberOfLines={1}>
            {transaction.note || "无"}
          </Text>
        </View>
        {(onEdit || onDelete) && (
          <View className="ml-2 flex-row gap-2">
            {onEdit && (
              <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-blue-50" onPress={() => onEdit(transaction)}>
                <Ionicons name="create-outline" size={18} color="#2563eb" />
              </Pressable>
            )}
            {onDelete && (
              <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-red-50" onPress={() => onDelete(transaction)}>
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
