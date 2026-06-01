import { Text, View } from "react-native";

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-5">
      <Text className="text-3xl font-bold text-slate-950">{title}</Text>
      {subtitle ? <Text className="mt-1 text-sm text-slate-500">{subtitle}</Text> : null}
    </View>
  );
}
