---
title: "オブジェクトの属性を、一覧に出ない形で定義する"
description: "zod の hide は、own を使って属性を列挙不可の形で定義する。Object.keys の一覧に出さずに、内部の値を持たせるための小さな関数。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [1165, 1167]
function: "hide"
difficulty: 1
format: 2
tags: [データ構造, 設計パターン]
---

## ひとことで

`hide(inst, key, value)` は、オブジェクトに属性を定義しますが、`Object.keys` などの一覧には出ない形にする関数です。内部だけで使う値を持たせるときに使われます。

```ts
const obj = hide({}, 'secret', 1)
Object.keys(obj)  // []（一覧には出ない）
obj.secret        // 1（値は読める）
```

## コード

```ts:line-numbers=1165
export function hide<T>(inst: object, key: PropertyKey, value: T): T {
  return own(inst, key, value, false);
}
```

## 前提知識

- **列挙可能（enumerable）**: `Object.keys` や `for...in` で、属性が一覧に出る性質です。
- **`own` 関数**: 同じファイルにある関数で、属性を自分の値として定義します。この関数は、その `own` を列挙不可の設定で呼び出します。
- **引数の既定値**: `own` の 4 番目の引数 `enumerable` は、省略すると `true` になります。

## 何をしているか

### 1. 列挙不可の設定で own を呼ぶ

```ts:line-numbers=1166
  return own(inst, key, value, false);
```

`own` に `false` を渡して、属性を一覧に出ない形で定義します。値そのものは `own` が返すので、そのまま戻り値になります。

## ここがすごい

- **一覧に出さない**: 中身の値は読めるのに、`Object.keys` や JSON 化の対象から外れます。
- **仕組みを再利用する**: 定義の仕方は `own` に任せ、この関数は列挙の設定だけを変えています。
- **名前が意図を表す**: `hide` と読めば、隠すための定義だと分かります。

## まとめ

- `hide` は、属性を一覧に出ない形で定義し、値を返す。
- 値は読めるが、`Object.keys` などには現れない。
- 定義の仕組みは `own` に任せ、列挙の設定だけを変えている。
