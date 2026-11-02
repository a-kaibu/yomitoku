---
title: "パターンの印（Symbol）を見て、ただのオブジェクトと区別する"
description: "ts-pattern の isMatcher。P.number などの書き方は、ふつうのオブジェクトと同じ形をしている。Symbol を隠し印として付けておき、それがあるかで判定する。"
language: typescript
project: "ts-pattern"
repo: https://github.com/gvergnaud/ts-pattern
license: MIT
copyright: "Copyright (c) 2021 Gabriel Vergnaud"
commit: "f11be73acb18e1d653d4f252e7d75981d873a2e6"
file: src/internals/helpers.ts
lines: [16, 21]
function: "isMatcher"
difficulty: 2
format: 2
tags: [型システム, 設計パターン, 防御的プログラミング]
---

## ひとことで

`isMatcher(x)` は、値 `x` が ts-pattern の **パターン（マッチャー）** かどうかを判定する関数です。`P.number` や `P.string` などは、ふつうのオブジェクトに見えますが、特別な印（`Symbol`）を持っています。その印があるかどうかで、パターンかどうかを見分けています。

```ts
isMatcher(P.number)  // true
isMatcher({ a: 1 })  // false（ふつうのオブジェクト）
```

## コード

```ts:line-numbers=16
export const isMatcher = (
  x: unknown
): x is Matcher<unknown, unknown, MatcherType, SelectionType> => {
  const pattern = x as Matcher<unknown, unknown, MatcherType, SelectionType>;
  return pattern && !!pattern[symbols.matcher];
};
```

## 前提知識

- **`Symbol`**: 他と絶対に重ならない、一意な値を作る JavaScript の仕組みです。`Symbol.for('名前')` で作ると、同じ名前の Symbol は、どこから呼んでも同じ値になります。
- **プロパティのキーとしての Symbol**: オブジェクトのキーに文字列の代わりに Symbol を使うと、普通のループや `Object.keys` では見えにくい、隠しの印になります。
- **`!!`**: 値を真偽値（`true` か `false`）に変える書き方です。`!` を 2 回付けます。
- **型述語 `x is 型`**: 戻り値が `true` のとき、`x` を指定の型として扱うと TypeScript に伝えます。
- **`as`（型アサーション）**: 値の型を、開発者が指定した型として扱うことです。実行時には何もしません。

## 何をしているか

### 1. 値を、パターンの型として扱う

```ts:line-numbers=19
  const pattern = x as Matcher<unknown, unknown, MatcherType, SelectionType>;
```

まず `x` を「マッチャーかもしれないもの」として扱います。`as` は型だけの指定で、実行時には変換されません。

### 2. 印があるかを調べる

```ts:line-numbers=20
  return pattern && !!pattern[symbols.matcher];
```

`pattern` が `null` や `undefined` でないことを確かめてから、`symbols.matcher` というキーの値が真かを調べます。`!!` で真偽値にします。

## ここがすごい

- **印を隠してパターンを区別する**: `P.number` はふつうのオブジェクトのように作られていても、`symbols.matcher` というキーがあるかどうかで、パターンだと判定できます。利用者が見ても、わざわざ目印を意識する必要がありません。
- **文字列のキーと衝突しない**: 印に Symbol を使うので、利用者のオブジェクトが同じ名前のプロパティを持っていても、誤って判定されることがありません。
- **先に `null` を確かめる**: `pattern &&` で、`null` や `undefined` の値を最初に弾きます。そうしないと、プロパティを読もうとしてエラーになります。
- **型と実行時の判定を分ける**: 型の情報は `x is ...` で TypeScript に伝え、実際の判定は印だけで行う、という役割分担になっています。

## まとめ

- パターンはふつうのオブジェクトに見えても、隠しの Symbol で区別できる。
- `Symbol` をキーに使うと、利用者のプロパティ名と衝突しない。
- `&&` と `!!` を組み合わせると、`null` を弾きながら真偽値を得られる。
- 型述語と実行時の判定を分けると、型と動作の両方を安全に扱える。
