---
title: "エラーが valibot 由来のものかを、instanceof で判定する"
description: "valibot の isValiError。例外が ValiError のインスタンスかを instanceof で調べる。TypeScript では、判定の結果が型の絞り込みにもなる。"
language: typescript
project: "valibot"
repo: https://github.com/fabian-hiller/valibot
license: MIT
copyright: "Copyright (c) Fabian Hiller"
commit: "d72f76fcf70ccfa0a5ca341b80da1d440ac60b11"
file: library/src/utils/isValiError/isValiError.ts
lines: [16, 22]
function: "isValiError"
difficulty: 1
format: 2
tags: [エラー処理, 型システム, 設計パターン]
---

## ひとことで

`isValiError(error)` は、捕まえた例外が valibot の `ValiError` かどうかを判定する関数です。`try { parse(...) } catch (e) { ... }` のような場面で、valibot のエラーとそれ以外のエラーを分けるために使います。`true` のときは、TypeScript の型も `ValiError` に絞り込まれます。

```ts
try {
  parse(schema, input)
} catch (error) {
  if (isValiError(error)) {
    console.log(error.issues) // ここでは ValiError として扱える
  }
}
```

## コード

```ts:line-numbers=16
export function isValiError<
  TSchema extends
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
>(error: unknown): error is ValiError<TSchema> {
  return error instanceof ValiError;
}
```

## 前提知識

- **例外（exception）**: 処理が続けられない問題が起きたときに投げられる値です。`throw` で投げ、`try...catch` で受け取ります。
- **`instanceof`**: ある値が、あるクラスから作られたかを判定する演算子です。`error instanceof ValiError` は、`ValiError` のインスタンスなら `true` です。
- **型述語 `error is 型`**: 判定が `true` のとき、引数の型を指定の型として扱うと TypeScript に伝える書き方です。
- **`unknown`**: 型が分からない値を表す型です。`catch` で受け取った例外は、`unknown` として扱うのが安全です。

## 何をしているか

### 1. 型の情報を宣言する

```ts:line-numbers=16
export function isValiError<
  TSchema extends
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
>(error: unknown): error is ValiError<TSchema> {
```

ジェネリクス `TSchema` は、スキーマの型です。戻り値の型 `error is ValiError<TSchema>` で、判定が真のときは、そのスキーマ用の `ValiError` だと伝えます。

### 2. クラスのインスタンスかを確かめる

```ts:line-numbers=21
  return error instanceof ValiError;
```

`error instanceof ValiError` で、例外が `ValiError` から作られたものかを調べます。結果をそのまま返します。

## ここがすごい

- **クラスで種類を区別する**: エラーの種類を、メッセージの文字列ではなく、クラスで判定しています。メッセージが変わっても、判定は壊れません。
- **型の絞り込みを同時に行う**: 判定と型の絞り込みを 1 つの関数で行うので、`if` の中では、`error.issues` などが安全に使えます。
- **1 行の本体**: 判定は `instanceof` の 1 つだけです。判定の基準が、クラスの名前で明確になっています。
- **外部のエラーを壊さない**: 関係のないエラーには `false` を返すだけです。例外を捕まえた側が、そのまま再び投げるといった処理も書きやすくなります。

## まとめ

- 例外の種類は、メッセージではなく、クラス（`instanceof`）で判定すると確実。
- 型述語を付けると、判定の後に型が絞り込まれて、安全に使える。
- `catch` で受け取った例外は `unknown` なので、判定してから使うのが基本。
- 判定を小さな関数にまとめると、エラー処理の書き方が統一される。
