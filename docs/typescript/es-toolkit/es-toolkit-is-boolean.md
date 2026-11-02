---
title: "値が真偽値（true か false）かを判定する"
description: "es-toolkit の isBoolean は、値が真偽値の true か false かを typeof で判定する。真の値や 0 のような、真偽値に似た値は対象にしない。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/predicate/isBoolean.ts
lines: [23, 25]
function: "isBoolean"
difficulty: 1
format: 2
tags: [型システム, 防御的プログラミング]
---

## ひとことで

`isBoolean(x)` は、値が `true` か `false` という真偽値かどうかを判定する関数です。`0` や `'true'` のような、真偽値に変換できる値は対象になりません。

```ts
isBoolean(true)     // true
isBoolean(0)        // false
isBoolean('true')   // false
```

## コード

```ts:line-numbers=23
export function isBoolean(x: unknown): x is boolean {
  return typeof x === 'boolean';
}
```

## 前提知識

- **真偽値（boolean）**: `true` と `false` の 2 つだけの値を持つ型です。
- **`typeof`**: 値の種類を文字列で返す演算子です。真偽値なら `'boolean'` を返します。
- **型ガード**: 戻り値の型 `x is boolean` により、判定が `true` の後で、値を真偽値として扱えます。

## 何をしているか

### 1. 型が boolean かを調べる

```ts:line-numbers=23
export function isBoolean(x: unknown): x is boolean {
  return typeof x === 'boolean';
}
```

`typeof x` が `'boolean'` と等しいかを調べます。値の中身ではなく型だけを見るので、`0` や `'false'` は対象外になります。

## ここがすごい

- **型だけで判定する**: 値の意味を推測せず、型の種類だけで判断するので、結果が明確です。
- **真偽値に似た値を弾く**: `0` や `''` のように、条件式で偽として扱われる値を、真偽値とは見なしません。
- **1 行で完結**: `typeof` の比較一つで、判定の意図がそのまま読めます。

## まとめ

- `isBoolean` は、値が `true` か `false` かを、型で判定する。
- `0` や `'true'` のような、真偽値に似た値は対象にならない。
- 型ガードにより、判定後は真偽値として扱える。
