import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import type { CsvPreviewRow } from "@/types";
import { CsvPreviewList } from "@/components/CsvPreviewList";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { buildCsvPreview, confirmCsvImport } from "@/services/importService";
import { previewSummary } from "@/utils/csv";

export default function ImportScreen() {
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [rows, setRows] = useState<CsvPreviewRow[]>([]);
  const [loading, setLoading] = useState(false);

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
      const preview = await buildCsvPreview(asset.name ?? "transactions.csv", content);
      setFileName(preview.fileName);
      setFileSize(asset.size ?? null);
      setRows(preview.rows);
    } catch (error) {
      Alert.alert("导入失败", error instanceof Error ? error.message : "无法读取 CSV 文件");
    } finally {
      setLoading(false);
    }
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
      const result = await confirmCsvImport(fileName || "transactions.csv", rows);
      Alert.alert(
        "导入完成",
        `成功导入 ${result.importedRows} 条\n跳过重复 ${result.skippedRows} 条\n错误 ${result.errorRows} 条\n疑似重复 ${result.suspectedRows} 条`
      );
      setRows([]);
      setFileName("");
      setFileSize(null);
    } catch (error) {
      Alert.alert("导入失败", error instanceof Error ? error.message : "写入 SQLite 失败");
    } finally {
      setLoading(false);
    }
  }

  const summary = previewSummary(rows);

  return (
    <Screen>
      <PageTitle title="CSV 导入" subtitle="选择 GPT 输出的标准 CSV，本地解析并写入 SQLite" />

      <Pressable className="mb-4 items-center rounded-[28px] border border-dashed border-blue-200 bg-white px-5 py-8" onPress={pickCsv}>
        <View className="h-14 w-14 items-center justify-center rounded-full bg-blue-600">
          <Ionicons name="cloud-upload-outline" size={30} color="#ffffff" />
        </View>
        <Text className="mt-4 text-lg font-bold text-slate-950">{loading ? "处理中..." : "选择 CSV 文件"}</Text>
        <Text className="mt-1 text-sm text-slate-500">支持标准表头，建议小于 10MB</Text>
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

      {rows.length > 0 ? (
        <>
          <View className="mb-4 flex-row flex-wrap gap-2">
            <SummaryBadge label="正常" value={summary.importableRows} color="emerald" />
            <SummaryBadge label="疑似重复" value={summary.suspectedRows} color="amber" />
            <SummaryBadge label="错误" value={summary.errorRows} color="red" />
            <SummaryBadge label="跳过" value={summary.duplicateRows} color="slate" />
          </View>

          <Text className="mb-3 text-base font-semibold text-slate-900">导入预览</Text>
          <CsvPreviewList rows={rows} onToggle={toggleRow} />

          <Pressable className={`mt-2 rounded-2xl py-4 ${loading ? "bg-blue-300" : "bg-blue-600"}`} disabled={loading} onPress={confirmImport}>
            <Text className="text-center text-base font-semibold text-white">{loading ? "导入中..." : `确认导入（${summary.importableRows + rows.filter((row) => row.status === "suspected" && row.selected).length} 条）`}</Text>
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

function SummaryBadge({ label, value, color }: { label: string; value: number; color: "emerald" | "amber" | "red" | "slate" }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-600"
  };

  return (
    <View className={`rounded-2xl px-3 py-2 ${styles[color]}`}>
      <Text className={`text-xs font-semibold ${styles[color]}`}>
        {label} {value}
      </Text>
    </View>
  );
}
