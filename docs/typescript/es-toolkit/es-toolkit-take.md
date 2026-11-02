---
title: "配列の先頭から、指定した数だけ要素を取り出す"
description: "es-toolkit の take は、配列の先頭から指定した数の要素を取り出して、新しい配列を返す。slice に任せた、一行で済む素直な形。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/array/take.ts
lines: [23, 25]
function: "take"
difficulty: 1
format: 2
tags: [データ構造, イディオム]
---

## ひとことで

`take(arr, count)` は、配列の先頭から `count` 個の要素を取り出した新しい配列を返す関数です。`count` が配列の長さより大きいときは、全部の要素を返します。

```ts
take([1, 2, 3, 4], 2)  // [1, 2]
take([1, 2], 5)        // [1, 2]
```

## コード

```ts:line-numbers=23
export function take<T>(arr: readonly T[], count: number): T[] {
  return arr.slice(0, count);
}
```

## 前提知識

- **`slice`**: 配列の一部を、開始位置から終了位置の手前まで取り出すメソッドです。元の配列は変わりません。
- **終了位置の扱い**: `slice(0, 2)` は、添字 0 と 1 の要素を取り出します。終了位置の添字は含まれません。
- **範囲外の指定**: 終了位置が配列の長さを超えても、`slice` は配列の終わりまでを取り出すだけで、エラーになりません。

## 何をしているか

### 1. 先頭から count 個を切り出す

```ts:line-numbers=24
  return arr.slice(0, count);
```

開始位置を `0` にして、終了位置に `count` を渡します。先頭から `count` 個の要素を新しい配列として返します。

## ここがすごい

- **一行で完結**: 切り出しの仕事をすべて `slice` に任せ、関数の本体は 1 行です。
- **範囲外に強い**: `count` が長さより大きくても、エラーにならず、残りの全部が返されます。
- **元を変えない**: `slice` は新しい配列を作るので、呼び出し元のデータは変わりません。

## まとめ

- `take` は、先頭から指定した数の要素を新しい配列で返す。
- `slice(0, count)` の一行で、切り出しを表している。
- 長さを超える指定でもエラーにならず、残りを全部返す。
