---
title: "いつも同じ値を返す関数に、目印を付けて作る"
description: "zod の constantCatch は、いつも同じ値を返す関数を作り、目印となる印を付けて返す。別の場所で、この関数が定数を返すものだと見分けられるようにしている。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [1304, 1308]
function: "constantCatch"
difficulty: 2
format: 2
tags: [設計パターン, 関数型]
---

## ひとことで

`constantCatch(value)` は、いつも同じ値を返す関数を作る関数です。作った関数には、定数であることを示す印（フラグ）を付けて返します。

```ts
const f = constantCatch(42)
f()  // 42（何度呼んでも 42）
```

## コード

```ts:line-numbers=1304
export function constantCatch<T>(value: T): () => T {
  const fn = () => value;
  (fn as { [CONSTANT_CATCH]?: boolean })[CONSTANT_CATCH] = true;
  return fn;
}
```

## 前提知識

- **クロージャ**: 関数が、作られたときの周りの変数を覚えて使い続ける仕組みです。`() => value` は、渡された `value` を覚えた関数です。
- **関数に属性を付ける**: JavaScript では関数もオブジェクトなので、属性を追加できます。
- **シンボル**: 他と重ならない、特別なキーです。`CONSTANT_CATCH` は、この目印に使うキーです。

## 何をしているか

### 1. 値を返すだけの関数を作る

```ts:line-numbers=1305
  const fn = () => value;
```

渡された値を返すだけの関数を作ります。この関数は、呼ぶたびに同じ値を返します。

### 2. 目印を付ける

```ts:line-numbers=1306
  (fn as { [CONSTANT_CATCH]?: boolean })[CONSTANT_CATCH] = true;
```

関数に `CONSTANT_CATCH` という印を付け、`true` を入れます。型の注釈で、この印が任意で付けられる属性だと示しています。

### 3. 関数を返す

```ts:line-numbers=1307
  return fn;
```

印の付いた関数を、呼び出し側に返します。

## ここがすごい

- **印で見分ける**: 関数の中身を調べなくても、印を見るだけで「定数を返す関数」だと判断できます。
- **短い仕組み**: クロージャと属性の追加だけで、目印付きの関数を作っています。
- **型の注釈で安全に**: 印の型を注釈で示しているので、印を付ける側の書き間違いを型で見つけやすくなっています。

## まとめ

- `constantCatch` は、いつも同じ値を返す関数を作る。
- 関数に `CONSTANT_CATCH` の印を付け、定数だと見分けられるようにする。
- クロージャと属性の追加だけで、短く書かれている。
