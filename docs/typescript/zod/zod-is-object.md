---
title: "配列と null を除いた「オブジェクトらしさ」の判定"
description: "値がオブジェクトかを調べる isObject。typeof が object でも null と配列は除き、さらに TypeScript の型ガードにより、戻り値で型を絞り込める。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [513, 515]
function: "isObject"
difficulty: 1
format: 2
tags: [型システム, 防御的プログラミング, イディオム]
---

## ひとことで

`isObject(data)` は、値が **オブジェクトとして扱えるか** を調べます。`null` と配列は、`typeof` で `'object'` になるのに、この関数は `false` を返します。

```ts
isObject({ a: 1 })  // true
isObject([1, 2])    // false（配列は除く）
isObject(null)      // false（null は除く）
isObject('abc')     // false
```

JavaScript では、`typeof null` も `typeof []` も `'object'` になります。そのまま使うと、null や配列を誤ってオブジェクトとして扱ってしまうので、その二つを除いた判定を用意しています。

## コード

```ts:line-numbers=513
export function isObject(data: any): data is Record<PropertyKey, unknown> {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
```

## 前提知識

- **`typeof`**: 値の種類を文字列で返します。`typeof null` は `'object'` になる、という古い仕様があります。
- **`Array.isArray`**: 値が配列かどうかを正しく判定します。
- **型ガード `data is Record<PropertyKey, unknown>`**: 関数が `true` を返したとき、TypeScript の型をその形に絞り込みます。
- **`&&`（論理積）**: 左側が偽なら、右側を見ずに偽を返します。

## 何をしているか

### 1. 型が object かどうかを調べる

```ts:line-numbers=514
  return typeof data === "object" && data !== null && !Array.isArray(data);
```

まず `typeof` で、値の種類が `'object'` かを確かめます。

### 2. null と配列を除く

```ts:line-numbers=514
  return typeof data === "object" && data !== null && !Array.isArray(data);
```

`data !== null` で null を除き、`!Array.isArray(data)` で配列を除きます。残ったものだけが `true` になります。

## ここがすごい

- **三つの条件を一行で**: `typeof`・`null`・配列の三つを、`&&` でつないだ一つの式にしています。どれか一つでも満たさなければ、すぐに `false` になります。
- **型ガードで後の処理を助ける**: `data is Record<...>` という戻り値の型のおかげで、`if (isObject(x))` のあとの `x` は、TypeScript によって安全なオブジェクトとして扱われます。
- **Zod の内部で共通に使う**: 値を調べる多くの関数が、この判定を前提に書かれています。判定を 1 か所に置くことで、どの場所でも同じ基準になります。

## まとめ

- `typeof x === 'object'` だけでは、null と配列が混ざるので、両方を除く。
- 型ガードの戻り値型を使うと、判定のあとの型が正しく絞り込まれる。
- よく使う判定は、1 つの関数にまとめると一貫性が保てる。
