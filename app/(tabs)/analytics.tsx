import { useCallback, useState } from "react";
import { Dimensions, Pressable, Switch, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import { ChartCard, EmptyChart } from "@/components/ChartCard";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { StatCard } from "@/components/StatCard";
import { getAnalyticsData } from "@/db/stats";
import { currentMonthText, formatCurrency } from "@/utils/format";

type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>;
type Mode = "expense" | "flow" | "income";

const chartWidth = Dimensions.get("window").width - 72;

export default function AnalyticsScreen() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [month] = useState(currentMonthText());
  const [mode, setMode] = useState<Mode>("expense");
  const [includeMoneyFlow, setIncludeMoneyFlow] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getAnalyticsData(month, includeMoneyFlow).then(setData);
    }, [includeMoneyFlow, month])
  );

  return (
    <Screen>
      <PageTitle title="分析" subtitle={`${month} · 消费、资金流动、收入分开看`} />

      <View className="mb-4 flex-row rounded-card bg-white p-2">
        <ModeButton label="消费分析" active={mode === "expense"} onPress={() => setMode("expense")} />
        <ModeButton label="资金流动" active={mode === "flow"} onPress={() => setMode("flow")} />
        <ModeButton label="收入分析" active={mode === "income"} onPress={() => setMode("income")} />
      </View>

      {mode === "expense" ? (
        <ExpenseAnalysis data={data} includeMoneyFlow={includeMoneyFlow} onToggleInclude={setIncludeMoneyFlow} />
      ) : null}
      {mode === "flow" ? <FlowAnalysis data={data} /> : null}
      {mode === "income" ? <IncomeAnalysis data={data} /> : null}
    </Screen>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable className={`flex-1 rounded-2xl py-2 ${active ? "bg-blue-600" : "bg-white"}`} onPress={onPress}>
      <Text className={`text-center text-xs font-semibold ${active ? "text-white" : "text-slate-600"}`}>{label}</Text>
    </Pressable>
  );
}

function ExpenseAnalysis({
  data,
  includeMoneyFlow,
  onToggleInclude
}: {
  data: AnalyticsData | null;
  includeMoneyFlow: boolean;
  onToggleInclude: (value: boolean) => void;
}) {
  const hasExpenseTrend = Boolean(data?.monthlyExpenseTrend.some((item) => item.value > 0));
  const hasCategoryData = Boolean(data?.categoryRanking.some((item) => item.amount > 0));

  return (
    <>
      <View className="mb-4 rounded-card bg-white p-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="mr-4 flex-1">
            <Text className="text-sm font-semibold text-slate-900">包含资金流动</Text>
            <Text className="mt-1 text-xs text-slate-500">默认关闭，消费分析不包含转账、投资和账户转移</Text>
          </View>
          <Switch value={includeMoneyFlow} onValueChange={onToggleInclude} trackColor={{ false: "#cbd5e1", true: "#93c5fd" }} thumbColor={includeMoneyFlow ? "#2563eb" : "#f8fafc"} />
        </View>
      </View>

      <View className="mb-4 flex-row flex-wrap justify-between gap-y-3">
        <StatCard label="消费总额" value={formatCurrency(data?.summary.totalExpense ?? 0)} tone="red" />
        <StatCard label="平均每日" value={formatCurrency(data?.summary.averageDailyExpense ?? 0)} tone="slate" />
        <StatCard label="最大单笔" value={formatCurrency(data?.summary.maxExpense ?? 0)} tone="red" />
        <StatCard label="消费笔数" value={`${data?.summary.expenseCount ?? 0} 笔`} tone="blue" />
      </View>

      <ChartCard title="月度消费趋势">
        {hasExpenseTrend ? (
          <LineChart
            areaChart
            curved
            width={chartWidth}
            height={180}
            data={data?.monthlyExpenseTrend ?? []}
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

      <ChartCard title="分类消费排行">
        {hasCategoryData ? (
          <View className="flex-row items-center">
            <PieChart
              donut
              radius={70}
              innerRadius={42}
              data={(data?.categoryRanking ?? []).map((item) => ({
                value: item.amount,
                color: item.color,
                text: item.name
              }))}
              centerLabelComponent={() => (
                <View className="items-center">
                  <Text className="text-base font-bold text-slate-900">{formatCurrency(data?.summary.totalExpense ?? 0)}</Text>
                  <Text className="text-xs text-slate-500">消费</Text>
                </View>
              )}
            />
            <View className="ml-5 flex-1">
              {(data?.categoryRanking ?? []).slice(0, 5).map((item) => (
                <RankBar key={item.name} label={item.name} amount={item.amount} color={item.color} max={data?.categoryRanking[0]?.amount ?? 1} />
              ))}
            </View>
          </View>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title="商家消费排行">
        {(data?.merchantRanking.length ?? 0) > 0 ? (
          data?.merchantRanking.map((item) => (
            <RankBar key={item.name} label={item.name} amount={item.amount} color="#ff4d4f" max={data?.merchantRanking[0]?.amount ?? 1} />
          ))
        ) : (
          <EmptyChart />
        )}
      </ChartCard>
    </>
  );
}

function FlowAnalysis({ data }: { data: AnalyticsData | null }) {
  return (
    <>
      <View className="mb-4 flex-row flex-wrap justify-between gap-y-3">
        <StatCard label="资金流动" value={formatCurrency(data?.summary.totalMoneyFlow ?? 0)} tone="blue" />
        <StatCard label="转账" value={formatCurrency(data?.summary.transferTotal ?? 0)} tone="slate" />
        <StatCard label="投资" value={formatCurrency(data?.summary.investmentTotal ?? 0)} tone="blue" />
        <StatCard label="消费外记录" value={`${(data?.summary.transferTotal ?? 0) > 0 || (data?.summary.investmentTotal ?? 0) > 0 ? "已分离" : "暂无"}`} tone="green" />
      </View>

      <ChartCard title="近 6 月收入 vs 消费">
        {(data?.incomeVsExpense.some((item) => item.income > 0 || item.expense > 0) ?? false) ? (
          <BarChart
            width={chartWidth}
            height={190}
            barWidth={18}
            spacing={22}
            data={(data?.incomeVsExpense ?? []).flatMap((item) => [
              { value: item.income, label: item.label, frontColor: "#22c55e" },
              { value: item.expense, label: "", frontColor: "#2563eb" }
            ])}
            yAxisColor="#e2e8f0"
            xAxisColor="#e2e8f0"
            yAxisTextStyle={{ color: "#64748b", fontSize: 10 }}
            xAxisLabelTextStyle={{ color: "#64748b", fontSize: 10 }}
          />
        ) : (
          <EmptyChart />
        )}
      </ChartCard>
    </>
  );
}

function IncomeAnalysis({ data }: { data: AnalyticsData | null }) {
  return (
    <>
      <View className="mb-4 flex-row flex-wrap justify-between gap-y-3">
        <StatCard label="收入总额" value={formatCurrency(data?.summary.totalIncome ?? 0)} tone="green" />
        <StatCard label="收入笔数" value={`${data?.summary.incomeCount ?? 0} 笔`} tone="blue" />
        <StatCard label="退款笔数" value={`${data?.summary.refundCount ?? 0} 笔`} tone="green" />
        <StatCard label="消费总额" value={formatCurrency(data?.summary.totalExpense ?? 0)} tone="red" />
      </View>

      <ChartCard title="近 6 月收入 vs 消费">
        {(data?.incomeVsExpense.some((item) => item.income > 0 || item.expense > 0) ?? false) ? (
          <BarChart
            width={chartWidth}
            height={190}
            barWidth={18}
            spacing={22}
            data={(data?.incomeVsExpense ?? []).flatMap((item) => [
              { value: item.income, label: item.label, frontColor: "#22c55e" },
              { value: item.expense, label: "", frontColor: "#ff4d4f" }
            ])}
            yAxisColor="#e2e8f0"
            xAxisColor="#e2e8f0"
            yAxisTextStyle={{ color: "#64748b", fontSize: 10 }}
            xAxisLabelTextStyle={{ color: "#64748b", fontSize: 10 }}
          />
        ) : (
          <EmptyChart />
        )}
      </ChartCard>
    </>
  );
}

function RankBar({ label, amount, color, max }: { label: string; amount: number; color: string; max: number }) {
  return (
    <View className="mb-3">
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-sm font-medium text-slate-800">{label}</Text>
        <Text className="text-sm font-semibold text-slate-900">{formatCurrency(amount)}</Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-slate-100">
        <View className="h-2 rounded-full" style={{ width: `${Math.max(8, (amount / max) * 100)}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}
