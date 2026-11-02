---
title: "小数の「倍数チェック」で誤差を許す許容範囲"
description: "0.07 の倍数かどうかを浮動小数点で判定するための関数。割り算の結果が整数からどれくらいずれたかを返し、誤差の範囲内なら 0 とみなす。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [327, 334]
function: "floatSafeRemainder"
difficulty: 3
format: 2
tags: [数値計算, 防御的プログラミング]
---

## ひとことで

`floatSafeRemainder(val, step)` は、`val` が `step` の倍数かどうかを、**小数の誤差を考えて** 判定するための値を返します。倍数なら `0`、そうでなければ整数からのずれを返します。

```ts
floatSafeRemainder(0.3, 0.1)  // 0（0.3 は 0.1 の 3 倍）
floatSafeRemainder(0.35, 0.1) // 0.5 くらい（倍数ではない）
```

JavaScript の小数は 2 進数で表されるため、`0.1 * 3` のような計算が `0.30000000000000004` のように、わずかにずれることがあります。`val % step === 0` のような単純な判定では、正しい倍数が倍数と認められないことがあります。この関数は、そのずれを許す範囲を計算して判定しています。

## コード

::: code-group

```ts:line-numbers=327 [日本語訳]
export function floatSafeRemainder(val: number, step: number): number {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  // // `val` と `step` はそれぞれ倍精度に丸められ、その割り算がさらに丸められるため、真の倍数でも商が整数から最大 1.5 倍の epsilon ずれうる。1 倍の許容量では 2.03 を 0.07 の倍数と判定できなかったので、余裕を持たせて 4 倍にしている。
  const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
  return ratio - roundedRatio;
}
```

```ts:line-numbers=327 [原文]
export function floatSafeRemainder(val: number, step: number): number {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  // `val` and `step` each round to a double before the division rounds again, so a true decimal multiple's quotient can sit up to 1.5 of these scaled epsilons from the integer. A 1x tolerance therefore rejected 2.03 as a multiple of 0.07; 4x covers the worst case with margin.
  const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
  return ratio - roundedRatio;
}
```

:::

## 前提知識

- **浮動小数点の誤差**: 小数は 2 進数の有限の桁で近似されるため、10 進数で正確な値でも、わずかにずれることがあります。
- **`Number.EPSILON`**: 1 と、その次に大きい浮動小数点数との差です。数値の精度の目安になります。
- **`Math.round`**: 最も近い整数に丸めます。
- **`Math.max` と `Math.abs`**: 大きいほうを選ぶ関数と、絶対値を返す関数です。

## 何をしているか

### 1. 割り算して、最も近い整数を求める

```ts:line-numbers=328
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
```

`ratio` は `val` が `step` の何倍かを表す値です。`roundedRatio` はそれに最も近い整数です。

### 2. 許容誤差を決める

```ts:line-numbers=330
  // `val` and `step` each round to a double before the division rounds again, so a true decimal multiple's quotient can sit up to 1.5 of these scaled epsilons from the integer. A 1x tolerance therefore rejected 2.03 as a multiple of 0.07; 4x covers the worst case with margin.
  const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
```

誤差の許容量は、`EPSILON` に倍率をかけたものです。`Math.max(Math.abs(ratio), 1)` で、比率が大きいときは許容量も大きくなるようにしています。

### 3. 誤差の範囲なら 0、そうでなければずれを返す

```ts:line-numbers=332
  if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
  return ratio - roundedRatio;
```

整数からのずれが許容量より小さければ、倍数とみなして `0` を返します。そうでなければ、ずれの値をそのまま返します。

`0.35` を `0.1` で割ると `3.5` くらいになり、最も近い整数 `4` からのずれは約 `-0.5` です。許容量より大きいので、そのずれが返されます。

## ここがすごい

- **誤差の大きさを式で決める**: 固定の数値で許容誤差を決めると、大きな数や小さな数でうまくいかなくなります。`EPSILON` を比率に応じてスケールすることで、どの大きさの値でも同じ基準で判定できます。
- **コメントに失敗の理由が残っている**: 許容量の上のコメントには、以前は 1 倍の許容量で `2.03` を `0.07` の倍数と判定できなかったこと、そして 4 倍にして余裕を持たせたことが書かれています。実際に起きた事例を基にした、よい判断の記録です。
- **判定と値の両方を 1 つの関数で返す**: 戻り値が `0` なら倍数、そうでなければ大きさも分かるので、呼び出し側は、エラーメッセージに「どれくらい外れたか」を含めることもできます。

## まとめ

- 小数の倍数判定は、`%` ではなく、許容誤差を使って判定する。
- 許容誤差は固定値ではなく、`EPSILON` を値の大きさに合わせてスケールする。
- コメントに失敗例と修正の理由を残すと、あとから調整するときに役立つ。
