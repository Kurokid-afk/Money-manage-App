import { useCallback, useState } from "react";
import { Alert, Pressable, Switch, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Settings } from "@/types";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { clearAllTransactions, getAllTransactions } from "@/db/transactions";
import { getSettings, updateSettings } from "@/db/settings";
import { exportCsvFile } from "@/utils/csv";

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("银行卡");

  const load = useCallback(async () => {
    const next = await getSettings();
    setSettings(next);
    setPaymentMethod(next.defaultPaymentMethod);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function savePaymentMethod() {
    const next = await updateSettings({ defaultPaymentMethod: paymentMethod.trim() || "银行卡" });
    setSettings(next);
    Alert.alert("已保存", "默认支付方式已更新");
  }

  async function toggle(key: "autoCategoryEnabled" | "duplicateCheckEnabled", value: boolean) {
    const next = await updateSettings({ [key]: value ? 1 : 0 });
    setSettings(next);
  }

  async function exportAll() {
    const transactions = await getAllTransactions();
    const uri = await exportCsvFile("moneytrack_all_transactions.csv", transactions);
    Alert.alert("导出完成", `已导出 ${transactions.length} 条记录：${uri}`);
  }

  function clearAll() {
    Alert.alert("清空所有数据", "这会删除所有交易记录和导入批次，操作不可撤销。", [
      { text: "取消", style: "cancel" },
      {
        text: "继续",
        style: "destructive",
        onPress: () => {
          Alert.alert("二次确认", "请再次确认是否清空所有本地交易数据。", [
            { text: "取消", style: "cancel" },
            {
              text: "确认清空",
              style: "destructive",
              onPress: async () => {
                await clearAllTransactions();
                Alert.alert("已清空", "所有交易记录已删除");
              }
            }
          ]);
        }
      }
    ]);
  }

  return (
    <Screen>
      <PageTitle title="设置" subtitle="本地偏好、导出和危险操作" />

      <View className="mb-4 rounded-card bg-white p-4 shadow-sm">
        <Text className="mb-3 text-base font-semibold text-slate-900">偏好设置</Text>
        <Text className="mb-2 text-sm font-semibold text-slate-700">默认货币</Text>
        <View className="mb-4 self-start rounded-full bg-blue-600 px-4 py-2">
          <Text className="text-sm font-semibold text-white">CNY</Text>
        </View>

        <Text className="mb-2 text-sm font-semibold text-slate-700">默认支付方式</Text>
        <View className="mb-4 flex-row gap-2">
          <TextInput
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
            value={paymentMethod}
            onChangeText={setPaymentMethod}
            placeholder="银行卡"
            placeholderTextColor="#94a3b8"
          />
          <Pressable className="justify-center rounded-2xl bg-blue-600 px-4" onPress={savePaymentMethod}>
            <Text className="font-semibold text-white">保存</Text>
          </Pressable>
        </View>

        <SettingSwitch
          title="自动分类"
          subtitle="导入 CSV 时为空分类自动匹配关键词"
          value={settings?.autoCategoryEnabled === 1}
          onValueChange={(value) => toggle("autoCategoryEnabled", value)}
        />
        <SettingSwitch
          title="重复检查"
          subtitle="完全重复跳过，疑似重复标黄确认"
          value={settings?.duplicateCheckEnabled === 1}
          onValueChange={(value) => toggle("duplicateCheckEnabled", value)}
        />
      </View>

      <View className="mb-4 rounded-card bg-white p-4 shadow-sm">
        <Text className="mb-3 text-base font-semibold text-slate-900">数据管理</Text>
        <Pressable className="mb-3 flex-row items-center justify-between rounded-2xl bg-slate-50 p-4" onPress={exportAll}>
          <View className="flex-row items-center">
            <Ionicons name="download-outline" size={20} color="#2563eb" />
            <Text className="ml-3 text-sm font-semibold text-slate-800">导出全部 CSV</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </Pressable>
        <Pressable className="flex-row items-center justify-between rounded-2xl bg-red-50 p-4" onPress={clearAll}>
          <View className="flex-row items-center">
            <Ionicons name="trash-outline" size={20} color="#dc2626" />
            <Text className="ml-3 text-sm font-semibold text-red-600">清空所有数据</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#fca5a5" />
        </Pressable>
      </View>

      <View className="rounded-card bg-white p-4 shadow-sm">
        <Text className="text-base font-semibold text-slate-900">关于</Text>
        <Text className="mt-2 text-sm text-slate-500">MoneyTrack 1.0.0 · Android 本地 SQLite 记账 App</Text>
      </View>
    </Screen>
  );
}

function SettingSwitch({
  title,
  subtitle,
  value,
  onValueChange
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View className="mb-3 flex-row items-center justify-between rounded-2xl bg-slate-50 p-4">
      <View className="mr-4 flex-1">
        <Text className="text-sm font-semibold text-slate-900">{title}</Text>
        <Text className="mt-1 text-xs text-slate-500">{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: "#cbd5e1", true: "#93c5fd" }} thumbColor={value ? "#2563eb" : "#f8fafc"} />
    </View>
  );
}
