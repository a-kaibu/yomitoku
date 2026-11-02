---
title: "条件に合う要素の数を、配列を 1 回走査して数える"
description: "TypeScript コンパイラの countWhere。配列の要素のうち、条件を満たすものの数を返す。配列が undefined なら 0 を返す。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [242, 253]
function: "countWhere"
difficulty: 1
format: 2
tags: [データ構造, イテレータ, 防御的プログラミング]
---

## ひとことで

`countWhere(array, predicate)` は、配列の中で条件を満たす要素の数を返す関数です。たとえば、奇数の個数を数えるときは、`countWhere([1, 2, 3], x => x % 2 === 1)` で `2` が得られます。配列が `undefined` のときは、エラーにせず `0` を返します。

```ts
countWhere([1, 2, 3, 4], (x) => x > 2)  // 2
countWhere(undefined, (x) => x > 2)     // 0
```

## コード

```ts:line-numbers=242
export function countWhere<T>(array: readonly T[] | undefined, predicate: (x: T, i: number) => boolean): number {
    let count = 0;
    if (array !== undefined) {
        for (let i = 0; i < array.length; i++) {
            const v = array[i];
            if (predicate(v, i)) {
                count++;
            }
        }
    }
    return count;
}
```

## 前提知識

- **述語（predicate）**: 要素を受け取って、`true` か `false` を返す関数のことです。条件を表します。
- **`undefined` の扱い**: TypeScript コンパイラでは、配列が無いことがよくあります。そのため、`undefined` を受け取っても安全に動くように作られています。
- **ループと添字**: `for (let i = 0; …)` で、位置を 1 つずつ進める書き方です。
- **`count++`**: 変数の値を 1 増やします。

## 何をしているか

### 1. 配列が無ければ 0

```ts:line-numbers=243
    let count = 0;
    if (array !== undefined) {
```

数える前に、`count` を `0` にして、配列が `undefined` でないかを確かめます。`undefined` なら、何も数えずに `0` を返します。

### 2. 条件を満たす要素を数える

```ts:line-numbers=245
        for (let i = 0; i < array.length; i++) {
            const v = array[i];
            if (predicate(v, i)) {
                count++;
            }
        }
```

配列の要素を先頭から順に調べ、`predicate` が `true` を返すたびに `count` を 1 増やします。位置 `i` も渡すので、位置による条件も書けます。

## ここがすごい

- **`undefined` を例外にしない**: 配列が無いときも、正しく `0` を返します。呼び出し側は、存在を確かめる分岐を書かずに済みます。
- **一度だけ走査する**: 配列を 1 回回るだけで、数え終わります。配列を作り直す `filter(...).length` のような書き方より、無駄がありません。
- **新しい配列を作らない**: 結果は数だけなので、中間の配列が要りません。メモリの使用も少なくなります。
- **述語の形で条件を渡す**: 条件を関数として渡すので、どんな判定にも使えます。

## まとめ

- 条件に合う要素の数は、配列を 1 回走査して数えると効率がよい。
- `undefined` の入力を先に扱うと、呼び出し側が楽になる。
- 中間の配列を作らず、数だけを返すと無駄が少ない。
- 条件を関数で渡す形は、汎用的な部品として使い回せる。
