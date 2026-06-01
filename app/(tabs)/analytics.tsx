import { useCallback, useState } from "react";
import { Dimensions, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import { ChartCard, EmptyChart } from "@/components/ChartCard";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { StatCard } from "@/components/StatCard";
import { getAnalyticsData } from "@/db/stats";
import { currentMonthText, formatCurrency } from "@/utils/format";

type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>;

const chartWidth = Dimensions.get("window").width - 72;

export default function AnalyticsScreen() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [month] = useState(currentMonthText());

  useFocusEffect(
    useCallback(() => {
      getAnalyticsData(month).then(setData);
    }, [month])
  );

  const hasExpenseTrend = Boolean(data?.monthlyExpenseTrend.some((item) => item.value > 0));
  const hasCategoryData = Boolean(data?.categoryRanking.some((item) => item.amount > 0));
  const hasIncomeExpense = Boolean(data?.incomeVsExpense.some((item) => item.income > 0 || item.expense > 0));

  return (
    <Screen>
      <PageTitle title="数据分析" subtitle={`${month} · 本地统计`} />

      <View className="mb-4 flex-row flex-wrap justify-between gap-y-3">
        <StatCard label="平均每日支出" value={formatCurrency(data?.summary.averageDailyExpense ?? 0)} tone="slate" />
        <StatCard label="最大单笔消费" value={formatCurrency(data?.summary.maxExpense ?? 0)} tone="red" />
        <StatCard label="交易总数" value={`${data?.summary.transactionTotal ?? 0} 笔`} tone="blue" />
        <StatCard label="收入 / 支出" value={`${data?.summary.incomeCount ?? 0}/${data?.summary.expenseCount ?? 0}`} tone="green" />
      </View>

      <ChartCard title="月度支出趋势">
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

      <ChartCard title="收入 vs 支出">
        {hasIncomeExpense ? (
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

      <ChartCard title="分类支出排行">
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
                  <Text className="text-xs text-slate-500">总支出</Text>
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

      <ChartCard title="支付方式占比">
        {(data?.paymentMethodShare.length ?? 0) > 0 ? (
          data?.paymentMethodShare.map((item) => (
            <RankBar key={item.name} label={item.name} amount={item.amount} color="#2563eb" max={data?.paymentMethodShare[0]?.amount ?? 1} />
          ))
        ) : (
          <EmptyChart />
        )}
      </ChartCard>
    </Screen>
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
