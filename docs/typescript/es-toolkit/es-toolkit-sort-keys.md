---
title: "オブジェクトのキーを並べ替えた、新しいオブジェクトを作る"
description: "es-toolkit の sortKeys は、オブジェクトのキーを指定した順序で並べ替え、その順に値を写した新しいオブジェクトを作る。JavaScript が挿入順を保つ性質を使っている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/object/sortKeys.ts
lines: [19, 30]
function: "sortKeys"
difficulty: 2
format: 2
tags: [ソート, データ構造, イディオム]
---

## ひとことで

`sortKeys(object, compareKeys)` は、オブジェクトのキーを並べ替えて、その順に値を入れ直した新しいオブジェクトを返す関数です。元のオブジェクトは変わりません。

```ts
sortKeys({ b: 2, a: 1 })  // { a: 1, b: 2 }
```

## コード

```ts:line-numbers=19
export function sortKeys<T extends Record<string, any>>(object: T, compareKeys?: (a: string, b: string) => number): T {
  const sortedKeys = Object.keys(object).sort(compareKeys);

  const result = {} as Record<string, any>;

  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    result[key] = object[key];
  }

  return result as T;
}
```

## 前提知識

- **`Object.keys`**: オブジェクトのキーを配列で返すメソッドです。
- **`sort` と比較関数**: 配列を並べ替えるメソッドです。比較関数を渡すと、並べる順序を変えられます。省略すると、文字列の順に並べます。
- **挿入順**: 現在の JavaScript では、オブジェクトのキーは追加された順に列挙されます。この性質を使うと、キーの順序を指定できます。

## 何をしているか

### 1. キーを並べ替える

```ts:line-numbers=20
  const sortedKeys = Object.keys(object).sort(compareKeys);
```

キーを配列で取り出し、指定された比較関数で並べ替えます。比較関数が省略されたときは、既定の順序になります。

### 2. 空のオブジェクトを用意する

```ts:line-numbers=22
  const result = {} as Record<string, any>;
```

結果を入れる新しいオブジェクトを作ります。

### 3. 並べた順に値を入れる

```ts:line-numbers=24
  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    result[key] = object[key];
  }
```

並べたキーを先頭から順に取り出し、同じキーの値を新しいオブジェクトに写します。挿入の順番がそのまま、並べたあとの順序になります。

## ここがすごい

- **キーの順序を持たせる**: 通常のオブジェクトは並べ替えができないので、挿入順を使って順序を作るという工夫です。
- **元を変えない**: 新しいオブジェクトを作るので、呼び出し元のデータは並ばないまま残ります。
- **比較の仕方を選べる**: 比較関数を渡せば、昇順や降順、大文字小文字を無視した順などを自由に決められます。

## まとめ

- `sortKeys` は、キーを並べ替えた順に値を写した新しいオブジェクトを作る。
- JavaScript のオブジェクトは挿入順を保つ性質を使い、順序を持たせる。
- 比較関数を渡せば、並べる順序を自由に決められる。
