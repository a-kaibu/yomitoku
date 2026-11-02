---
title: "候補の値を「|」でつないで、エラー文の選択肢を作る"
description: "zod の joinValues は、基本の値の配列を stringifyPrimitive で文字列にし、区切り文字でつなぐ。「a|b」のような選択肢の表示を作る。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [284, 286]
function: "joinValues"
difficulty: 1
format: 2
tags: [文字列処理, イディオム, 標準ライブラリ]
---

## ひとことで

`joinValues(array, separator)` は、基本の値の配列を、区切り文字（既定は `|`）でつないだ 1 つの文字列にする関数です。たとえば `['a', 'b']` は `"a"|"b"` になります。zod が「次のどれかでなければならない」というエラー文を作るときに使われます。

```ts
joinValues(['a', 'b'])          // "a"|"b"
joinValues([1, 2], ', ')        // "1, 2"
```

## コード

```ts:line-numbers=284
export function joinValues<T extends Primitive[]>(array: T, separator = "|"): string {
  return array.map((val) => stringifyPrimitive(val)).join(separator);
}
```

## 前提知識

- **`map`**: 配列の各要素を別の値に変換して、新しい配列を作るメソッドです。元の配列は変わりません。
- **`join(区切り)`**: 配列の要素を、区切り文字でつないで 1 つの文字列にするメソッドです。
- **既定の引数**: `separator = "|"` のように書くと、引数を省略したときに、その値が使われます。
- **`Primitive[]`**: 基本の値だけを要素に持つ配列の型です。オブジェクトを渡すと、型の上でエラーになります。
- **`stringifyPrimitive`**: 前の関数で見たように、値をコードに書ける文字列にする関数です。

## 何をしているか

### 1. 各要素を文字列にする

```ts:line-numbers=285
  return array.map((val) => stringifyPrimitive(val)).join(separator);
```

`array.map` で、要素を 1 つずつ `stringifyPrimitive` に通します。文字列は `"a"` のように引用符が付き、数はそのまま文字列になります。

### 2. 区切り文字でつなぐ

同じ行の `.join(separator)` の部分です。配列の要素を、`|` などの区切り文字でつなぎます。既定の区切りは `|` なので、`"a"|"b"` という形になります。

## ここがすごい

- **2 つの関数の組み合わせ**: 値の文字列化は `stringifyPrimitive` に任せ、この関数は並べることだけに集中しています。役割が明確です。
- **選択肢の表示が自然になる**: `|` は、TypeScript の型の書き方で「どれか」を表す記号です。エラー文に出すと、利用者にも意味が伝わりやすくなります。
- **区切りを変えられる**: 第 2 引数で区切りを変えられるので、`, ` で読みやすくつなぐなど、用途に合わせられます。
- **1 行で完結**: 変換とつなぎ合わせを 1 行で書いています。元の配列を変えないので、呼び出し側の値は安全です。

## まとめ

- 配列の要素を、同じ書き方で文字列にしてから区切ると、選択肢の表示が作れる。
- `map` と `join` の組み合わせは、一覧を文字列にする基本の形。
- 役割を分けた小さい関数を組み合わせると、読みやすく、直しやすい。
- 既定の引数を使うと、よく使う形を短く呼び出せる。
