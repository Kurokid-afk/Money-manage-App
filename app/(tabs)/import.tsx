import { useMemo, useState } from "react";
import { Alert, Pressable, Switch, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import type { CsvImportOptions, CsvPreviewRow } from "@/types";
import { CsvPreviewList } from "@/components/CsvPreviewList";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { buildCsvPreview, confirmCsvImport } from "@/services/importService";
import { previewSummary } from "@/utils/csv";

type ImportStep = "pick" | "preview" | "done";

export default function ImportScreen() {
  const [step, setStep] = useState<ImportStep>("pick");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [rows, setRows] = useState<CsvPreviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Required<CsvImportOptions>>({
    onlyCny: true,
    autoCategoryEnabled: true,
    duplicateCheckEnabled: true,
    transferExcludedFromExpense: true,
    fundSeparateStats: true
  });

  async function pickCsv() {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel", "*/*"],
        copyToCacheDirectory: true
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const content = await new File(asset.uri).text();
      const preview = await buildCsvPreview(asset.name ?? "transactions.csv", content, options);
      setFileName(preview.fileName);
      setFileSize(asset.size ?? null);
      setFileContent(content);
      setRows(preview.rows);
      setStep("preview");
    } catch (error) {
      Alert.alert("导入失败", error instanceof Error ? error.message : "无法读取 CSV 文件");
    } finally {
      setLoading(false);
    }
  }

  async function rebuildPreview(nextOptions = options) {
    if (!fileContent) return;
    setLoading(true);
    try {
      const preview = await buildCsvPreview(fileName || "transactions.csv", fileContent, nextOptions);
      setRows(preview.rows);
    } finally {
      setLoading(false);
    }
  }

  function toggleOption(key: keyof Required<CsvImportOptions>) {
    const next = {
      ...options,
      [key]: !options[key]
    };
    setOptions(next);
    rebuildPreview(next);
  }

  function toggleRow(rowId: number) {
    setRows((current) =>
      current.map((row) =>
        row.rowId === rowId && row.status === "suspected"
          ? {
              ...row,
              selected: !row.selected
            }
          : row
      )
    );
  }

  async function confirmImport() {
    try {
      setLoading(true);
      const result = await confirmCsvImport(fileName || "transactions.csv", rows, options);
      Alert.alert(
        "导入完成",
        `成功导入 ${result.importedRows} 条\n跳过重复 ${result.skippedRows} 条\n错误 ${result.errorRows} 条\n疑似重复 ${result.suspectedRows} 条`
      );
      setRows([]);
      setFileName("");
      setFileSize(null);
      setFileContent("");
      setStep("done");
    } catch (error) {
      Alert.alert("导入失败", error instanceof Error ? error.message : "写入 SQLite 失败");
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => previewSummary(rows), [rows]);
  const cnyRows = rows.filter((row) => row.data.currency === "CNY").length;
  const uncategorizedRows = rows.filter((row) => !row.data.category || row.data.category === "其他").length;
  const selectedSuspected = rows.filter((row) => row.status === "suspected" && row.selected).length;
  const willImport = summary.importableRows + selectedSuspected;

  return (
    <Screen>
      <PageTitle title="导入账单" subtitle="选择文件 → 预览与匹配 → 确认导入" />
      <StepHeader step={step} />

      <Pressable className="mb-4 items-center rounded-card border border-dashed border-blue-200 bg-white px-5 py-8" onPress={pickCsv}>
        <View className="h-14 w-14 items-center justify-center rounded-full bg-blue-600">
          <Ionicons name="cloud-upload-outline" size={30} color="#ffffff" />
        </View>
        <Text className="mt-4 text-lg font-bold text-slate-950">{loading ? "处理中..." : "选择 CSV 文件"}</Text>
        <Text className="mt-1 text-sm text-slate-500">支持标准表头、中文表头和无表头兜底</Text>
      </Pressable>

      {fileName ? (
        <View className="mb-4 flex-row items-center rounded-card bg-white p-4">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
            <Ionicons name="document-text-outline" size={22} color="#2563eb" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-900">{fileName}</Text>
            <Text className="mt-1 text-xs text-slate-500">{fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : "已读取"}</Text>
          </View>
          <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
        </View>
      ) : null}

      <View className="mb-4 rounded-card bg-white p-4 shadow-sm">
        <Text className="mb-3 text-base font-semibold text-slate-900">导入规则</Text>
        <ImportSwitch title="只导入 CNY" value={options.onlyCny} onValueChange={() => toggleOption("onlyCny")} />
        <ImportSwitch title="自动分类" value={options.autoCategoryEnabled} onValueChange={() => toggleOption("autoCategoryEnabled")} />
        <ImportSwitch title="重复检查" value={options.duplicateCheckEnabled} onValueChange={() => toggleOption("duplicateCheckEnabled")} />
        <ImportSwitch title="转账不计入消费" value={options.transferExcludedFromExpense} onValueChange={() => toggleOption("transferExcludedFromExpense")} />
        <ImportSwitch title="基金/理财单独统计" value={options.fundSeparateStats} onValueChange={() => toggleOption("fundSeparateStats")} />
      </View>

      {rows.length > 0 ? (
        <>
          <View className="mb-4 flex-row flex-wrap gap-2">
            <SummaryBadge label="总记录" value={summary.totalRows} color="slate" />
            <SummaryBadge label="人民币" value={cnyRows} color="emerald" />
            <SummaryBadge label="疑似重复" value={summary.suspectedRows} color="amber" />
            <SummaryBadge label="未分类" value={uncategorizedRows} color="red" />
            <SummaryBadge label="将导入" value={willImport} color="blue" />
          </View>

          <Text className="mb-3 text-base font-semibold text-slate-900">预览与匹配</Text>
          <CsvPreviewList rows={rows} onToggle={toggleRow} />

          <Pressable className={`mt-2 rounded-2xl py-4 ${loading ? "bg-blue-300" : "bg-blue-600"}`} disabled={loading} onPress={confirmImport}>
            <Text className="text-center text-base font-semibold text-white">{loading ? "导入中..." : `确认导入（${willImport} 条）`}</Text>
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

function StepHeader({ step }: { step: ImportStep }) {
  const steps: Array<{ key: ImportStep; label: string }> = [
    { key: "pick", label: "选择文件" },
    { key: "preview", label: "预览与匹配" },
    { key: "done", label: "确认导入" }
  ];

  return (
    <View className="mb-4 flex-row rounded-card bg-white p-2">
      {steps.map((item) => (
        <View key={item.key} className={`flex-1 rounded-2xl py-2 ${item.key === step ? "bg-blue-600" : "bg-white"}`}>
          <Text className={`text-center text-xs font-semibold ${item.key === step ? "text-white" : "text-slate-500"}`}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function ImportSwitch({ title, value, onValueChange }: { title: string; value: boolean; onValueChange: () => void }) {
  return (
    <View className="mb-3 flex-row items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <Text className="text-sm font-semibold text-slate-800">{title}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: "#cbd5e1", true: "#93c5fd" }} thumbColor={value ? "#2563eb" : "#f8fafc"} />
    </View>
  );
}

function SummaryBadge({ label, value, color }: { label: string; value: number; color: "emerald" | "amber" | "red" | "slate" | "blue" }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-700"
  };

  return (
    <View className={`rounded-2xl px-3 py-2 ${styles[color]}`}>
      <Text className={`text-xs font-semibold ${styles[color]}`}>
        {label} {value}
      </Text>
    </View>
  );
}
