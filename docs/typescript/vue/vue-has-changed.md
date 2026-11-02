---
title: "NaN どうしを「変わっていない」と判定する Vue の hasChanged"
description: "Vue のリアクティビティが値の変化を見るときに使う hasChanged。Object.is を否定して使うことで、NaN が毎回変わったと判定されるのを防いでいる。"
language: typescript
project: "Vue.js"
repo: https://github.com/vuejs/core
license: MIT
copyright: "Copyright (c) 2018-present, Yuxi (Evan) You and Vue contributors"
commit: "24c9d0bffb2299635b8112a978d74a38723aaa10"
file: packages/shared/src/general.ts
lines: [143, 144]
function: "hasChanged"
difficulty: 1
format: 2
tags: [防御的プログラミング, 型システム, 設計パターン]
---

## ひとことで

`hasChanged(value, oldValue)` は、値が前の値から変わったかを判定する関数です。Vue が「状態が変わったので画面を更新する」かどうかを決めるときに使われます。`!==` ではなく `Object.is` を否定しているので、`NaN` は「変わっていない」と正しく判定されます。

```ts
hasChanged(1, 2)        // true（変わった）
hasChanged(NaN, NaN)    // false（変わっていない）
hasChanged(0, -0)       // true（Object.is は 0 と -0 を区別する）
```

## コード

```ts:line-numbers=143
export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue)
```

## 前提知識

- **`!==`（厳密な不一致）**: 2 つの値が同じでないかを調べる演算子です。`NaN !== NaN` は `true` になるため、`NaN` が入るたびに「変わった」と判定されてしまいます。
- **`Object.is(a, b)`**: 2 つの値が同じかを判定する組み込み関数です。`NaN` と `NaN` は同じとみなし、`0` と `-0` は違うとみなします。
- **リアクティビティ**: 値が変わると、それに依存している画面や計算結果が自動で更新される仕組みです。Vue の中核です。
- **否定 `!`**: 条件の真偽を反転させる演算子です。`!Object.is(…)` は「同じではない」を表します。
- **アロー関数**: `=>` で関数を短く書く書き方です。ここでは 1 行の式で値を返しています。

## 何をしているか

### 1. 同じかどうかを `Object.is` で調べる

```ts:line-numbers=144
  !Object.is(value, oldValue)
```

`Object.is` が `true` なら同じ値なので、先頭の `!` で `false` になります。逆に、違う値なら `true` を返します。この 1 行が判定の全部です。

### 2. 結果は真偽値で返す

関数の戻り値の型は `boolean` です。呼び出し側は、`if (hasChanged(newValue, oldValue))` のように、そのまま条件に使えます。

## ここがすごい

- **`NaN` の誤作動を防ぐ**: `NaN` を値に持つ状態は、普通の比較では毎回変わったことになります。そうなると、更新が止まらなくなる危険があります。`Object.is` で比べるだけで、この問題を避けられます。
- **`0` と `-0` を区別する**: `Object.is` は符号の違う 0 も別の値とみなします。値の変化を、より厳密に追えます。
- **1 行の式で済ませている**: 判定を関数にまとめるだけで、リアクティビティの核の部分が短く読めます。読み手は「変わったかどうかの基準は Object.is」と一度で理解できます。
- **コメントで意図を残す**: 直前のコメント「accounting for NaN」が、なぜ `Object.is` を使うのかを説明しています。コードの理由をコメントに残すよい例です。

## まとめ

- 値の変化の判定は、`!==` ではなく `Object.is` を使うと、`NaN` の誤判定を防げる。
- `Object.is` は `0` と `-0` も区別する。
- 判定の基準を 1 つの関数にまとめると、どこで変化を見ているかが分かりやすい。
- 一行の関数でも、なぜその書き方なのかをコメントで残すと、後から読む人の助けになる。
