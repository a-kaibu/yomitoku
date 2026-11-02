---
title: "配列の中から、一つの要素をランダムに選ぶ"
description: "es-toolkit の sample は、配列の中から要素を一つ、ランダムに選んで返す。Math.random と Math.floor で、0 から長さ未満の添字を作る定番の形。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/array/sample.ts
lines: [15, 18]
function: "sample"
difficulty: 1
format: 2
tags: [数値計算, イディオム]
---

## ひとことで

`sample(arr)` は、配列の中から要素を 1 つ、ランダムに選んで返す関数です。どの要素も同じ確率で選ばれます。

```ts
sample(['a', 'b', 'c'])  // 'a', 'b', 'c' のどれか
```

## コード

```ts:line-numbers=15
export function sample<T>(arr: readonly T[]): T {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}
```

## 前提知識

- **`Math.random`**: 0 以上 1 未満の小数を、ランダムに返す関数です。
- **`Math.floor`**: 小数を切り捨てて、整数にする関数です。
- **添字**: 配列の位置を表す整数です。長さが `n` の配列の添字は、0 から `n - 1` までです。

## 何をしているか

### 1. 添字をランダムに作る

```ts:line-numbers=16
  const randomIndex = Math.floor(Math.random() * arr.length);
```

`Math.random()` は 0 以上 1 未満の数を返します。これに配列の長さを掛けると、0 以上で長さより小さい数になります。`Math.floor` で整数にすると、有効な添字になります。

### 2. その位置の要素を返す

```ts:line-numbers=17
  return arr[randomIndex];
```

ランダムに決めた添字の要素を返します。

## ここがすごい

- **範囲が必ず正しい**: 掛け算と切り捨てで、添字が 0 から長さ未満に必ず収まります。範囲外を指す心配がありません。
- **偏りが少ない**: 各添字が選ばれる確率が等しくなるので、特定の要素だけが選ばれにくくなることはありません。
- **書き方が短い**: 添字を作って返すという 2 行だけで、ランダムな選択を表しています。

### 注意点

- 空の配列を渡すと、`arr.length` が 0 になり、添字は `0` になります。`arr[0]` は `undefined` なので、戻り値は `undefined` になります。
- 型の上では `T` を返すので、呼び出す側で空でないことを確かめる必要があります。

## まとめ

- `sample` は、配列から要素を 1 つランダムに選ぶ。
- `Math.random` と `Math.floor` で、有効な添字を作る。
- 空の配列では `undefined` になるので、呼び出す側で注意が必要。
