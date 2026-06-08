import assert from "node:assert/strict";
import { parseCsv, rowToTransactionInput } from "../src/utils/csvFallback.ts";

function firstInput(csv) {
  const rows = parseCsv(csv);
  assert.equal(rows.length, 1);
  return rowToTransactionInput(rows[0]);
}

{
  const input = firstInput("date,time,type,amount,currency,category,merchant,payment_method\n2026-06-01,08:30,expense,18.50,AUD,,KFC,Wechat");
  assert.equal(input.date, "2026-06-01");
  assert.equal(input.time, "08:30");
  assert.equal(input.type, "expense");
  assert.equal(input.amount, "18.50");
  assert.equal(input.currency, "AUD");
  assert.equal(input.merchant, "KFC");
}

{
  const input = firstInput("日期,时间,收支,金额,商家,备注\n2026年6月2日,9:05,收入,+¥500.00,兼职,weekly pay");
  assert.equal(input.date, "2026-06-02");
  assert.equal(input.time, "09:05");
  assert.equal(input.type, "income");
  assert.equal(input.amount, "500.00");
  assert.equal(input.currency, "CNY");
}

{
  const input = firstInput("2026-06-03,12:03,支出,-¥18.50,CNY,餐饮,KFC,微信,零钱,午餐,,gpt,raw text");
  assert.equal(input.date, "2026-06-03");
  assert.equal(input.type, "expense");
  assert.equal(input.amount, "18.50");
  assert.equal(input.category, "餐饮");
  assert.equal(input.paymentMethod, "微信");
}

{
  const input = firstInput(`下面是 CSV：\n\n\`\`\`csv\n交易时间,交易类型,交易金额,交易对方,商品说明\n2026/06/04 20:10,支出,300元,储蓄账户,每周存钱\n\`\`\``);
  assert.equal(input.date, "2026-06-04");
  assert.equal(input.time, "20:10");
  assert.equal(input.amount, "300.00");
  assert.equal(input.merchant, "储蓄账户");
}

{
  const input = firstInput("Date,Amount,Description\n06/05/2026,($12.34),coffee");
  assert.equal(input.date, "2026-06-05");
  assert.equal(input.type, "expense");
  assert.equal(input.amount, "12.34");
}

console.log("CSV fallback tests passed");
