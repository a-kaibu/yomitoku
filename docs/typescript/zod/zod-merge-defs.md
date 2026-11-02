---
title: "プロパティの記述子ごとコピーして定義を合成する"
description: "複数のスキーマ定義を 1 つにまとめる mergeDefs。値そのものではなく、getter や setter を含む記述子（descriptor）ごとコピーするので、後から定義された値が優先される。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [454, 463]
function: "mergeDefs"
difficulty: 3
format: 2
tags: [メタプログラミング, データ構造, リフレクション]
---

## ひとことで

`mergeDefs(...defs)` は、複数の定義（オブジェクト）を 1 つにまとめます。後ろの定義が前の定義を上書きします。

```ts
mergeDefs({ a: 1, b: 2 }, { b: 3 })  // { a: 1, b: 3 }
```

Zod では、スキーマの定義を組み合わせて新しいスキーマを作るときに使われます。値をコピーするだけでなく、プロパティの **記述子**（値・getter・setter などの設定）もそのまま引き継いでいます。

## コード

```ts:line-numbers=454
export function mergeDefs(...defs: Record<string, any>[]): any {
  const mergedDescriptors: Record<string, PropertyDescriptor> = {};

  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }

  return Object.defineProperties({}, mergedDescriptors);
}
```

## 前提知識

- **プロパティ記述子**: プロパティの値や、書き換えや列挙が許されるかといった設定をまとめたものです。`Object.getOwnPropertyDescriptors` で取り出せます。
- **getter と setter**: プロパティを読むとき・書くときに関数が動くように定義された仕組みです。
- **`Object.defineProperties`**: 記述子をまとめて、オブジェクトに設定します。
- **`Object.assign`**: 後ろのオブジェクトのプロパティを、前のオブジェクトに上書きコピーします。

## 何をしているか

### 1. 記述子を集める

```ts:line-numbers=455
  const mergedDescriptors: Record<string, PropertyDescriptor> = {};

  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
```

各定義のすべてのプロパティの記述子を取り出し、1 つの記述子の表にまとめます。後から来た定義の記述子が、同じ名前のものを上書きします。

### 2. 新しいオブジェクトを作る

```ts:line-numbers=462
  return Object.defineProperties({}, mergedDescriptors);
```

空のオブジェクトに、まとめた記述子を設定します。値をコピーしたのではなく、記述子ごと引き継いでいるのがポイントです。

## ここがすごい

- **getter を値に変換しない**: 単に `{ ...a, ...b }` でコピーすると、getter の結果だけが固定の値として残ります。記述子ごとコピーすると、getter の仕組みを保ったまま合成できます。
- **後ろの定義が勝つ**: 記述子の表に後から書き込むので、同じ名前は後ろの定義で決まります。`Object.assign` と同じ優先順位です。
- **元の定義を変えない**: 新しい空のオブジェクトに設定するので、もとの定義は何も変わりません。

## まとめ

- 定義を合成するときは、値だけでなく記述子（getter など）もコピーすると、仕組みが保たれる。
- 同じ名前は後ろの定義が勝つ、という規則を決めておく。
- 合成先を新しいオブジェクトにすると、もとの定義を壊さずに済む。
