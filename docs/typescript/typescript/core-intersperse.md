---
title: "配列の要素の間に、区切りの要素を差し込む"
description: "TypeScript コンパイラの intersperse。配列の要素の間に、指定した要素を入れた新しい配列を作る。要素が 1 つ以下なら元の配列をそのまま返す。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [121, 131]
function: "intersperse"
difficulty: 1
format: 2
tags: [データ構造, イディオム, ジェネリクス]
---

## ひとことで

`intersperse(input, element)` は、配列の要素と要素の間に、同じ `element` を差し込んだ新しい配列を作る関数です。`intersperse([1, 2, 3], 0)` は `[1, 0, 2, 0, 3]` になります。コンパイラがエラーメッセージや、引数の一覧を作るときに、区切りを入れるために使われます。

```ts
intersperse([1, 2, 3], 0)  // [1, 0, 2, 0, 3]
intersperse([1], 0)        // [1]（要素が 1 つなら区切りはいらない）
```

## コード

```ts:line-numbers=121
export function intersperse<T>(input: T[], element: T): T[] {
    if (input.length <= 1) {
        return input;
    }
    const result: T[] = [];
    for (let i = 0, n = input.length; i < n; i++) {
        if (i !== 0) result.push(element);
        result.push(input[i]);
    }
    return result;
}
```

## 前提知識

- **区切り（セパレータ）**: 要素をつなぐときに、間に入れる値のことです。`join` で文字列を作るときの `', '` などが身近な例です。
- **配列の長さ**: `input.length` で、要素の数が分かります。
- **`push`**: 配列の末尾に要素を追加します。
- **`if` の 1 行形式**: `if (cond) 文;` のように、波かっこを省いて 1 つの文だけを書く書き方です。

## 何をしているか

### 1. 要素が少ないときは、そのまま返す

```ts:line-numbers=122
    if (input.length <= 1) {
        return input;
    }
```

要素が 0 個か 1 個なら、間に入れるものがありません。新しい配列を作らずに、元の配列を返します。

### 2. 先頭以外の前に区切りを入れる

```ts:line-numbers=126
    for (let i = 0, n = input.length; i < n; i++) {
        if (i !== 0) result.push(element);
        result.push(input[i]);
    }
```

各要素の前に、先頭でなければ `element` を入れてから、要素そのものを入れます。こうして、要素と要素の間にだけ区切りが入ります。

## ここがすごい

- **少ない場合の近道**: 要素が 1 つ以下なら、新しい配列を作る必要がありません。よくある場合の無駄を省いています。
- **先頭だけを例外にする**: 「`i` が 0 でなければ区切りを入れる」という 1 つの条件で、間だけに入れられます。末尾に余計な区切りも付きません。
- **結果の長さを正確に確保**: 入力が `n` 個なら、区切りは `n - 1` 個で、結果は `2n - 1` 個です。ずれのない単純な規則です。
- **`push` で一気に組み立てる**: 中間の配列を作らずに、結果を 1 本のループで作ります。

## まとめ

- 要素の間に区切りを入れるには、先頭以外の要素の前に区切りを入れる。
- 要素が 1 つ以下なら、新しい配列を作らずに返すと効率的。
- 結果の長さは、入力の長さから規則的に決まる。
- 区切りを入れる処理は、文字列の `join` や、表示の整形で広く使われる。
