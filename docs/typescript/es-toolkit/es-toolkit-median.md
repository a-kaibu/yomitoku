---
title: "中央値を、並べ替えた真ん中の値から求める"
description: "es-toolkit の median。数の配列を並べ替えて、真ん中の値を返す。個数が偶数なら中央の 2 つの平均を返す。空なら NaN を返す。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/math/median.ts
lines: [23, 36]
function: "median"
difficulty: 2
format: 2
tags: [数値計算, ソート, 防御的プログラミング]
---

## ひとことで

`median(nums)` は、数の配列の中央値を返す関数です。中央値とは、小さい順に並べたときの真ん中の値です。個数が奇数なら真ん中の 1 つ、偶数なら真ん中の 2 つの平均になります。平均値と違い、極端に大きな値があっても影響を受けにくいのが特徴です。

```ts
median([3, 1, 2])     // 2
median([4, 1, 3, 2])  // 2.5（真ん中の 2 と 3 の平均）
median([])            // NaN
```

## コード

```ts:line-numbers=23
export function median(nums: readonly number[]): number {
  if (nums.length === 0) {
    return NaN;
  }

  const sorted = nums.slice().sort((a, b) => a - b);
  const middleIndex = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middleIndex - 1] + sorted[middleIndex]) / 2;
  } else {
    return sorted[middleIndex];
  }
}
```

## 前提知識

- **中央値と平均値**: 平均値は全部の合計を個数で割った値です。中央値は並べたときの真ん中です。外れ値（極端な値）に強いのは中央値です。
- **`slice()`**: 配列の全体をコピーして、新しい配列を作ります。元の配列を並べ替えずに済みます。
- **`sort((a, b) => a - b)`**: 数の配列を小さい順に並べる書き方です。文字列として比べる既定の並べ替えでは、`10` が `2` より前に来てしまうので、この比較関数が必要です。
- **`%`（剰余）**: 割った余りです。`sorted.length % 2 === 0` は、個数が偶数かどうかを表します。
- **`NaN`**: 「数ではない」を表す値です。空の配列には中央値が無いので、この値を返します。

## 何をしているか

### 1. 空なら NaN を返す

```ts:line-numbers=24
  if (nums.length === 0) {
    return NaN;
  }
```

要素が無ければ、真ん中の値がないので `NaN` を返します。

### 2. コピーして小さい順に並べる

```ts:line-numbers=28
  const sorted = nums.slice().sort((a, b) => a - b);
  const middleIndex = Math.floor(sorted.length / 2);
```

元の配列を壊さないように `slice` でコピーし、数として比べながら並べます。真ん中の位置は、長さの半分を切り捨てた番号です。

### 3. 個数の偶奇で求め方を変える

```ts:line-numbers=31
  if (sorted.length % 2 === 0) {
    return (sorted[middleIndex - 1] + sorted[middleIndex]) / 2;
  } else {
    return sorted[middleIndex];
  }
```

偶数なら、真ん中の 2 つを足して 2 で割ります。奇数なら、真ん中の 1 つをそのまま返します。

## ここがすごい

- **元の配列を守る**: `slice` でコピーしてから並べるので、呼び出し元の配列の順番は変わりません。
- **比較関数を明示する**: `a - b` で数として並べることを、コードで明確にしています。既定の並べ替えの落とし穴を避けています。
- **真ん中の位置の計算が 1 つ**: `Math.floor(length / 2)` で、奇数と偶数の両方の真ん中を求めています。その後の分岐は、偶奇だけです。
- **空の場合を先に扱う**: 空配列で添字が範囲外になる前に、`NaN` を返します。エラーにせずに、結果の意味を値で表しています。

## まとめ

- 中央値は、並べ替えてから真ん中を取ると求まる。
- 数の並べ替えには、必ず比較関数 `(a, b) => a - b` を渡す。
- 偶数個のときは真ん中 2 つの平均になる、という規則を分岐で書く。
- 元の配列を変えないよう、コピーしてから並べ替えるのが安全。
