---
title: "NaN・null・undefined を必ず最後に並べる比較関数"
description: "orderBy などの並べ替えで使う比較関数。特殊な値に順位を付けてから比べ、降順は引数を入れ替えるだけで実現しているので、降順でも特殊な値の順番が崩れない。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/_internal/compareValues.ts
lines: [1, 44]
function: "compareValues"
difficulty: 2
format: 2
tags: [ソート, 防御的プログラミング, 可読性]
---

## ひとことで

`compareValues(a, b, order)` は、並べ替えで使う **比較関数** です。`a` が先なら `-1`、`b` が先なら `1`、同じなら `0` を返します。`orderBy` や `sortBy` の内部で使われています。

工夫は、`NaN`・`null`・`undefined` という「普通に比べられない値」に **あらかじめ順位を付けておく** ことです。これにより、昇順で並べたとき、普通の値のあとに `NaN`、`null`、`undefined` の順で並びます。

## コード

::: code-group

```ts:line-numbers=1 [日本語訳]
// // 並べ替えのときに、NaN・null・undefined を他の値のあとに置くための重み付け。
// // 順番は NaN < null < undefined。
function nullishRank(value: any): number {
  if (Number.isNaN(value)) {
    return 1;
  }
  if (value === null) {
    return 2;
  }
  if (value === undefined) {
    return 3;
  }
  return 0;
}

function compareAscending(a: any, b: any): 0 | -1 | 1 {
  const aRank = nullishRank(a);
  const bRank = nullishRank(b);

  // // 順位で先に比べる: 通常の値(0) < NaN(1) < null(2) < undefined(3)。
  if (aRank < bRank) {
    return -1;
  }
  if (aRank > bRank) {
    return 1;
  }
  if (aRank !== 0) {
    return 0; // return 0; // 同じ種類の特殊な値どうしなので等しいとする。
  }

  // // 両方とも通常の値。
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

export function compareValues(a: any, b: any, order: 'asc' | 'desc'): 0 | -1 | 1 {
  // // 降順は、比較する 2 つを入れ替えた昇順の比較と同じ。
  return order === 'asc' ? compareAscending(a, b) : compareAscending(b, a);
}
```

```ts:line-numbers=1 [原文]
// Weight used to push `NaN`, `null` and `undefined` after other values when sorting,
// in the order `NaN` < `null` < `undefined`.
function nullishRank(value: any): number {
  if (Number.isNaN(value)) {
    return 1;
  }
  if (value === null) {
    return 2;
  }
  if (value === undefined) {
    return 3;
  }
  return 0;
}

function compareAscending(a: any, b: any): 0 | -1 | 1 {
  const aRank = nullishRank(a);
  const bRank = nullishRank(b);

  // Compare by rank first: regular value (0) < NaN (1) < null (2) < undefined (3).
  if (aRank < bRank) {
    return -1;
  }
  if (aRank > bRank) {
    return 1;
  }
  if (aRank !== 0) {
    return 0; // Both are the same kind of special value.
  }

  // Both are regular values.
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

export function compareValues(a: any, b: any, order: 'asc' | 'desc'): 0 | -1 | 1 {
  // Descending order is the ascending comparison with the operands swapped.
  return order === 'asc' ? compareAscending(a, b) : compareAscending(b, a);
}
```

:::

## 前提知識

- **比較関数**: `array.sort((a, b) => …)` に渡す関数です。負の値を返すと `a` が前、正の値を返すと `b` が前、`0` なら順番を変えません。
- **`NaN`**: 「数ではない」を表す値です。`NaN < 1` も `NaN > 1` も `false` になり、何とも大小が決まりません。
- **`null` と `undefined`**: どちらも「値がない」を表しますが別の値です。`null < 1` は `true`（`null` が `0` として扱われる）など、比べると予想外の結果になります。
- **`0 | -1 | 1`**: 戻り値がこの 3 つの数のどれかだけ、という型です。
- **`Number.isNaN(v)`**: `v` が `NaN` かを調べます。

## 何をしているか

### 1. 特殊な値に順位を付ける

```ts:line-numbers=3
function nullishRank(value: any): number {
  if (Number.isNaN(value)) {
    return 1;
  }
  if (value === null) {
    return 2;
  }
  if (value === undefined) {
    return 3;
  }
  return 0;
}
```
普通の値は `0`、`NaN` は `1`、`null` は `2`、`undefined` は `3` です。

### 2. 順位で比べる

```ts:line-numbers=16
function compareAscending(a: any, b: any): 0 | -1 | 1 {
  const aRank = nullishRank(a);
  const bRank = nullishRank(b);

  // Compare by rank first: regular value (0) < NaN (1) < null (2) < undefined (3).
  if (aRank < bRank) {
    return -1;
  }
  if (aRank > bRank) {
    return 1;
  }
  if (aRank !== 0) {
    return 0; // Both are the same kind of special value.
  }
```
まず順位を比べ、違えば順位の小さいほうが先です。順位が同じで `0` 以外なら、両方とも同じ種類の特殊な値なので「同じ」とします。

```ts:line-numbers=21
  if (aRank < bRank) {
    return -1;
  }
  if (aRank > bRank) {
    return 1;
  }
```

```ts:line-numbers=27
  if (aRank !== 0) {
    return 0; // Both are the same kind of special value.
  }
```


### 3. 普通の値どうしは `<` と `>` で

```ts:line-numbers=32
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
```
### 4. 降順は入れ替えるだけ

```ts:line-numbers=41
export function compareValues(a: any, b: any, order: 'asc' | 'desc'): 0 | -1 | 1 {
  // Descending order is the ascending comparison with the operands swapped.
  return order === 'asc' ? compareAscending(a, b) : compareAscending(b, a);
}
```
`'desc'` のときは、`a` と `b` を入れ替えて同じ関数を呼びます。

```
[3, null, 1, NaN, 2] を昇順に → [1, 2, 3, NaN, null]
```

## ここがすごい

- **比べられない値にも一貫した順番を与える**: `NaN` や `null` を `<` で比べると、結果が矛盾します（`NaN` は何よりも小さくも大きくもない）。比較関数が矛盾した答えを返すと、並べ替えのアルゴリズムが正しく動く保証がなくなり、結果がバラバラになります。順位を先に決めておけば、どんな組み合わせでも答えが一貫します。
- **降順を「引数の入れ替え」で表す**: 降順を「結果に `-1` を掛ける」と書くこともできますが、その場合は特殊な値の扱いも逆になります。この実装は入れ替えで作るので、関数のどの部分も昇順のことだけを考えればよく、ロジックを 1 か所にまとめられています。`compareValues` の中のコメントで、そのことをはっきり書いているのもわかりやすい点です。
- **小さな関数に分ける**: 順位付け、昇順の比較、向きの切り替えを別々の関数にしているので、それぞれが短く、どこで何をしているかがすぐにわかります。

## まとめ

- 比較関数は、どんな組み合わせでも矛盾しない答えを返す必要がある。
- 比べられない値には、先に順位を付けてから比べる。
- 降順は「引数を入れ替えて昇順の関数を呼ぶ」と、ロジックが 1 か所で済む。
