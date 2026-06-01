import { Pressable, ScrollView, Text, View } from "react-native";

export function FilterChips<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-2 text-xs font-semibold text-slate-500">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {options.map((option) => {
            const active = value === option.value;
            return (
              <Pressable key={option.value} className={`rounded-full px-4 py-2 ${active ? "bg-blue-600" : "bg-white"}`} onPress={() => onChange(option.value)}>
                <Text className={`text-sm font-medium ${active ? "text-white" : "text-slate-600"}`}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
