---
title: "配列の配列を 1 本にまとめる。reduce と concat の小さな flatMap"
description: "ts-pattern の flatMap。各要素から配列を作り、それらを concat で 1 本につなぐ。組み込みの flatMap が無い古い環境でも同じことができる、短い実装。"
language: typescript
project: "ts-pattern"
repo: https://github.com/gvergnaud/ts-pattern
license: MIT
copyright: "Copyright (c) 2021 Gabriel Vergnaud"
commit: "f11be73acb18e1d653d4f252e7d75981d873a2e6"
file: src/internals/helpers.ts
lines: [132, 135]
function: "flatMap"
difficulty: 1
format: 2
tags: [イテレータ, 関数型, 標準ライブラリ]
---

## ひとことで

`flatMap(xs, f)` は、配列の各要素に関数 `f` を当てて、その結果の配列をすべて 1 本の配列につなぐ関数です。`[1, 2].flatMap(x => [x, x])` は `[1, 1, 2, 2]` になります。ts-pattern では、入れ子のパターンから取り出し名を集めるときに使われています。

```ts
flatMap([1, 2], (x) => [x, x * 10]) // [1, 10, 2, 20]
```

## コード

```ts:line-numbers=132
export const flatMap = <a, b>(
  xs: readonly a[],
  f: (v: a) => readonly b[]
): b[] => xs.reduce<b[]>((acc, x) => acc.concat(f(x)), []);
```

## 前提知識

- **`reduce`**: 配列の要素を 1 つずつ見て、途中の結果（アキュムレーター）を育てていく組み込みメソッドです。最初の値（ここでは `[]`）から始まります。
- **`concat`**: 配列どうしを新しい配列として連結するメソッドです。元の配列は変えません。
- **ジェネリクス `<a, b>`**: 要素の型 `a` と結果の型 `b` を、呼び出しごとに決められるようにする書き方です。
- **`readonly`**: 配列を読むだけで、書き換えないことを型で表す指定です。
- **アロー関数 `(acc, x) => …`**: 短く関数を書く書き方です。

## 何をしているか

### 1. 空の配列から始める

```ts:line-numbers=135
): b[] => xs.reduce<b[]>((acc, x) => acc.concat(f(x)), []);
```

`reduce` の 2 つ目の引数 `[]` が、最初の途中結果です。ここから、要素を 1 つずつ足していきます。

### 2. 各要素の結果をつなぐ

同じ行の `(acc, x) => acc.concat(f(x))` の部分です。`x` ごとに `f(x)` で配列を作り、それを `acc` の後ろにつなぎます。`concat` は新しい配列を返すので、`acc` は書き換えられません。

## ここがすごい

- **1 行で書き切る**: 配列を作って順に push する書き方と比べて、途中の変数が要りません。関数の全体が 1 つの式になります。
- **型で結果の形を保証する**: `f` の戻り値は `readonly b[]` と決められているので、どんな関数を渡しても、結果は `b` の配列になります。
- **組み込みの `flatMap` と同じ働き**: JavaScript にも `flatMap` はありますが、古い環境では使えないことがあります。この 1 行を置けば、どの環境でも同じ結果になります。
- **元の配列を汚さない**: `push` で足すのではなく `concat` を使うので、途中の結果も含めて、元のデータが書き換わることがありません。

## まとめ

- `reduce` と `concat` を組み合わせると、配列の配列を 1 本にできる。
- 空の配列を初期値にすると、何も無い場合も正しく空の結果になる。
- `concat` は新しい配列を返すので、副作用が起きにくい。
- 型の指定で、関数の戻り値の形を守らせられる。
