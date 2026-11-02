---
title: "値が Map オブジェクトかを判定する"
description: "es-toolkit の isMap は、値が Map のインスタンスかを instanceof で判定する。型ガードなので、判定の後は Map として get や set を使える。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/predicate/isMap.ts
lines: [19, 21]
function: "isMap"
difficulty: 1
format: 2
tags: [型システム, データ構造]
---

## ひとことで

`isMap(value)` は、値が `Map` のオブジェクトかどうかを判定する関数です。`Map` は、キーと値の組を持つ連想配列のような入れ物です。

```ts
isMap(new Map())  // true
isMap({})         // false（普通のオブジェクトは Map ではない）
```

## コード

```ts:line-numbers=19
export function isMap(value: unknown): value is Map<any, any> {
  return value instanceof Map;
}
```

## 前提知識

- **`Map`**: キーと値の組を覚えておく、JavaScript の標準のデータ構造です。キーには文字列以外も使えます。
- **普通のオブジェクトとの違い**: `{}` のオブジェクトは、キーが文字列か記号に限られます。`Map` は、値の並び順を保ち、キーの種類も自由です。
- **型ガード**: 戻り値の型 `value is Map<any, any>` で、判定の後は値を `Map` として扱えます。

## 何をしているか

### 1. Map から作られたかを調べる

```ts:line-numbers=19
export function isMap(value: unknown): value is Map<any, any> {
  return value instanceof Map;
}
```

値が `Map` のインスタンスなら `true` を返します。型の注釈により、`true` の後は `get` や `set` などを型の上で使えます。

## ここがすごい

- **普通のオブジェクトと区別する**: 見た目が似ていても、`Map` とそれ以外を確実に分けられます。
- **型と判定が一致する**: 判定と型の絞り込みが同じ注釈にまとまっているので、書き直しが要りません。
- **何でも受け付ける**: 引数が `unknown` なので、どの値を渡しても安全に判定できます。

## まとめ

- `isMap` は、値が `Map` かを `instanceof` で判定する。
- 型ガードにより、判定後は `Map` として扱える。
- 普通のオブジェクトなどは、`false` として区別される。
