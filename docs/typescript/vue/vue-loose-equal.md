---
title: "中身が同じなら等しいとみなす。Vue の looseEqual"
description: "Vue の looseEqual。配列・オブジェクト・日付・Symbol などを、参照ではなく中身で比べる。循環参照で無限に進まないよう、比較済みの組を記録している。"
language: typescript
project: "Vue.js"
repo: https://github.com/vuejs/core
license: MIT
copyright: "Copyright (c) 2018-present, Yuxi (Evan) You and Vue contributors"
commit: "24c9d0bffb2299635b8112a978d74a38723aaa10"
file: packages/shared/src/looseEqual.ts
lines: [91, 119]
function: "looseEqual"
difficulty: 3
format: 2
tags: [再帰, 防御的プログラミング, 型システム]
---

## ひとことで

`looseEqual(a, b)` は、2 つの値が「中身として同じか」を判定する関数です。`===` は同じ参照（同じ場所にあるもの）でなければ `false` ですが、この関数は配列やオブジェクトの中身を順に比べます。Vue の `v-model` などで、選ばれた値を一覧の中から探すときに使われます。

```ts
looseEqual([1, 2], [1, 2])            // true（中身が同じ）
looseEqual({ a: 1 }, { a: 1 })        // true
looseEqual(new Date(0), new Date(0))  // true（同じ時刻）
```

## コード

```ts:line-numbers=91
export function looseEqual(a: any, b: any, seen?: ComparisonState): boolean {
  if (a === b) return true
  let aValidType = isDate(a)
  let bValidType = isDate(b)
  if (aValidType || bValidType) {
    return aValidType && bValidType ? a.getTime() === b.getTime() : false
  }
  aValidType = isSymbol(a)
  bValidType = isSymbol(b)
  if (aValidType || bValidType) {
    return a === b
  }
  aValidType = isArray(a)
  bValidType = isArray(b)
  if (aValidType || bValidType) {
    return aValidType && bValidType
      ? looseCompareNested(a, b, seen, looseCompareArrays)
      : false
  }
  aValidType = isObject(a)
  bValidType = isObject(b)
  if (aValidType || bValidType) {
    if (!aValidType || !bValidType) {
      return false
    }
    return looseCompareNested(a, b, seen, looseCompareObjects)
  }
  return String(a) === String(b)
}
```

## 前提知識

- **参照と値**: オブジェクトや配列の `===` は、同じ場所を指しているかを比べます。中身が同じでも、別の場所なら `false` です。
- **`Date` の比較**: 日付は `getTime()` で、1970 年からのミリ秒に直すと比べられます。
- **循環参照**: オブジェクトが自分自身を（間接的に）指している状態です。中身を再帰的に比べると、永久に終わらなくなるおそれがあります。
- **`seen`（比較済みの記録）**: 比べ途中の組を覚えておく引数です。同じ組に戻ってきたら、比較を打ち切るために使います。
- **`String(a) === String(b)`**: 最後の手段として、文字列に変えて比べます。数と文字列の一致などを扱います。

## 何をしているか

### 1. 参照が同じなら即座に真

```ts:line-numbers=92
  if (a === b) return true
```

同じ値なら、中身を調べる必要はありません。ここで終わります。

### 2. 日付・Symbol・配列・オブジェクトを、型ごとに比べる

```ts:line-numbers=93
  let aValidType = isDate(a)
  let bValidType = isDate(b)
  if (aValidType || bValidType) {
    return aValidType && bValidType ? a.getTime() === b.getTime() : false
```

日付なら時刻の数で比べます。Symbol は `===` だけで比べます。配列とオブジェクトは、`looseCompareNested` という関数で中身を比べます。片方だけがその型なら、`false` です。

### 3. その他は文字列にして比べる

```ts:line-numbers=118
  return String(a) === String(b)
```

ここまでの型に当てはまらない値は、文字列にして比べます。たとえば、数の `1` と文字列の `'1'` は等しいとみなされます。`v-model` の入力値を比べる場面で、この緩さが役立ちます。

## ここがすごい

- **型ごとに比べ方を決める**: 日付は時刻、Symbol は参照、配列とオブジェクトは中身、と型に合った方法を選んでいます。どれも正しい意味で比べられます。
- **循環参照への備え**: `seen` に比較済みの組を覚えておくことで、同じ組に戻ったときに無限ループを防ぎます。この仕組みは、`looseCompareNested` の中で使われています。
- **「ゆるい」比較の名前**: `looseEqual` の「ゆるい」は、`===` より寛容な比べ方を指します。文字列と数を同じとみなす点が、その名前の理由です。
- **早く抜ける順序**: 同じ参照をまず確かめ、型の判定を順に行います。多くの比較が、最初の数行で終わります。

## まとめ

- 参照ではなく中身を比べるには、型ごとに比べ方を決めると確実。
- 日付は時刻の数、Symbol は `===`、配列やオブジェクトは再帰、と分けられる。
- 循環参照には、比較済みの記録で対処する。
- 「ゆるい」比較は、入力値を扱う場面で便利だが、何と何を同じとみなすかを明確にしておく。
