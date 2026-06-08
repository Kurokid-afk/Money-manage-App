# MoneyTrack

MoneyTrack 是一个 Android 本地个人记账 App。数据保存在手机本地 SQLite，不需要服务器、登录、云同步或网页后台。当前按私人本地使用场景设计，重点区分消费、收入、转账、投资、退款和手续费。

## APK 下载

直接下载 Android 安装包：

[下载 MoneyTrack APK](https://github.com/Kurokid-afk/Money-manage-App/raw/main/releases/MoneyTrack-1.0.1-arm64-release.apk)

当前仓库代码已经升级到 1.1.0，下载链接仍指向现有的 1.0.1 APK。下次本地重新打包后，再替换为新的 1.1.0 安装包。

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
date,time,type,amount,currency,category,merchant,payment_method,account,note,tags,source,raw_text,count_in_expense
```

3. 如果 GPT 输出的 CSV 表头不完全标准，App 会尽量兜底识别常见中文表头、无表头标准顺序、金额符号、正负号和收入/支出/转账/投资/退款类型。
4. 在 App 的中间加号里选择「导入账单」，按「选择文件 → 预览与匹配 → 确认导入」三步完成。
5. App 会预览每一行：
   - 绿色：正常
   - 黄色：疑似重复
   - 红色：错误
   - 灰色：完全重复，默认跳过
6. 点击「确认导入」后写入手机本地 SQLite。

导入页提供「只导入 CNY」「自动分类」「重复检查」「转账不计入消费」「基金/理财单独统计」开关。转账、提现、充值、余额宝、零钱通、基金买入/赎回和理财通默认进入资金流动统计，不计入消费支出。

支持的记录类型：

- `expense`：真正花掉的钱，默认计入消费支出
- `income`：工资、收益等收入
- `transfer`：转账、提现、充值等资金流动，默认不计入消费支出
- `investment`：基金、理财、余额宝、零钱通等投资流动，默认不计入消费支出
- `refund`：退款，按收入方向展示，不计入消费支出
- `fee`：手续费，默认计入消费支出

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
