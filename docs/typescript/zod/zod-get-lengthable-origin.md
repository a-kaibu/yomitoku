---
title: "長さを持つ値の種類を、配列・文字列・その他に分ける"
description: "zod の getLengthableOrigin は、値が配列か文字列かを判定し、どちらでもなければ unknown を返す。長さの制限を検査するメッセージを作るときに使われる。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [1032, 1036]
function: "getLengthableOrigin"
difficulty: 1
format: 2
tags: [型システム, 防御的プログラミング, 文字列処理]
---

## ひとことで

`getLengthableOrigin(input)` は、値が「長さ（length）を持つ種類」のどれかを判定する関数です。配列なら `"array"`、文字列なら `"string"`、それ以外は `"unknown"` を返します。zod は、「最大 5 個まで」「最大 5 文字まで」のようなエラー文を作るときに、この結果を使います。

```ts
getLengthableOrigin([1, 2])  // "array"
getLengthableOrigin('abc')   // "string"
getLengthableOrigin(123)     // "unknown"
```

## コード

```ts:line-numbers=1032
export function getLengthableOrigin(input: any): "array" | "string" | "unknown" {
  if (Array.isArray(input)) return "array";
  if (typeof input === "string") return "string";
  return "unknown";
}
```

## 前提知識

- **`Array.isArray`**: 値が配列かどうかを判定する組み込み関数です。`typeof` では配列を見分けられないので、この関数を使います。
- **`typeof`**: 値の種類を文字列で返す演算子です。`typeof 'abc'` は `"string"` です。
- **判別の結果を文字列で返す**: 戻り値を `"array"` などの文字列にすると、呼び出し側は `switch` や `if` で、メッセージを切り替えられます。
- **`unknown`**: 「分からない」「該当しない」を表す値です。型の上では、`"array" | "string" | "unknown"` のどれかだと決まっています。

## 何をしているか

### 1. 配列かどうかを先に調べる

```ts:line-numbers=1033
  if (Array.isArray(input)) return "array";
```

配列は `typeof` では `"object"` になってしまうので、`Array.isArray` で先に判定します。

### 2. 文字列かを調べる

```ts:line-numbers=1034
  if (typeof input === "string") return "string";
```

次に `typeof` で、文字列かどうかを判定します。

### 3. どちらでもなければ unknown

```ts:line-numbers=1035
  return "unknown";
```

配列でも文字列でもない値は、`"unknown"` とします。ここで例外を投げずに、呼び出し側が判断できる印を返します。

## ここがすごい

- **判定の順序が大事**: `typeof` で配列を調べると `"object"` になるので、`Array.isArray` を先に呼ぶ必要があります。この順序を守ることで、配列を正しく見分けられます。
- **例外を投げない**: 長さを持たない値でもエラーにせず、`"unknown"` という印を返します。呼び出し側が、そのまま分岐できます。
- **型の範囲が限られている**: 戻り値は 3 つの文字列だけなので、エラー文の作り分けが簡単になります。
- **1 つの関数に判定を集約**: 配列か文字列かの判定が 1 か所にまとまり、メッセージを作る側は種類だけを気にすればよくなります。

## まとめ

- 配列と文字列は、`Array.isArray` と `typeof` で見分ける。
- `typeof` は配列を `"object"` と返すので、順序に注意する。
- 対象外の値は、例外ではなく専用の印（`"unknown"`）で返すと、扱いやすい。
- 判定の結果を文字列で返すと、後の分岐が読みやすくなる。
