---
title: "NaN を一番小さい値として並べるパーセンタイル"
description: "数値の配列から p パーセンタイルを求める関数。最近順位法でインデックスを 1 回の計算で求め、比較関数の中で NaN を負の無限大に読み替えて並べている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/math/percentile.ts
lines: [26, 56]
function: "percentile"
difficulty: 2
format: 2
tags: [数値計算, ソート, 防御的プログラミング]
---

## ひとことで

`percentile(arr, p)` は、数値の配列の **p パーセンタイル**（小さい順に並べたとき、全体の p % がその値以下になる値）を返します。
たとえば応答時間の配列から `percentile(times, 99)` を求めれば「99 % のリクエストはこの時間以内に返った」という値がわかります。

計算方法は **最近順位法**（nearest-rank method）という単純な方法で、並べ替えたあとにインデックスを式 1 つで求めます。

## コード

::: code-group

```ts:line-numbers=26 [日本語訳]
export function percentile(arr: readonly number[], percentile: number): number {
  if (Number.isNaN(Number(percentile))) {
    throw new Error(`Expected percentile to be a number but got "${percentile}".`);
  }

  if (percentile < 0) {
    throw new Error(`Expected percentile to be >= 0 but got "${percentile}".`);
  }

  if (percentile > 100) {
    throw new Error(`Expected percentile to be <= 100 but got "${percentile}".`);
  }

  if (arr.length === 0) {
    return NaN;
  }

  const sorted = arr.slice().sort((a, b) => {
    const x = Number.isNaN(a) ? Number.NEGATIVE_INFINITY : a;
    const y = Number.isNaN(b) ? Number.NEGATIVE_INFINITY : b;
    return x - y;
  });

  // // 最近順位法（Nearest rank method）: https://en.wikipedia.org/wiki/Percentile#The_nearest-rank_method
  if (percentile === 0) {
    return sorted[0];
  }

  const index = Math.ceil(sorted.length * (percentile / 100)) - 1;
  return sorted[index];
}
```

```ts:line-numbers=26 [原文]
export function percentile(arr: readonly number[], percentile: number): number {
  if (Number.isNaN(Number(percentile))) {
    throw new Error(`Expected percentile to be a number but got "${percentile}".`);
  }

  if (percentile < 0) {
    throw new Error(`Expected percentile to be >= 0 but got "${percentile}".`);
  }

  if (percentile > 100) {
    throw new Error(`Expected percentile to be <= 100 but got "${percentile}".`);
  }

  if (arr.length === 0) {
    return NaN;
  }

  const sorted = arr.slice().sort((a, b) => {
    const x = Number.isNaN(a) ? Number.NEGATIVE_INFINITY : a;
    const y = Number.isNaN(b) ? Number.NEGATIVE_INFINITY : b;
    return x - y;
  });

  // Nearest rank method: https://en.wikipedia.org/wiki/Percentile#The_nearest-rank_method
  if (percentile === 0) {
    return sorted[0];
  }

  const index = Math.ceil(sorted.length * (percentile / 100)) - 1;
  return sorted[index];
}
```

:::

## 前提知識

- **`NaN`**: 「数ではない」を表す特別な数値です。`0 / 0` などで生まれます。`NaN` はどんな値と比べても `false` になり、自分自身とも等しくありません。
- **`Number.isNaN(x)`**: `x` が `NaN` かどうかを正しく調べる関数です。`x === NaN` は常に `false` なので使えません。
- **`arr.slice().sort((a, b) => …)`**: コピーしてから並べ替えます。比較関数が負を返すと `a` が前、正を返すと `b` が前になります。`a - b` で小さい順です。
- **`Number.NEGATIVE_INFINITY`**: 負の無限大。どんな数より小さい値です。
- **`Math.ceil`**: 小数点以下を切り上げます。
- **テンプレートリテラル**: `` `…${値}…` `` の形で、文字列の中に値を埋め込めます。

## 何をしているか

### 1. 入力を確かめる

```ts:line-numbers=27
  if (Number.isNaN(Number(percentile))) {
    throw new Error(`Expected percentile to be a number but got "${percentile}".`);
  }

  if (percentile < 0) {
    throw new Error(`Expected percentile to be >= 0 but got "${percentile}".`);
  }

  if (percentile > 100) {
    throw new Error(`Expected percentile to be <= 100 but got "${percentile}".`);
  }

  if (arr.length === 0) {
    return NaN;
  }
```
`p` が数として解釈できない、0 未満、100 より大きい場合はエラーにします。配列が空なら答えがないので `NaN` を返します。

### 2. NaN を先頭に寄せて並べる

```ts:line-numbers=43
  const sorted = arr.slice().sort((a, b) => {
    const x = Number.isNaN(a) ? Number.NEGATIVE_INFINITY : a;
    const y = Number.isNaN(b) ? Number.NEGATIVE_INFINITY : b;
    return x - y;
  });
```
比較のときだけ `NaN` を負の無限大に読み替えます。配列の中身は書き換えません。

### 3. 最近順位法でインデックスを求める

```ts:line-numbers=50
  if (percentile === 0) {
    return sorted[0];
  }

  const index = Math.ceil(sorted.length * (percentile / 100)) - 1;
  return sorted[index];
```
`p = 0` なら最小値を返します。それ以外は、`要素数 × p / 100` を切り上げて「何番目か（1 から数えて）」を求め、1 を引いて 0 始まりのインデックスにします。

10 個の値 `[1, 2, …, 10]` で 90 パーセンタイルを求めると、

```
ceil(10 × 0.9) - 1 = 9 - 1 = 8 → sorted[8] = 9
```

10 個中 9 個（90 %）が 9 以下なので、9 が答えです。

## ここがすごい

- **`NaN` で並べ替えが壊れるのを防ぐ**: `a - b` の比較関数は、どちらかが `NaN` だと結果も `NaN` になり、「大小が決まらない」状態になります。すると並べ替えの結果がエンジンや入力の順番次第でバラバラになり、パーセンタイルの値も信用できなくなります。比較の中で `NaN` を「いちばん小さい値」と決めておくことで、必ず一貫した順番になります。
- **補間しない方法を選んでいる**: パーセンタイルには、間の値を直線で補う方法もあります。最近順位法は必ず **配列に実在する値** を返すので、「実際に観測された応答時間」として説明しやすい利点があります。`// Nearest rank method: …` のコメントで、どの定義を使ったかを Wikipedia へのリンク付きで明示しているのも親切です。
- **`p = 0` を特別扱い**: 式に `p = 0` を入れると `ceil(0) - 1 = -1` になってしまうので、先に最小値を返して範囲外アクセスを防いでいます。

## まとめ

- パーセンタイルは「並べ替えて、順位を式で求める」で計算できる。
- `NaN` が混ざると比較関数が壊れるので、比較の中で扱いを決めておく。
- 複数の定義がある計算は、どれを使ったかをコメントに残すと誤解がない。
