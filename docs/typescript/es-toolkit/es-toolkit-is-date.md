---
title: "値が日付の Date オブジェクトかを判定する"
description: "es-toolkit の isDate は、値が Date のインスタンスかを instanceof で判定する。型ガードになっているので、判定の後で値を Date として扱える。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/predicate/isDate.ts
lines: [14, 16]
function: "isDate"
difficulty: 1
format: 2
tags: [型システム, 防御的プログラミング]
---

## ひとことで

`isDate(value)` は、値が `Date` のオブジェクトかどうかを判定する関数です。判定が `true` になったあとは、TypeScript が値を `Date` として扱ってくれます。

```ts
isDate(new Date())  // true
isDate('2026-11-02') // false（文字列は日付のオブジェクトではない）
```

## コード

```ts:line-numbers=14
export function isDate(value: unknown): value is Date {
  return value instanceof Date;
}
```

## 前提知識

- **`instanceof`**: 左の値が、右のクラスから作られたものかを調べる演算子です。
- **型ガード**: 戻り値の型が `value is Date` のように書かれた関数です。`true` になったとき、型の上でも値を `Date` として絞り込みます。
- **`unknown`**: 型が決まっていない値を表す型です。中身を使う前に、判定が必要になります。

## 何をしているか

### 1. Date かどうかを調べる

```ts:line-numbers=14
export function isDate(value: unknown): value is Date {
  return value instanceof Date;
}
```

引数の値が `Date` から作られたものなら `true` を返します。型の注釈 `value is Date` により、`true` の後では `Date` として使えます。

## ここがすごい

- **型と判定が一致する**: 判定と型の絞り込みが 1 つの注釈にまとまっているので、判定の後で型を書き直す必要がありません。
- **入力の型を選ばない**: 引数が `unknown` なので、どんな値を渡してもエラーになりません。
- **文字列の日付を弾く**: 日付の文字列は `Date` ではないので、`false` になります。見た目だけで判断しない、安全な判定です。

## まとめ

- `isDate` は、値が `Date` オブジェクトかを `instanceof` で判定する。
- 戻り値の型注釈で、`true` の後は `Date` として扱える。
- どんな値でも受け付け、文字列などは `false` になる。
