---
title: "パターンが P.optional かどうかを、マッチャーの種類で判定する"
description: "ts-pattern の isOptionalPattern。パターンの中に P.optional が書かれているかを、マッチャーの種類（matcherType）で判定する。省略可能なキーを扱うために使われる。"
language: typescript
project: "ts-pattern"
repo: https://github.com/gvergnaud/ts-pattern
license: MIT
copyright: "Copyright (c) 2021 Gabriel Vergnaud"
commit: "f11be73acb18e1d653d4f252e7d75981d873a2e6"
file: src/internals/helpers.ts
lines: [24, 28]
function: "isOptionalPattern"
difficulty: 2
format: 2
tags: [型システム, 設計パターン, 防御的プログラミング]
---

## ひとことで

`isOptionalPattern(x)` は、パターンが `P.optional(...)` で作られたものかを判定する関数です。`P.optional` は、オブジェクトのキーがあってもなくても一致させたいときに使います。この関数は、マッチャーの種類が `'optional'` かを確かめて、判定します。

```ts
isOptionalPattern(P.optional(P.number))  // true
isOptionalPattern(P.number)              // false
isOptionalPattern(42)                    // false（パターンでもない）
```

## コード

```ts:line-numbers=24
const isOptionalPattern = (
  x: unknown
): x is Matcher<unknown, unknown, 'optional', SelectionType> => {
  return isMatcher(x) && x[symbols.matcher]().matcherType === 'optional';
};
```

## 前提知識

- **マッチャー**: ts-pattern のパターンの一種で、値を一致させる仕組みを持つものです。`P.number` や `P.optional(...)` などがあります。
- **`matcherType`**: マッチャーが、どの種類かを表す文字列です。`'optional'`、`'select'` などの値があります。
- **`symbols.matcher`**: マッチャーの印として使われる Symbol です。この印が付いているものが、マッチャーです。
- **型述語 `x is 型`**: 判定が真のとき、値の型を `Matcher<…, 'optional', …>` として扱うと TypeScript に伝える書き方です。
- **`&&`（かつ）**: 両方の条件が真のときだけ、真になります。ここでは「マッチャーであり、かつ種類が optional」です。

## 何をしているか

### 1. 型の宣言で、結果の型を示す

```ts:line-numbers=24
const isOptionalPattern = (
  x: unknown
): x is Matcher<unknown, unknown, 'optional', SelectionType> => {
```

戻り値の型は、マッチャーの中でも `'optional'` の種類のものです。判定が真なら、後の処理で、その型として安全に扱えます。

### 2. マッチャーで、種類を確かめる

```ts:line-numbers=27
  return isMatcher(x) && x[symbols.matcher]().matcherType === 'optional';
```

まず `isMatcher` で、マッチャーかを確かめます。次に、マッチャーの `matcherType` を取り出して、`'optional'` と比べます。

## ここがすごい

- **先にマッチャーかを確かめる**: `matcherType` を読む前に `isMatcher` を通すので、ただの値に対して誤って読み取ることがありません。
- **判定の部品を組み合わせる**: 「マッチャーかどうか」の判定を再利用して、その上に「種類は何か」という問いを重ねています。
- **種類を文字列で持つ**: `matcherType` を文字列にしておくと、デバッグのときにも内容が分かります。
- **省略可能なキーの判定に使える**: 前に見た `matchPattern` は、この関数を使って、キーが無くても一致させるかを決めます。

## まとめ

- 特定の種類のパターンを判定するには、まずパターンかどうかを確かめてから、種類を見る。
- 判定の部品を積み重ねると、問いを段階的に絞り込める。
- 種類を文字列で持つと、読むときにも意味が分かりやすい。
- 型述語で結果の型を示すと、呼び出し側が安全に扱える。
