import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

const iconMap = {
  index: "home-outline",
  transactions: "receipt-outline",
  analytics: "pie-chart-outline",
  settings: "person-circle-outline"
} as const;

export default function TabsLayout() {
  const [actionsOpen, setActionsOpen] = useState(false);

  function go(path: "/add" | "/import" | "/add?type=transfer" | "/add?type=investment" | "/add?type=refund") {
    setActionsOpen(false);
    router.push(path);
  }

  return (
    <>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: "#2563eb",
          tabBarInactiveTintColor: "#64748b",
          tabBarStyle: {
            height: 76,
            paddingBottom: 12,
            paddingTop: 8,
            borderTopColor: "#e2e8f0",
            backgroundColor: "#ffffff"
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600"
          },
          tabBarIcon: ({ color, size }) => {
            if (route.name === "add") {
              return (
                <View className="-mt-5 h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-sm">
                  <Ionicons name="add" color="#ffffff" size={30} />
                </View>
              );
            }

            return <Ionicons name={iconMap[route.name as keyof typeof iconMap]} color={color} size={size} />;
          }
        })}
      >
        <Tabs.Screen name="index" options={{ title: "首页" }} />
        <Tabs.Screen name="transactions" options={{ title: "明细" }} />
        <Tabs.Screen
          name="add"
          options={{
            title: "",
            tabBarButton: () => <Pressable onPress={() => setActionsOpen(true)} className="flex-1 items-center justify-center" />
          }}
        />
        <Tabs.Screen name="analytics" options={{ title: "分析" }} />
        <Tabs.Screen name="settings" options={{ title: "我的" }} />
        <Tabs.Screen name="import" options={{ href: null }} />
      </Tabs>

      <Modal transparent animationType="fade" visible={actionsOpen} onRequestClose={() => setActionsOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/30 px-4 pb-8" onPress={() => setActionsOpen(false)}>
          <Pressable className="rounded-card bg-white p-3" onPress={(event) => event.stopPropagation()}>
            <Action icon="create-outline" label="记一笔" detail="消费或收入" onPress={() => go("/add")} />
            <Action icon="cloud-upload-outline" label="导入账单" detail="CSV 三步导入" onPress={() => go("/import")} />
            <Action icon="swap-horizontal-outline" label="转账/投资" detail="账户转移、基金、理财" onPress={() => go("/add?type=transfer")} />
            <Action icon="return-up-back-outline" label="退款" detail="关联退回，不计消费" onPress={() => go("/add?type=refund")} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function Action({
  icon,
  label,
  detail,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable className="flex-row items-center rounded-2xl px-3 py-4 active:bg-slate-50" onPress={onPress}>
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
        <Ionicons name={icon} size={22} color="#2563eb" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-slate-900">{label}</Text>
        <Text className="mt-0.5 text-xs text-slate-500">{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </Pressable>
  );
}
