import { useCallback, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LineChart, PieChart } from "react-native-gifted-charts";
import { ChartCard, EmptyChart } from "@/components/ChartCard";
import { PageTitle } from "@/components/PageTitle";
import { Screen, Section } from "@/components/Screen";
import { StatCard } from "@/components/StatCard";
import { TransactionCard } from "@/components/TransactionCard";
import { getDashboardData } from "@/db/stats";
import { formatCurrency, monthLabel, shiftMonth, currentMonthText } from "@/utils/format";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

const chartWidth = Dimensions.get("window").width - 72;

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
  const hasTrendData = Boolean(data?.recent7Days.some((item) => item.value > 0));

  return (
    <Screen>
      <View className="mb-4 flex-row items-center justify-between">
        <PageTitle title="MoneyTrack" subtitle="本地个人记账" />
        <View className="flex-row items-center gap-2">
          <MonthButton icon="chevron-back" onPress={() => setMonth((current) => shiftMonth(current, -1))} />
          <Text className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-800">{monthLabel(month)}</Text>
          <MonthButton icon="chevron-forward" onPress={() => setMonth((current) => shiftMonth(current, 1))} />
        </View>
      </View>

      <Section>
        <View className="overflow-hidden rounded-[28px] bg-blue-600 p-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-blue-100">本月结余</Text>
            <Ionicons name="eye-outline" color="#dbeafe" size={20} />
          </View>
          <Text className="mt-3 text-4xl font-bold text-white">{formatCurrency(data?.stats.balance ?? 0)}</Text>
          <View className="mt-4 flex-row justify-between">
            <Text className="text-sm font-semibold text-blue-100">收入 {formatCurrency(data?.stats.income ?? 0)}</Text>
            <Text className="text-sm font-semibold text-blue-100">支出 {formatCurrency(data?.stats.expense ?? 0)}</Text>
          </View>
        </View>
      </Section>

      <Section>
        <View className="flex-row flex-wrap justify-between gap-y-3">
          <StatCard label="本月支出" value={formatCurrency(data?.stats.expense ?? 0)} tone="red" />
          <StatCard label="本月收入" value={formatCurrency(data?.stats.income ?? 0)} tone="green" />
          <StatCard label="今日支出" value={formatCurrency(data?.stats.todayExpense ?? 0)} tone="slate" />
          <StatCard label="最近记录" value={`${data?.recentTransactions.length ?? 0} 笔`} tone="blue" />
        </View>
      </Section>

      <Section>
        <View className="flex-row gap-3">
          <QuickAction icon="add" label="手动记账" onPress={() => router.push("/add")} />
          <QuickAction icon="cloud-upload-outline" label="导入 CSV" onPress={() => router.push("/import")} />
        </View>
      </Section>

      <ChartCard title="支出分类占比">
        {hasCategoryData ? (
          <View className="flex-row items-center">
            <PieChart
              donut
              radius={72}
              innerRadius={44}
              data={(data?.categoryBreakdown ?? []).map((item) => ({
                value: item.value,
                color: item.color,
                text: item.name
              }))}
              centerLabelComponent={() => (
                <View className="items-center">
                  <Text className="text-base font-bold text-slate-900">{formatCurrency(data?.stats.expense ?? 0)}</Text>
                  <Text className="text-xs text-slate-500">总支出</Text>
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

      <ChartCard title="最近 7 天支出趋势">
        {hasTrendData ? (
          <LineChart
            areaChart
            curved
            width={chartWidth}
            height={180}
            data={data?.recent7Days ?? []}
            color="#2563eb"
            startFillColor="#dbeafe"
            endFillColor="#ffffff"
            dataPointsColor="#2563eb"
            yAxisColor="#e2e8f0"
            xAxisColor="#e2e8f0"
            yAxisTextStyle={{ color: "#64748b", fontSize: 10 }}
            xAxisLabelTextStyle={{ color: "#64748b", fontSize: 10 }}
          />
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title="最近 10 条交易">
        {(data?.recentTransactions.length ?? 0) > 0 ? (
          data?.recentTransactions.map((transaction) => <TransactionCard key={transaction.id} transaction={transaction} />)
        ) : (
          <EmptyChart label="暂无交易记录" />
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
    <Pressable className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4" onPress={onPress}>
      <Ionicons name={icon} size={18} color="#ffffff" />
      <Text className="text-sm font-semibold text-white">{label}</Text>
    </Pressable>
  );
}
