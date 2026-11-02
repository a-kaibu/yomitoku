---
title: "値が関数かどうかを、typeof で判定する"
description: "es-toolkit の isFunction は、値が関数かを typeof で判定する。関数の型を型ガードで表し、判定後は関数として呼び出せるようにしている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/predicate/isFunction.ts
lines: [14, 16]
function: "isFunction"
difficulty: 1
format: 2
tags: [型システム, 防御的プログラミング]
---

## ひとことで

`isFunction(value)` は、値が関数かどうかを判定する関数です。判定が `true` になれば、値を関数として呼び出せると型で示されます。

```ts
isFunction(() => 1)  // true
isFunction('abc')    // false
```

## コード

```ts:line-numbers=14
export function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === 'function';
}
```

## 前提知識

- **`typeof`**: 値の種類を文字列で返す演算子です。関数なら `'function'`、数なら `'number'` などを返します。
- **関数を値として渡す**: JavaScript では、関数も数や文字列と同じように変数に入れたり、引数に渡したりできます。
- **型ガード**: 戻り値の型 `value is (...args: any[]) => any` で、判定後の値の型を関数として絞り込みます。

## 何をしているか

### 1. 型を文字列で確かめる

```ts:line-numbers=14
export function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === 'function';
}
```

`typeof value` が `'function'` と等しいかを調べます。クラスも関数の一種なので、同じく `true` になります。

## ここがすごい

- **1 行の判定**: `typeof` を 1 回使うだけで、関数かどうかが分かります。
- **型で呼び出しを安全に**: 判定後は関数として呼べる型になるため、呼び出す前の確認が型の上で表せます。
- **値を選ばない**: 引数は `any` で、どの値も受け付けます。判定に失敗しても例外は起きません。

## まとめ

- `isFunction` は、値が関数かを `typeof` で判定する。
- 型ガードにより、`true` の後は関数として扱える。
- どの値も受け付け、関数でなければ `false` を返す。
