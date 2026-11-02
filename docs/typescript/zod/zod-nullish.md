---
title: "値が null か undefined かを判定する"
description: "zod の nullish は、値が null か undefined のどちらかかを判定する。どちらも無い値とみなす、よく使われる判定を短く書いている。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [317, 319]
function: "nullish"
difficulty: 1
format: 2
tags: [防御的プログラミング, 型システム]
---

## ひとことで

`nullish(input)` は、値が `null` か `undefined` のどちらかであるかを判定する関数です。どちらも「値が無い」と扱う場面で使われます。

```ts
nullish(null)       // true
nullish(undefined)  // true
nullish(0)          // false
nullish('')         // false
```

## コード

```ts:line-numbers=317
export function nullish(input: any): boolean {
  return input === null || input === undefined;
}
```

## 前提知識

- **`null`**: 値が無いことを、わざと表す特別な値です。
- **`undefined`**: 値が与えられていないことを表す、JavaScript の特別な値です。
- **`nullish`**: `null` と `undefined` をまとめて呼ぶ言葉です。`0` や空文字列は含みません。どちらも「値が無い」状態なので、値を受け取る前の検査で広く使われます。

## 何をしているか

### 1. 2 つの値を比べる

```ts:line-numbers=318
  return input === null || input === undefined;
```

`input` が `null` か `undefined` のどちらかなら `true` を返します。`===` で比べるので、`0` や `false` や空文字列は対象になりません。

## ここがすごい

- **値の種類を厳密に分ける**: `==` を使わず `===` で比べるので、`0` や `''` を誤って「無い」と判断しません。
- **短く読みやすい**: 1 行の条件式で、判定の意図がそのまま読めます。
- **型の考え方と合う**: 「値が無い」を 2 種類まとめて扱えるので、オプションの値を扱う処理で役立ちます。

## まとめ

- `nullish` は、値が `null` か `undefined` かを判定する。
- `0` や空文字列は「無い」とはみなさない。
- 厳密な比較 `===` を使い、判定の範囲を明確にしている。
