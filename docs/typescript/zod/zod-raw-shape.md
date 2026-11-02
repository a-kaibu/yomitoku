---
title: "スキーマの shape を、ゲッターを通さずに元の形で取り出す"
description: "zod の rawShape は、定義の shape 属性を読み出す。ゲッターなら、その raw 版を取り出し、ふつうの値なら値をそのまま返す、二通りの取り出し方を一つにまとめている。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [391, 394]
function: "rawShape"
difficulty: 2
format: 2
tags: [型システム, 設計パターン]
---

## ひとことで

`rawShape(def)` は、スキーマの定義にある `shape` という属性を取り出す関数です。`shape` が「読むと計算される」ゲッターだった場合は、その元の形（`raw`）を取り出します。

```ts
rawShape({ shape: { a: 1 } })  // { a: 1 }（ふつうの値はそのまま）
```

## コード

```ts:line-numbers=391
export function rawShape(def: any): Record<PropertyKey, any> | undefined {
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  return desc?.get ? (desc.get as ShapeGetter).raw : desc?.value;
}
```

## 前提知識

- **ゲッター**: 属性を読んだときに、関数が動いて値を返す仕組みです。読むたびに値を計算できます。
- **プロパティの記述子**: 属性の値や、ゲッターかどうかなどの情報をまとめたものです。`Object.getOwnPropertyDescriptor` で取り出せます。
- **`raw`**: ゲッターに付けられた、元の形の値を指す目印です。ここでは `ShapeGetter` という型で扱われています。

## 何をしているか

### 1. 属性の記述子を取り出す

```ts:line-numbers=392
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
```

`shape` 属性が、ゲッターなのか、ふつうの値なのかを調べるために、記述子を取り出します。

### 2. ゲッターなら raw、そうでなければ値を返す

```ts:line-numbers=393
  return desc?.get ? (desc.get as ShapeGetter).raw : desc?.value;
```

ゲッターがあれば、その `raw` を返します。ゲッターでなければ、記述子の `value` をそのまま返します。`?.` により、属性が無い場合も安全に `undefined` になります。

## ここがすごい

- **二つの形を一つの関数で扱う**: ゲッターでも普通の値でも、呼び出す側は同じ書き方で `shape` を取り出せます。
- **元の形を取り出せる**: ゲッターを実行せず、元の定義をそのまま読めるので、計算の副作用を避けられます。
- **存在しない場合に強い**: オプショナルチェーン `?.` により、`shape` が無くてもエラーになりません。

## まとめ

- `rawShape` は、定義の `shape` を、ゲッターなら元の形、そうでなければ値として取り出す。
- 記述子を調べて、ゲッターかどうかを判断する。
- `?.` により、属性が無くても安全に `undefined` になる。
