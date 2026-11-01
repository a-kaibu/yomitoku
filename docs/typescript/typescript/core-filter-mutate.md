---
title: "書き込み位置を別に持って配列をその場で絞り込む"
description: "新しい配列を作らずに、配列そのものから条件に合わない要素を取り除く filterMutate。読み出し位置と書き込み位置の 2 本の指で詰めていき、最後に length を縮める。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [299, 308]
function: "filterMutate"
difficulty: 1
tags: [アルゴリズム, メモリ管理, イディオム]
---

## ひとことで

`filterMutate(array, f)` は、**配列そのものを書き換えて**、条件 `f` に合わない要素を取り除きます。新しい配列は作りません。

```ts
const a = [1, 2, 3, 4, 5]
filterMutate(a, x => x % 2 === 1)
// a は [1, 3, 5] になる
```

「読む位置」と「書く位置」の 2 つを別々に進めていく、**2 本の指（ツーポインタ）** と呼ばれる基本テクニックの見本です。

## コード

```ts:line-numbers=299
export function filterMutate<T>(array: T[], f: (x: T, i: number, array: T[]) => boolean): void {
    let outIndex = 0;
    for (let i = 0; i < array.length; i++) {
        if (f(array[i], i, array)) {
            array[outIndex] = array[i];
            outIndex++;
        }
    }
    array.length = outIndex;
}
```

## 前提知識

- **`array.length = n`**: JavaScript では、配列の `length` に小さい値を代入すると、**それより後ろの要素が切り捨てられます**。
- **`f: (x: T, i: number, array: T[]) => boolean`**: 要素・位置・配列全体を受け取って、残すかどうかを返す関数の型です。標準の `filter` のコールバックと同じ形です。
- **`void`**: 戻り値がないことを表す型です。結果は引数の配列そのものに反映されます。

## 何をしているか

`outIndex` は「次に残す要素を書き込む位置」、`i` は「今読んでいる位置」です。

1. `i` を 0 から最後まで進める（301 行目）。
2. 残す要素なら、`outIndex` の位置に書き込んで `outIndex` を 1 進める（302〜305 行目）。
3. 最後に `length` を `outIndex` に縮めて、後ろの不要な部分を切り捨てる（307 行目）。

`[1, 2, 3, 4, 5]` から奇数だけを残す例です。

```
i=0: 1 を残す → a[0]=1, out=1   [1,2,3,4,5]
i=1: 2 は捨てる                 [1,2,3,4,5]
i=2: 3 を残す → a[1]=3, out=2   [1,3,3,4,5]
i=3: 4 は捨てる                 [1,3,3,4,5]
i=4: 5 を残す → a[2]=5, out=3   [1,3,5,4,5]
length = 3                       [1,3,5]
```

書き込み位置は読み込み位置を絶対に追い越さないので、まだ読んでいない要素を上書きしてしまうことはありません。

## ここがすごい

- **1 回の走査で済む**: 要素を見つけるたびに `splice` で取り除く書き方だと、取り除くたびに後ろの要素を全部ずらすので、最悪で要素数の 2 乗の時間がかかります。この方法なら、各要素を 1 回ずつ見るだけです。
- **追加のメモリがいらない**: 新しい配列を作らないので、大きな配列でもメモリを余分に使いません。同じ配列を多くの場所から参照している場合でも、全員が絞り込み後の内容を見られます。
- **順番が保たれる**: 残す要素は元の順番のまま前に詰められます。
- **`length` の代入という言語の性質を活用**: 最後の切り捨てを、ループではなく代入 1 回で済ませています。

## まとめ

- 「読む位置」と「書く位置」を分けると、配列をその場で 1 回の走査で絞り込める。
- `splice` を繰り返すより圧倒的に速い。
- JavaScript では `length` に代入して配列を短くできる。
