---
title: "エラーメッセージを文字列として取り出す"
description: "zod の unwrapMessage は、文字列、message を持つオブジェクト、何も無い値のどれでも、エラーメッセージを文字列として取り出す。入力の形の違いを 1 行で吸収している。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [943, 945]
function: "unwrapMessage"
difficulty: 1
format: 2
tags: [エラー処理, 型システム]
---

## ひとことで

`unwrapMessage(message)` は、エラーメッセージを文字列として取り出す関数です。メッセージが文字列でも、`message` という属性を持つオブジェクトでも、どちらでも同じように扱えます。

```ts
unwrapMessage('失敗')              // '失敗'
unwrapMessage({ message: '失敗' })  // '失敗'
unwrapMessage(undefined)            // undefined
```

## コード

```ts:line-numbers=943
export function unwrapMessage(message: string | { message: string } | undefined | null): string | undefined {
  return typeof message === "string" ? message : message?.message;
}
```

## 前提知識

- **ユニオン型**: 「文字列か、別の形か、無いか」のように、複数の型のどれかを取る型です。`string | { message: string } | undefined | null` がこれに当たります。
- **三項演算子**: `条件 ? 値1 : 値2` の形で、条件によって値を選ぶ書き方です。
- **オプショナルチェーン `?.`**: `message?.message` のように、途中で `undefined` や `null` が来ても、エラーにせず `undefined` を返す書き方です。

## 何をしているか

### 1. 文字列ならそのまま返す

```ts:line-numbers=944
  return typeof message === "string" ? message : message?.message;
```

`message` が文字列なら、そのまま返します。

### 2. 文字列でなければ message 属性を取り出す

`message` がオブジェクトなら、その中の `message` 属性を取り出します。`null` や `undefined` のときは、オプショナルチェーンにより `undefined` になります。

## ここがすごい

- **入力の形を吸収する**: 呼び出す側が、文字列かオブジェクトかを気にせずに使えます。
- **例外が起きない**: `?.` のおかげで、`null` や `undefined` が来てもエラーになりません。
- **型と処理が一致**: 戻り値の `string | undefined` が、処理の結果とぴったり対応しています。

## まとめ

- `unwrapMessage` は、エラーメッセージを文字列として取り出す。
- 文字列はそのまま、オブジェクトは `message` 属性を返す。
- `?.` により、何も無い場合も安全に `undefined` を返す。
