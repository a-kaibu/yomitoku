---
title: "値がオブジェクトではない基本の型かを、1 行で判定する"
description: "es-toolkit の isPrimitive。null・undefined・文字列・数・真偽値・Symbol・BigInt を基本の値とみなす。== null で両方を一度に判定している。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/predicate/isPrimitive.ts
lines: [22, 24]
function: "isPrimitive"
difficulty: 2
format: 2
tags: [型システム, イディオム, 防御的プログラミング]
---

## ひとことで

`isPrimitive(value)` は、値が「基本の値（プリミティブ）」かを判定する関数です。`null`、`undefined`、文字列、数、真偽値、Symbol、BigInt は `true` を返します。オブジェクト、配列、関数は `false` を返します。値を深く見ていくかどうかを、最初に決めるときに使われます。

```ts
isPrimitive('abc')    // true
isPrimitive(null)     // true
isPrimitive({})       // false
isPrimitive([])       // false
```

## コード

```ts:line-numbers=22
export function isPrimitive(value: unknown): value is null | undefined | string | number | boolean | symbol | bigint {
  return value == null || (typeof value !== 'object' && typeof value !== 'function');
}
```

## 前提知識

- **プリミティブとオブジェクト**: JavaScript の値は、基本の値（プリミティブ）と、オブジェクトに分かれます。配列や関数もオブジェクトの仲間です。
- **`typeof`**: 値の種類を文字列で返す演算子です。`typeof null` は `"object"` を返すという、古くからの仕様があります。
- **`== null`**: `null` と `undefined` の両方を、1 つの比較で判定できます。
- **型ガード `value is …`**: 戻り値が `true` のとき、引数の型を指定の型として扱うと TypeScript に伝える書き方です。

## 何をしているか

### 1. null と undefined を先に除く

```ts:line-numbers=23
  return value == null || (typeof value !== 'object' && typeof value !== 'function');
```

`value == null` は、`null` か `undefined` なら `true` です。ここで基本の値と判定されます。

### 2. 残りは、オブジェクトでも関数でもないかを見る

同じ行の `typeof value !== 'object' && typeof value !== 'function'` の部分です。`typeof` が `'object'` や `'function'` なら、基本の値ではありません。それ以外は、文字列・数・真偽値・Symbol・BigInt などです。

## ここがすごい

- **`typeof null` の癖を、`== null` で吸収**: `typeof null` は `"object"` なので、そのままでは `null` がオブジェクトに見えてしまいます。`== null` を先に書くと、その癖を正しく避けられます。
- **2 つの条件で全部を覆う**: 基本の値は、「オブジェクトでも関数でもない」という否定の形で表せます。種類を 1 つずつ並べる必要がありません。
- **型述語で絞り込みができる**: 戻り値の型が、基本の値の型の和になっているので、判定の後は型が絞られます。
- **1 行の判定**: 両方の条件を `||` でつないで、読みやすく 1 行にまとめています。

## まとめ

- 値の種類を判定するには、`typeof` の癖（`null` が `"object"` になること）に注意する。
- `== null` は `null` と `undefined` をまとめて判定できる。
- 基本の値は「オブジェクトでも関数でもない」と否定の形で表すと簡潔になる。
- 型述語を付けると、判定の結果を型にも反映できる。
