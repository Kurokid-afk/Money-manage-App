import type { ReactNode } from "react";
import { SafeAreaView, ScrollView, View } from "react-native";

export function Screen({
  children,
  scroll = true,
  className = ""
}: {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
}) {
  if (!scroll) {
    return <SafeAreaView className={`flex-1 bg-surface ${className}`}>{children}</SafeAreaView>;
  }

  return (
    <SafeAreaView className={`flex-1 bg-surface ${className}`}>
      <ScrollView contentContainerClassName="px-4 pb-28 pt-4" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <View className={`mb-4 ${className}`}>{children}</View>;
}
