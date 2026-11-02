---
title: "負の添字で、配列の末尾から好きな位置の値を取り出す"
description: "es-toolkit の at。添字の配列を受け取り、負の数は末尾からの位置として読む。小数は切り捨て、不正な値は 0 として扱う。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/array/at.ts
lines: [16, 33]
function: "at"
difficulty: 2
format: 2
tags: [データ構造, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

`at(arr, indices)` は、配列から複数の位置の値を、まとめて取り出す関数です。位置には負の数も使えます。`-1` なら最後の要素、`-2` なら最後から 2 番目です。たとえば `at(['a', 'b', 'c'], [0, -1])` は `['a', 'c']` を返します。

```ts
at(['a', 'b', 'c'], [0, -1])  // ['a', 'c']
at(['a', 'b', 'c'], [-2, 1])  // ['b', 'b']
```

## コード

```ts:line-numbers=16
export function at<T>(arr: readonly T[], indices: readonly number[]): T[] {
  const result = new Array<T>(indices.length);
  const length = arr.length;

  for (let i = 0; i < indices.length; i++) {
    let index = indices[i];

    index = Number.isInteger(index) ? index : Math.trunc(index) || 0;

    if (index < 0) {
      index += length;
    }

    result[i] = arr[index];
  }

  return result;
}
```

## 前提知識

- **添字（インデックス）**: 配列の位置を表す数です。最初の要素は `0` です。
- **負の添字**: 末尾から数えた位置を表します。`-1` は最後の要素です。`arr.at(-1)` という組み込みメソッドも、同じ考え方です。
- **`Number.isInteger`**: 整数かどうかを判定します。
- **`Math.trunc`**: 小数点以下を切り捨てる関数です。`Math.trunc(1.9)` は `1` です。
- **`new Array<T>(n)`**: 長さ `n` の配列を先に作ります。型の指定 `<T>` で、要素の型を決めています。

## 何をしているか

### 1. 結果の配列を先に用意する

```ts:line-numbers=17
  const result = new Array<T>(indices.length);
  const length = arr.length;
```

受け取った添字の数と同じ長さの配列を作り、元の配列の長さを覚えておきます。

### 2. 添字を整数にそろえる

```ts:line-numbers=21
    let index = indices[i];

    index = Number.isInteger(index) ? index : Math.trunc(index) || 0;
```

添字が小数なら切り捨てます。整数でもなく、切り捨てても数にならない値（`NaN` など）は、`|| 0` によって `0` として扱います。

### 3. 負の添字を末尾からの位置に直す

```ts:line-numbers=25
    if (index < 0) {
      index += length;
    }

    result[i] = arr[index];
```

負の添字なら、配列の長さを足して、先頭からの位置に直します。`-1` に長さ `3` を足すと `2` で、最後の要素になります。最後に、その位置の値を結果に入れます。

## ここがすごい

- **負の添字を自然に扱える**: 末尾から数える書き方を、長さを足すだけで先頭からの位置に変えています。複雑な分岐がありません。
- **不正な値でも落ちない**: 小数や `NaN` を受け取っても、0 として扱って結果を返します。外部からの入力で、関数が止まることを防いでいます。
- **結果の長さを先に決める**: 添字の数と同じ長さで配列を作るので、途中で配列の大きさが変わりません。
- **`|| 0` の使い方**: `Math.trunc` の結果が `NaN` になったときに、`0` に置き換えています。この 1 語で、不正な入力の扱いが決まっています。

## まとめ

- 負の添字は、配列の長さを足すと先頭からの位置に直せる。
- 添字は、整数にそろえてから使うと、配列の参照が安全になる。
- 結果の配列を先に作ると、大きさが一定で扱いやすい。
- `|| 0` のような短い書き方で、不正な値の既定の扱いを決められる。
