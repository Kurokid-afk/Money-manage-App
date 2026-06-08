import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import type { Category, TransactionType } from "@/types";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { TransactionForm } from "@/components/TransactionForm";
import { getCategories } from "@/db/categories";
import { getSettings } from "@/db/settings";
import { createTransaction } from "@/db/transactions";
import type { Settings } from "@/types";

export default function AddScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const params = useLocalSearchParams<{ type?: TransactionType }>();
  const initialType = params.type && ["expense", "income", "transfer", "investment", "refund", "fee"].includes(params.type) ? params.type : undefined;

  useFocusEffect(
    useCallback(() => {
      Promise.all([getCategories(), getSettings()]).then(([nextCategories, nextSettings]) => {
        setCategories(nextCategories);
        setSettings(nextSettings);
      });
    }, [])
  );

  return (
    <Screen>
      <PageTitle title="添加记录" subtitle="手动添加收入、支出、转账或退款" />
      <TransactionForm
        categories={categories}
        defaultCurrency={settings?.defaultCurrency}
        defaultPaymentMethod={settings?.defaultPaymentMethod}
        initialType={initialType}
        submitLabel="保存"
        onSubmit={async (input) => {
          const settings = await getSettings();
          await createTransaction(
            {
              ...input,
              source: input.source || "manual"
            },
            {
              autoCategoryEnabled: settings.autoCategoryEnabled === 1
            }
          );
          Alert.alert("保存成功", "记录已写入本地 SQLite", [
            {
              text: "查看记录",
              onPress: () => router.push("/transactions")
            },
            {
              text: "继续添加"
            }
          ]);
        }}
      />
    </Screen>
  );
}
