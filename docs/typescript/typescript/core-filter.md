---
title: "1 つも捨てなければ元の配列をそのまま返す filter"
description: "TypeScript コンパイラ内部の filter。最初に条件から外れる要素が見つかるまでは何も作らず、全部残る場合は新しい配列を作らずに元の配列を返す。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [277, 296]
function: "filter"
difficulty: 2
tags: [最適化, メモリ管理, コンパイラ]
---

## ひとことで

TypeScript コンパイラが内部で使う `filter` は、標準の `Array.prototype.filter` と同じく「条件に合う要素だけを残す」関数です。
ただし、**1 つも取り除かれなかった場合は、新しい配列を作らずに元の配列そのものを返します**。

コンパイラは巨大なプログラムを扱うため、何百万回も呼ばれるこうした小さな関数で無駄な配列を作らないことが、全体の速度とメモリに効いてきます。

## コード

```ts:line-numbers=277
export function filter<T>(array: readonly T[] | undefined, f: (x: T) => boolean): readonly T[] | undefined {
    if (array !== undefined) {
        const len = array.length;
        let i = 0;
        while (i < len && f(array[i])) i++;
        if (i < len) {
            const result = array.slice(0, i);
            i++;
            while (i < len) {
                const item = array[i];
                if (f(item)) {
                    result.push(item);
                }
                i++;
            }
            return result;
        }
    }
    return array;
}
```

## 前提知識

- **`readonly T[] | undefined`**: 「読み取り専用の配列、または `undefined`」という型です。コンパイラの中では「配列がない」ことを `undefined` で表すことが多く、それも受け付けています。
- **`f: (x: T) => boolean`**: 要素を受け取って真偽値を返す関数の型です。
- **`array.slice(0, i)`**: 0 番目から `i - 1` 番目までをコピーした新しい配列を作ります。
- **`while (条件) 文;`**: 中身が 1 文なら波かっこを省略できます。281 行目は「条件を満たす間、`i` を進める」だけのループです。
- **参照の同一性**: JavaScript の配列はオブジェクトなので、`a === b` は「同じ配列そのものか」を比べます。中身が同じでも別の配列なら `false` です。

## 何をしているか

### 1. 先頭から「全部残る」区間を進む（279〜281 行目）

条件を満たす要素が続く間は、`i` を進めるだけで何も作りません。

### 2. 外れる要素が見つかったら、そこで初めて配列を作る（282〜293 行目）

`i` の手前までは全部残るとわかっているので、`slice(0, i)` でまとめてコピーします。`i` 番目は条件から外れたので飛ばし（284 行目）、残りは 1 つずつ調べて追加します。

### 3. 最後まで外れなかったら元の配列を返す（295 行目）

`undefined` が渡された場合も、ここでそのまま `undefined` が返ります。

```
filter([1, 2, 3], x => x > 0)  → 元の配列そのもの（新しい配列は作らない）
filter([1, -2, 3], x => x > 0) → slice で [1] を作り、3 を足して [1, 3]
```

## ここがすごい

- **よくある場合を最速に**: コンパイラの中では「念のため絞り込むが、実際にはほとんど何も消えない」場面がとても多くあります。その場合、配列の確保もコピーもゼロで済みます。
- **同一性で「変化なし」を伝えられる**: 結果が元の配列と `===` で等しければ、呼び出し元は「何も変わらなかった」と一瞬で判断できます。TypeScript コンパイラは、構文木の一部を作り直すかどうかをこうした同一性の比較で決めていて、変化がなければ古いものを使い回します。
- **途中までは一括コピー**: 外れる要素が見つかるまでの区間を `slice` 1 回でコピーするので、1 つずつ `push` するより速くなります。
- **注意点もある**: 元の配列が返ることがあるので、結果を書き換えると元の配列も変わってしまいます。そのため戻り値の型を `readonly` にして、書き換えを型で禁止しています。

## まとめ

- 「何も変わらなかったら元のものを返す」は、メモリ確保を減らす強力な最適化。
- 結果が `===` で同じなら変化なし、と判断できるのも利点。
- 元の配列を返す可能性があるなら、戻り値を `readonly` にして書き換えを防ぐ。
