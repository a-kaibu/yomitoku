---
title: "数の配列の平均を、合計を個数で割って求める"
description: "es-toolkit の mean は、数の配列の平均を求める。合計を sum で求め、その値を個数で割るだけの、部品を組み合わせて作った関数。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/math/mean.ts
lines: [16, 18]
function: "mean"
difficulty: 1
format: 2
tags: [数値計算, イディオム]
---

## ひとことで

`mean(nums)` は、数の配列の平均を返す関数です。平均は、合計を配列の個数で割った値です。

```ts
mean([1, 2, 3, 4])  // 2.5
```

## コード

```ts:line-numbers=16
export function mean(nums: readonly number[]): number {
  return sum(nums) / nums.length;
}
```

## 前提知識

- **平均**: すべての値を足して、その個数で割った値です。例えば 1, 2, 3 の平均は、合計 6 を 3 で割った 2 です。
- **部品の再利用**: 同じ計算を何度も書かず、既にある関数を呼び出して組み立てる考え方です。
- **0 で割る問題**: 個数が 0 のとき、割り算の結果は `NaN` になります。この関数はその場合を特別扱いしていません。

## 何をしているか

### 1. 合計を求める

```ts:line-numbers=17
  return sum(nums) / nums.length;
```

`sum(nums)` で配列の合計を求めます。これは別のファイルにある `sum` 関数を呼び出しています。

### 2. 個数で割る

同じ式の `/ nums.length` が、合計を配列の個数で割る部分です。割った結果が、そのまま平均になります。

## ここがすごい

- **1 行で完結**: 合計と個数を組み合わせるだけなので、平均の定義をそのまま読めます。
- **部品を使い回す**: 合計の計算を `sum` に任せることで、同じ処理を 2 か所に書かずに済みます。`sum` の改善が、自動的に `mean` にも効きます。
- **空の配列の扱いが明確**: 個数が 0 のとき `NaN` になることが、コードから分かります。呼び出す側は、空でないかを確かめる必要があります。

## まとめ

- `mean` は、数の配列の平均を、合計を個数で割って求める。
- 合計の計算は `sum` に任せ、この関数は組み立てだけを行う。
- 空の配列では `NaN` になるので、呼び出す側で注意が必要。
