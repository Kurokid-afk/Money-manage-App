import { Pressable, Text, View } from "react-native";
import type { CsvPreviewRow } from "@/types";
import { amountPreview } from "@/utils/csv";
import { typeLabels } from "@/utils/format";

const statusStyles = {
  ok: {
    label: "正常",
    badge: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200"
  },
  suspected: {
    label: "疑似重复",
    badge: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200"
  },
  error: {
    label: "错误",
    badge: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200"
  },
  duplicate: {
    label: "已跳过",
    badge: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200"
  }
};

export function CsvPreviewList({
  rows,
  onToggle
}: {
  rows: CsvPreviewRow[];
  onToggle: (rowId: number) => void;
}) {
  return (
    <View>
      {rows.map((row) => {
        const style = statusStyles[row.status];
        const selectable = row.status === "suspected";

        return (
          <Pressable
            key={row.rowId}
            disabled={!selectable}
            onPress={() => onToggle(row.rowId)}
            className={`mb-3 rounded-card border bg-white p-4 shadow-sm ${style.border}`}
          >
            <View className="flex-row items-start justify-between">
              <View className="mr-3 flex-1">
                <View className="mb-2 flex-row items-center gap-2">
                  <Text className={`rounded-full px-2 py-1 text-xs font-semibold ${style.badge} ${style.text}`}>{style.label}</Text>
                  {selectable && (
                    <Text className={`rounded-full px-2 py-1 text-xs ${row.selected ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                      {row.selected ? "将导入" : "不导入"}
                    </Text>
                  )}
                </View>
                <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
                  {row.data.merchant || "未知商家"}
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  {row.data.date} {row.data.time || ""} · {typeLabels[row.data.type] || row.data.type} · {row.data.category || "其他"}
                </Text>
                {row.reason ? <Text className={`mt-2 text-xs ${style.text}`}>{row.reason}</Text> : null}
              </View>
              <Text className="text-base font-bold text-slate-900">{amountPreview(row.data)}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
