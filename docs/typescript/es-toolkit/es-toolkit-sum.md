---
title: "数の配列の合計を、先頭から順に足して求める"
description: "es-toolkit の sum は、数の配列の合計を for 文で先頭から順に足して求める。空の配列でも 0 を返す、単純で読みやすい形の集計。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/math/sum.ts
lines: [14, 22]
function: "sum"
difficulty: 1
format: 2
tags: [数値計算, イテレータ, 防御的プログラミング]
---

## ひとことで

`sum(nums)` は、数の配列に入っている値をすべて足した合計を返す関数です。配列が空なら `0` を返します。

```ts
sum([1, 2, 3])  // 6
sum([])         // 0
```

## コード

```ts:line-numbers=14
export function sum(nums: readonly number[]): number {
  let result = 0;

  for (let i = 0; i < nums.length; i++) {
    result += nums[i];
  }

  return result;
}
```

## 前提知識

- **累積（畳み込み）**: 配列の値を 1 つずつ見ながら、途中の結果に足していく計算の形です。`reduce` と同じ考え方を、ループで書いたものです。
- **`+=`**: 左の変数に右の値を足して、結果を左の変数に入れる代入の書き方です。
- **浮動小数点**: 小数を計算機で扱うときは、`0.1 + 0.2` のように誤差が出ることがあります。

## 何をしているか

### 1. 合計を 0 から始める

```ts:line-numbers=15
  let result = 0;
```

足し算の出発点を `0` にします。空の配列のときは、この `0` がそのまま答えになります。

### 2. 配列を先頭から順に足す

```ts:line-numbers=17
  for (let i = 0; i < nums.length; i++) {
    result += nums[i];
  }
```

添字 `i` を 0 から増やし、すべての要素を `result` に足していきます。

### 3. 合計を返す

```ts:line-numbers=21
  return result;
```

すべての要素を足し終えた値を返します。

## ここがすごい

- **空の配列に強い**: 出発点を `0` にしているので、空の配列で特別な処理を書く必要がありません。
- **素直なループ**: `reduce` を使わず、for 文で書いています。どの値が足されるかが、上から読むだけで分かります。
- **型で数だけを受け付ける**: 引数の型は `readonly number[]` なので、数以外の配列は受け付けず、元の配列も書き換えられません。

## まとめ

- `sum` は、数の配列の合計を先頭から順に足して求める。
- 出発点を `0` にしたので、空の配列は `0` になる。
- 引数は読み取り専用の数の配列で、元の配列は変わらない。
