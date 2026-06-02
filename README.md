# MoneyTrack

MoneyTrack 是一个 Android 本地个人记账 App。数据保存在手机本地 SQLite，不需要服务器、登录、云同步或网页后台。当前按私人本地使用场景设计，金额统一按 CNY 记录。

## APK 下载

直接下载 Android 安装包：

[下载 MoneyTrack APK](https://github.com/Kurokid-afk/Money-manage-App/raw/main/releases/MoneyTrack-1.0.1-arm64-release.apk)

## 技术栈

- React Native + Expo + Expo Router
- TypeScript
- NativeWind / Tailwind 风格
- expo-sqlite 本地 SQLite
- expo-document-picker 选择 CSV
- expo-file-system 读取和导出 CSV
- papaparse 解析 CSV
- react-native-gifted-charts + react-native-svg 图表

## 安装依赖

```bash
pnpm install
```

如果你没有 pnpm，也可以用：

```bash
npm install
```

## 运行开发环境

```bash
pnpm start
```

然后用 Expo Go 扫码，或运行：

```bash
pnpm android
```

## 初始化本地 SQLite

App 首次打开时会自动创建并初始化本地 SQLite 数据库：

- `transactions`
- `categories`
- `settings`
- `import_batches`

同时会写入默认分类和默认设置。你不需要手动执行数据库命令。

## 导入 CSV

1. 把账单截图交给 GPT 分析，让 GPT 输出 CSV。
2. 推荐 CSV 表头是：

```csv
date,time,type,amount,currency,category,merchant,payment_method,account,note,tags,source,raw_text
```

3. 如果 GPT 输出的 CSV 表头不完全标准，App 会尽量兜底识别常见中文表头、无表头标准顺序、金额符号、正负号和收入/支出中文类型。
4. 在 App 的「CSV 导入」页点击「选择 CSV 文件」。
5. App 会预览每一行：
   - 绿色：正常
   - 黄色：疑似重复
   - 红色：错误
   - 灰色：完全重复，默认跳过
6. 点击「确认导入」后写入手机本地 SQLite。

导入时货币统一保存为 CNY；如果 CSV 中出现 AUD、USD 或其他币种字段，也会按 CNY 记账，不做汇率换算。分类里包含「存钱」，CSV 中出现 saving、deposit、储蓄、存款、存钱、理财等关键词时会自动归到这个去向。

示例文件：`sample_transactions.csv`。

## 打包 Android APK

Expo 默认面向商店发布时更常生成 AAB。直接安装到 Android 手机或模拟器时需要 APK。本项目已在 `eas.json` 配置：

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

安装 EAS CLI 并登录：

```bash
pnpm dlx eas-cli login
```

构建 APK：

```bash
pnpm build:apk
```

或直接：

```bash
pnpm dlx eas-cli build -p android --profile preview
```

构建完成后，EAS 会给出 APK 下载链接。下载 APK 后即可安装到 Android 手机。

官方参考：

- Expo APK 构建：https://docs.expo.dev/build-reference/apk/
- EAS Build：https://docs.expo.dev/build/
- expo-sqlite：https://docs.expo.dev/versions/latest/sdk/sqlite/

## 把 APK 安装到手机

方式一：手机直接打开 EAS 提供的 APK 下载链接并安装。

方式二：用 adb 安装：

```bash
adb install path/to/MoneyTrack.apk
```

如果手机提示无法安装未知来源应用，需要在 Android 设置里允许当前浏览器或文件管理器安装未知来源应用。

## 离线使用

APK 安装后，App 的记账、CSV 导入、分类、去重、统计和图表都在本地完成。除非你主动使用 EAS 构建或下载 APK，日常使用不需要联网。
