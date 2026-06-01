import type { ReactNode } from "react";
import { Text, View } from "react-native";

export function ChartCard({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <View className="mb-4 rounded-card border border-slate-100 bg-white p-4 shadow-sm">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-slate-900">{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

export function EmptyChart({ label = "暂无数据" }: { label?: string }) {
  return (
    <View className="h-36 items-center justify-center rounded-2xl bg-slate-50">
      <Text className="text-sm text-slate-400">{label}</Text>
    </View>
  );
}
