import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PieChart } from "react-native-gifted-charts";
import { ChartCard, EmptyChart } from "@/components/ChartCard";
import { PageTitle } from "@/components/PageTitle";
import { Screen, Section } from "@/components/Screen";
import { StatCard } from "@/components/StatCard";
import { TransactionCard } from "@/components/TransactionCard";
import { getDashboardData } from "@/db/stats";
import { currentMonthText, formatCurrency, monthLabel, shiftMonth } from "@/utils/format";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export default function DashboardScreen() {
  const [month, setMonth] = useState(currentMonthText());
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(async () => {
    setData(await getDashboardData(month));
  }, [month]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const hasCategoryData = Boolean(data?.categoryBreakdown.some((item) => item.value > 0));

  return (
    <Screen>
      <View className="mb-4 flex-row items-center justify-between">
        <PageTitle title="MoneyTrack" subtitle="消费、收入和资金流动一眼分清" />
        <View className="flex-row items-center gap-2">
          <MonthButton icon="chevron-back" onPress={() => setMonth((current) => shiftMonth(current, -1))} />
          <Text className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-800">{monthLabel(month)}</Text>
          <MonthButton icon="chevron-forward" onPress={() => setMonth((current) => shiftMonth(current, 1))} />
        </View>
      </View>

      <Section>
        <View className="rounded-[24px] bg-blue-600 p-5 shadow-sm">
          <Text className="text-sm font-semibold text-blue-100">本月消费</Text>
          <Text className="mt-2 text-4xl font-bold text-white">{formatCurrency(data?.stats.expense ?? 0)}</Text>
          <Text className="mt-3 text-sm text-blue-100">只包含真正花掉的钱，默认不含转账和投资</Text>
        </View>
      </Section>

      <Section>
        <View className="flex-row flex-wrap justify-between gap-y-3">
          <StatCard label="本月收入" value={formatCurrency(data?.stats.income ?? 0)} tone="green" />
          <StatCard label="净流出" value={formatCurrency(data?.stats.netOutflow ?? 0)} tone="red" />
          <StatCard label="资金流动" value={formatCurrency(data?.stats.moneyFlow ?? 0)} tone="blue" />
          <StatCard label="最近交易" value={`${Math.min(data?.recentTransactions.length ?? 0, 3)} 笔`} tone="slate" />
        </View>
      </Section>

      <Section>
        <View className="flex-row gap-3">
          <QuickAction icon="receipt-outline" label="看明细" onPress={() => router.push("/transactions")} />
          <QuickAction icon="pie-chart-outline" label="看分析" onPress={() => router.push("/analytics")} />
        </View>
      </Section>

      <ChartCard title="最近 3 笔交易">
        {(data?.recentTransactions.length ?? 0) > 0 ? (
          data?.recentTransactions.slice(0, 3).map((transaction) => <TransactionCard key={transaction.id} transaction={transaction} />)
        ) : (
          <EmptyChart label="暂无交易记录" />
        )}
      </ChartCard>

      <ChartCard title="本月分类占比">
        {hasCategoryData ? (
          <View className="flex-row items-center">
            <PieChart
              donut
              radius={70}
              innerRadius={42}
              data={(data?.categoryBreakdown ?? []).map((item) => ({
                value: item.value,
                color: item.color,
                text: item.name
              }))}
              centerLabelComponent={() => (
                <View className="items-center">
                  <Text className="text-base font-bold text-slate-900">{formatCurrency(data?.stats.expense ?? 0)}</Text>
                  <Text className="text-xs text-slate-500">消费</Text>
                </View>
              )}
            />
            <View className="ml-5 flex-1">
              {(data?.categoryBreakdown ?? []).slice(0, 5).map((item) => (
                <View key={item.name} className="mb-2 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <Text className="text-sm text-slate-700">{item.name}</Text>
                  </View>
                  <Text className="text-sm font-semibold text-slate-900">{formatCurrency(item.value)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>
    </Screen>
  );
}

function MonthButton({ icon, onPress }: { icon: "chevron-back" | "chevron-forward"; onPress: () => void }) {
  return (
    <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-white" onPress={onPress}>
      <Ionicons name={icon} size={18} color="#334155" />
    </Pressable>
  );
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-4" onPress={onPress}>
      <Ionicons name={icon} size={18} color="#2563eb" />
      <Text className="text-sm font-semibold text-slate-800">{label}</Text>
    </Pressable>
  );
}
