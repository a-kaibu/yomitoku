---
title: "値が null でも undefined でもないかを判定する"
description: "es-toolkit の isNotNil は、値が null と undefined のどちらでもないかを判定する。!= null の 1 つの比較で両方を同時に調べ、型も絞り込む。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/predicate/isNotNil.ts
lines: [17, 19]
function: "isNotNil"
difficulty: 1
format: 2
tags: [型システム, 防御的プログラミング, ジェネリクス]
---

## ひとことで

`isNotNil(x)` は、値が `null` でも `undefined` でもないかを判定する関数です。`filter` と組み合わせると、無い値を取り除くのによく使われます。

```ts
isNotNil(0)         // true
isNotNil(null)      // false
isNotNil(undefined) // false
```

## コード

```ts:line-numbers=17
export function isNotNil<T>(x: T | null | undefined): x is T {
  return x != null;
}
```

## 前提知識

- **nil（ナル系）**: `null` と `undefined` をまとめて呼ぶ言葉です。値が無いことを表します。
- **`!=`（緩い不等号）**: `x != null` は、`null` と `undefined` のどちらでもない場合に `true` になります。`===` と違い、両方を 1 回の比較で調べられます。
- **型の絞り込み**: 戻り値の型 `x is T` により、`true` のあとでは `null` と `undefined` を除いた型として扱えます。

## 何をしているか

### 1. null と undefined を同時に調べる

```ts:line-numbers=17
export function isNotNil<T>(x: T | null | undefined): x is T {
  return x != null;
}
```

`x != null` は、`null` と `undefined` の両方を 1 回の比較で除外します。`0` や空文字列は `null` ではないので、`true` になります。

## ここがすごい

- **1 つの比較で 2 種類を除く**: `!= null` と書くだけで、`null` と `undefined` を同時に扱えます。
- **`filter` の型も直る**: `arr.filter(isNotNil)` とすると、結果の型から `null` と `undefined` が消えます。普通の `filter` では残ってしまう型が、正しく絞り込まれます。
- **ジェネリクスで型を保つ**: 元の値の型 `T` を残すので、中身の型情報を失いません。

## まとめ

- `isNotNil` は、値が `null` でも `undefined` でもないかを判定する。
- `!= null` の 1 つの比較で、両方を同時に除外する。
- 型の絞り込みにより、`filter` の結果から無い値の型が消える。
