---
title: "JSON.stringify が落とす BigInt を文字列にして残す"
description: "JSON.stringify の replacer として使う jsonStringifyReplacer。BigInt は JSON に直接書けず例外になるため、文字列に変換して例外を防ぐ。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [288, 291]
function: "jsonStringifyReplacer"
difficulty: 1
format: 2
tags: [API設計, 型システム, イディオム]
---

## ひとことで

`jsonStringifyReplacer` は、`JSON.stringify` に渡して使う **replacer**（変換ルール）です。JSON で表せない `BigInt` の値を、文字列に変えてから出力します。

```ts
JSON.stringify({ n: 10n }, jsonStringifyReplacer)  // '{"n":"10"}'
JSON.stringify({ n: 10n })                          // TypeError（BigInt は JSON にできない）
```

`BigInt` は、大きな整数を表す JavaScript の型です。JSON の仕様には対応する値がないため、そのまま渡すと例外になります。

## コード

```ts:line-numbers=288
export function jsonStringifyReplacer(_: string, value: any): any {
  if (typeof value === "bigint") return value.toString();
  return value;
}
```

## 前提知識

- **`JSON.stringify(値, replacer)`**: オブジェクトを JSON の文字列にします。第 2 引数の `replacer` は、キーと値を 1 組ずつ受け取って、書き出す値を決める関数です。
- **`BigInt`**: `10n` のように末尾に `n` を付けて書く整数の型です。通常の `number` より大きな値を扱えます。
- **`typeof`**: 値の型を文字列で返します。`typeof 10n` は `'bigint'` です。
- **`toString()`**: 値を文字列にします。

## 何をしているか

### 1. BigInt かどうかを調べる

```ts:line-numbers=289
  if (typeof value === "bigint") return value.toString();
```

値の型が `'bigint'` なら、文字列に変換して返します。

### 2. それ以外はそのまま返す

```ts:line-numbers=290
  return value;
```

BigInt 以外の値は、変換せずそのまま JSON に書かせます。

## ここがすごい

- **例外を防ぐ変換を 1 か所に**: `replacer` は JSON に書き出されるすべての値を通るので、深くネストしたデータの中の BigInt も見逃しません。
- **元の値を変えない**: BigInt の値そのものは変わらず、書き出すときだけ文字列になります。データを扱う側の型はそのままです。
- **読み戻しは別に決める**: 文字列にしたあとで数値に戻すかどうかは、読む側の仕事です。書き出しの関数が決めつけないことで、用途に合わせた変換ができます。

## まとめ

- JSON にできない値は、`replacer` で書き出す前に変換できる。
- 変換は、データ全体を通る 1 か所にまとめるとよい。
- 書き出す形と読み戻す形は、分けて考える。
