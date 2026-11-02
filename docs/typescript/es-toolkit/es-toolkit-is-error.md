---
title: "値がエラーのオブジェクトかを判定する"
description: "es-toolkit の isError は、値が Error のインスタンスかを instanceof で判定する。型ガードになっていて、判定後はエラーとして message などを使える。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/predicate/isError.ts
lines: [14, 16]
function: "isError"
difficulty: 1
format: 2
tags: [型システム, エラー処理]
---

## ひとことで

`isError(value)` は、値が `Error` のオブジェクトかどうかを判定する関数です。`try...catch` で受け取った値が、本当にエラーかを確かめるときによく使われます。

```ts
isError(new Error('失敗'))  // true
isError('失敗')              // false（文字列はエラーのオブジェクトではない）
```

## コード

```ts:line-numbers=14
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}
```

## 前提知識

- **`Error` オブジェクト**: 例外として投げられる、エラーの情報を持つオブジェクトです。`message` という属性で、説明の文字列を持ちます。
- **`instanceof`**: 値が、右のクラスから作られたものかを調べる演算子です。
- **`catch` の値**: JavaScript では、`catch` で受け取る値は、エラーとは限りません。文字列や数が投げられることもあるため、確かめる必要があります。

## 何をしているか

### 1. Error から作られたかを調べる

```ts:line-numbers=14
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}
```

値が `Error` から作られたものなら `true` を返します。戻り値の型 `value is Error` により、判定の後は `message` などの属性を型の上でも安全に使えます。

## ここがすごい

- **投げられた値を安全に確かめる**: 任意の値を受け取れるので、`catch` の値を調べるのに向いています。
- **判定と型が一致する**: 型ガードにより、判定の後で型を書き直さずに、エラーとして扱えます。
- **文字列を弾く**: 文字列で書かれたエラーメッセージは対象外になるので、型の違いで処理を分けられます。

### 注意点

- `instanceof` は、別の実行環境で作られた `Error` には `false` を返すことがあります。その点は、判定の結果に影響します。

## まとめ

- `isError` は、値が `Error` のオブジェクトかを `instanceof` で判定する。
- 型ガードにより、判定後はエラーとして扱える。
- 文字列などのエラー以外の値は、`false` になる。
