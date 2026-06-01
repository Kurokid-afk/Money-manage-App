import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const iconMap = {
  index: "home-outline",
  transactions: "receipt-outline",
  add: "add-circle-outline",
  import: "cloud-upload-outline",
  analytics: "pie-chart-outline",
  settings: "settings-outline"
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
          borderTopColor: "#e2e8f0",
          backgroundColor: "#ffffff"
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600"
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={iconMap[route.name as keyof typeof iconMap]} color={color} size={size} />
        )
      })}
    >
      <Tabs.Screen name="index" options={{ title: "首页" }} />
      <Tabs.Screen name="transactions" options={{ title: "记录" }} />
      <Tabs.Screen name="add" options={{ title: "记账" }} />
      <Tabs.Screen name="import" options={{ title: "导入" }} />
      <Tabs.Screen name="analytics" options={{ title: "分析" }} />
      <Tabs.Screen name="settings" options={{ title: "设置" }} />
    </Tabs>
  );
}
