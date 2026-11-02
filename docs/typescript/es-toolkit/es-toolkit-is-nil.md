---
title: "値が null か undefined かを、型を絞り込みながら判定する"
description: "es-toolkit の isNil は、値が null か undefined かを判定する。== null の一回の比較で両方を調べ、型の上でも null と undefined に絞り込む。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/predicate/isNil.ts
lines: [20, 22]
function: "isNil"
difficulty: 1
format: 2
tags: [型システム, 防御的プログラミング]
---

## ひとことで

`isNil(x)` は、値が `null` か `undefined` のどちらかであるかを判定する関数です。判定が `true` になれば、TypeScript はその値を `null` か `undefined` として扱います。

```ts
isNil(null)       // true
isNil(undefined)  // true
isNil(0)          // false
```

## コード

```ts:line-numbers=20
export function isNil(x: unknown): x is null | undefined {
  return x == null;
}
```

## 前提知識

- **nil**: `null` と `undefined` をまとめて呼ぶ言葉です。値が無いことを表します。
- **`==` と `===`**: `==` は型を変換して比べるので、`x == null` は `null` と `undefined` の両方に `true` になります。`===` は型も比べるので、どちらかだけになります。
- **型ガード**: 戻り値の型 `x is null | undefined` で、判定の後の型を絞り込みます。

## 何をしているか

### 1. 両方を一度に比べる

```ts:line-numbers=20
export function isNil(x: unknown): x is null | undefined {
  return x == null;
}
```

`x == null` は、`null` と `undefined` の両方に `true` を返します。`0` や空文字列は、`null` ではないので `false` です。

## ここがすごい

- **一回の比較で二つを除く**: `== null` で、`null` と `undefined` を同時に判定できます。
- **型の絞り込みを表す**: 注釈 `x is null | undefined` により、判定後の型が正しく示されます。
- **何でも受け付ける**: 引数が `unknown` なので、どんな値も判定できます。

### 注意点

- 値が `undefined` のとき、属性の参照がエラーになる場面を避けるために使われます。判定の結果は、そのまま条件分岐に使えます。

## まとめ

- `isNil` は、値が `null` か `undefined` かを判定する。
- `== null` の一回の比較で、両方を同時に調べる。
- 型の注釈で、判定後の型も `null` と `undefined` に絞り込まれる。
