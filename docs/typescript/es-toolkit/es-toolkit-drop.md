---
title: "配列の先頭から、指定した数の要素を捨てる"
description: "es-toolkit の drop は、配列の先頭から指定した数の要素を捨てた、残りの配列を返す。負の数は 0 に直してから slice するので、想定外の値でも安全。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/array/drop.ts
lines: [17, 21]
function: "drop"
difficulty: 1
format: 2
tags: [データ構造, 防御的プログラミング]
---

## ひとことで

`drop(arr, itemsCount)` は、配列の先頭から指定した数の要素を捨てて、残りの要素を新しい配列として返す関数です。`take` と対になる関数です。

```ts
drop([1, 2, 3, 4], 2)  // [3, 4]
drop([1, 2], -1)       // [1, 2]（負の数は 0 として扱う）
```

## コード

```ts:line-numbers=17
export function drop<T>(arr: readonly T[], itemsCount: number): T[] {
  itemsCount = Math.max(itemsCount, 0);

  return arr.slice(itemsCount);
}
```

## 前提知識

- **`slice` と開始位置**: `slice(n)` は、添字 `n` から最後までを取り出します。先頭を捨てたいときに使える形です。
- **`Math.max`**: 複数の数の中から、一番大きい数を返す関数です。
- **防御的な書き方**: 想定外の入力でも壊れないように、先に値を整える考え方です。

## 何をしているか

### 1. 負の数を 0 に直す

```ts:line-numbers=18
  itemsCount = Math.max(itemsCount, 0);
```

`itemsCount` と `0` を比べて、大きい方を使います。負の数は `0` になり、「何も捨てない」として扱われます。

### 2. 先頭を捨てて残りを返す

```ts:line-numbers=20
  return arr.slice(itemsCount);
```

添字 `itemsCount` から最後までを切り出します。先頭の `itemsCount` 個が、捨てられた形になります。

## ここがすごい

- **負の入力に強い**: `Math.max` の一行で、`-1` などの想定外の値も安全に扱えます。
- **`take` と対になる**: 先頭を取る `take` と、先頭を捨てる `drop` が、同じ形で書かれています。
- **元を変えない**: `slice` が新しい配列を作るので、元の配列は変わりません。

## まとめ

- `drop` は、先頭から指定数の要素を捨てて、残りを新しい配列で返す。
- 負の数は `Math.max` で 0 に直し、安全に扱う。
- 対になる `take` と同じ形で、読みやすく書かれている。
