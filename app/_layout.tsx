import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { initializeDatabase } from "@/db/database";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDatabase()
      .then(() => setReady(true))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "数据库初始化失败");
      });
  }, []);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-6">
        <Text className="text-center text-lg font-semibold text-red-600">初始化失败</Text>
        <Text className="mt-2 text-center text-sm text-slate-500">{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-base font-semibold text-blue-600">MoneyTrack</Text>
        <Text className="mt-2 text-sm text-slate-500">正在准备本地数据库...</Text>
      </View>
    );
  }

  return (
    <AppErrorBoundary>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </AppErrorBoundary>
  );
}
