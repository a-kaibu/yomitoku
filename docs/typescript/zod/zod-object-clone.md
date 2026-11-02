---
title: "オブジェクトの原型と属性を、そのまま複製する"
description: "zod の objectClone は、オブジェクトの原型と全ての属性の記述子をそのまま引き継いで複製する。値だけを写す通常のコピーとの違いが分かる例。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [363, 365]
function: "objectClone"
difficulty: 2
format: 2
tags: [データ構造, 設計パターン]
---

## ひとことで

`objectClone(obj)` は、オブジェクトを複製した新しいオブジェクトを返す関数です。通常のコピーと違い、元の「原型（プロトタイプ）」と、各属性の「記述子」まで引き継ぎます。

```ts
const copy = objectClone(obj)
// copy は obj と同じ原型を持ち、同じ性質（書き込み可否など）の属性を持つ
```

## コード

```ts:line-numbers=363
export function objectClone(obj: object) {
  return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}
```

## 前提知識

- **原型（プロトタイプ）**: オブジェクトが継承元として持つ別のオブジェクトです。メソッドなどがここから引き継がれます。
- **属性の記述子（ディスクリプタ）**: 属性の値に加えて、書き込みできるか、列挙されるかなどの性質を表す情報です。
- **`Object.create`**: 指定した原型を持つ、新しいオブジェクトを作るメソッドです。

## 何をしているか

### 1. 原型を取り出す

```ts:line-numbers=364
  return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
```

元のオブジェクトの原型を取り出します。

### 2. 属性の記述子をすべて取り出す

```ts:line-numbers=364
  return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
```

元のオブジェクトが持つ全ての属性について、値と性質をまとめて取り出します。

### 3. 両方を使って新しく作る

```ts:line-numbers=364
  return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
```

取り出した原型と記述子を使って、新しいオブジェクトを作ります。値だけでなく、性質まで同じになります。

## ここがすごい

- **性質ごと複製する**: 通常の `{ ...obj }` では失われる、原型や書き込み禁止の性質を引き継げます。
- **短く書ける**: 3 つの標準の関数を組み合わせるだけで、複雑な複製を表せます。
- **スキーマを正確に写せる**: zod の内部で、定義を壊さずに複製したいときに役立ちます。

## まとめ

- `objectClone` は、オブジェクトを原型と属性の性質ごと複製する。
- 原型は `Object.getPrototypeOf`、属性は `Object.getOwnPropertyDescriptors` で取り出す。
- 通常のコピーでは失われる性質も、そのまま引き継げる。
