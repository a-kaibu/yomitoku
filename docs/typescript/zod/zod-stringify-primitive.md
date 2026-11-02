---
title: "値をコードに書ける文字列にする。BigInt には n を付ける"
description: "zod の stringifyPrimitive は、プリミティブな値をコードの一部として書ける文字列にする。BigInt は末尾に n を付け、文字列は引用符で囲む。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [720, 724]
function: "stringifyPrimitive"
difficulty: 1
format: 2
tags: [文字列処理, イディオム, 型システム]
---

## ひとことで

`stringifyPrimitive(value)` は、数・文字列・BigInt・真偽値などの基本的な値を、JavaScript のコードの一部として書ける文字列に変える関数です。zod がエラーメッセージや生成コードの中に値を書き出すときに使われます。

```ts
stringifyPrimitive(10n)     // "10n"（BigInt には末尾に n が付く）
stringifyPrimitive('abc')   // "abc"（引用符が付いた文字列）
stringifyPrimitive(true)    // "true"
```

## コード

```ts:line-numbers=720
export function stringifyPrimitive(value: any): string {
  if (typeof value === "bigint") return value.toString() + "n";
  if (typeof value === "string") return `"${value}"`;
  return `${value}`;
}
```

## 前提知識

- **プリミティブ（基本の値）**: オブジェクトや配列ではない、数・文字列・真偽値・BigInt などの値のことです。
- **BigInt**: 非常に大きな整数を扱うための型です。`10n` のように、末尾に `n` を付けて書きます。普通の数 `10` とは型が違います。
- **テンプレート文字列**: バッククォートで囲んだ文字列の中に、`${…}` で値を埋め込む書き方です。
- **`typeof`**: 値の種類を文字列で返す演算子です。`typeof 10n` は `"bigint"` を返します。
- **`toString()`**: 値を文字列に変えるメソッドです。BigInt も `toString()` で数字の文字列になります。

## 何をしているか

### 1. BigInt には `n` を付ける

```ts:line-numbers=721
  if (typeof value === "bigint") return value.toString() + "n";
```

BigInt の値は、ただの数字の文字列では区別できません。`10` と `10n` を区別するために、末尾に `n` を付けます。こうすると、生成したコードを読み直したときに、同じ型として扱われます。

### 2. 文字列は引用符で囲む

```ts:line-numbers=722
  if (typeof value === "string") return `"${value}"`;
```

文字列は、両端を `"` で囲みます。中身は、そのまま埋め込まれます。

### 3. それ以外は、そのまま文字列にする

```ts:line-numbers=723
  return `${value}`;
```

数・真偽値・`null`・`undefined` などは、テンプレート文字列で文字列に変えるだけで、コードとして正しい形になります。

## ここがすごい

- **型ごとの違いを 1 か所で扱う**: BigInt の `n` と、文字列の引用符を、型の判定で書き分けています。呼び出し側は、値の種類を気にしなくて済みます。
- **極端に短い関数**: 3 行で、基本の値のすべてを扱えるように作られています。テンプレート文字列の働きに、多くを任せています。
- **コードとして読み直せる形**: 出力は JavaScript として正しい書き方なので、生成したコードを評価しても、元の値に戻ります。
- **名前のとおりの役割**: 「プリミティブを文字列化する」という名前に、処理の内容がそのまま表れています。

## まとめ

- 基本の値をコードに書くときは、型によって書き方を変える必要がある。
- BigInt は末尾の `n` で、普通の数と区別する。
- 文字列は引用符で囲んで、コードの中で文字列として読めるようにする。
- 型の判定を 1 か所にまとめると、生成の仕組みが読みやすくなる。
