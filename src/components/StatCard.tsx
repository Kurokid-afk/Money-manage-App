import { Text, View } from "react-native";

export function StatCard({
  label,
  value,
  tone = "blue"
}: {
  label: string;
  value: string;
  tone?: "blue" | "red" | "green" | "slate";
}) {
  const colors = {
    blue: "text-blue-600",
    red: "text-red-600",
    green: "text-emerald-600",
    slate: "text-slate-800"
  };

  return (
    <View className="w-[48%] rounded-card border border-slate-100 bg-white p-4 shadow-sm">
      <Text className="text-xs text-slate-500">{label}</Text>
      <Text className={`mt-2 text-xl font-bold ${colors[tone]}`}>{value}</Text>
    </View>
  );
}
