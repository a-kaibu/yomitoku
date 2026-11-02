---
title: "中身の無い普通のオブジェクトかを判定する"
description: "es-toolkit の isEmptyObject は、値が中身の無い普通のオブジェクトかを判定する。配列や Date のような特別なオブジェクトは、空でも対象にしない。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/predicate/isEmptyObject.ts
lines: [15, 17]
function: "isEmptyObject"
difficulty: 1
format: 2
tags: [型システム, 防御的プログラミング, データ構造]
---

## ひとことで

`isEmptyObject(value)` は、値が「普通のオブジェクトで、かつキーを 1 つも持たない」かを判定する関数です。`{}` は `true` になり、空の配列や `null` は `false` になります。

```ts
isEmptyObject({})        // true
isEmptyObject({ a: 1 })  // false
isEmptyObject([])        // false（配列は普通のオブジェクトではない）
```

## コード

```ts:line-numbers=15
export function isEmptyObject(value: unknown): value is Record<PropertyKey, never> {
  return isPlainObject(value) && Object.keys(value).length === 0;
}
```

## 前提知識

- **普通のオブジェクト（プレーンオブジェクト）**: `{}` のように、オブジェクトリテラルで作られたものです。配列、日付、クラスのインスタンスは含みません。
- **`Object.keys`**: オブジェクトが持つ、自分自身の列挙可能なキーを配列で返すメソッドです。
- **`isPlainObject`**: 同じプロジェクトにある判定関数で、普通のオブジェクトかどうかを調べます。

## 何をしているか

### 1. 普通のオブジェクトかを確かめる

```ts:line-numbers=16
  return isPlainObject(value) && Object.keys(value).length === 0;
```

まず `isPlainObject(value)` で、普通のオブジェクトかを確かめます。配列などは、ここで `false` になり、後の判定に進みません。

### 2. キーが 0 個かを確かめる

`Object.keys(value).length === 0` で、キーの数が 0 かを調べます。両方が成り立つときだけ `true` です。

## ここがすごい

- **対象を絞る**: 空の配列や空の Date を「空のオブジェクト」として扱わないので、判定の結果が直感どおりになります。
- **短い論理積**: `&&` の左側で対象を絞り、右側でキーの数を数えるという順番が、読みやすく書かれています。
- **型の絞り込み**: 戻り値の型は `Record<PropertyKey, never>` で、キーを持てない空のオブジェクトだと型の上でも示されます。

## まとめ

- `isEmptyObject` は、普通のオブジェクトで、かつキーが無いものだけを `true` にする。
- 配列や Date などの特別なオブジェクトは、空でも対象外になる。
- 先に普通のオブジェクトかを確かめてから、キーの数を数える順番になっている。
