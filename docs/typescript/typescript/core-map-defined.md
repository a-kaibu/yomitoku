---
title: "変換の結果が undefined のものを捨てながら、配列を作る"
description: "TypeScript コンパイラの mapDefined。map と filter を 1 回の走査にまとめ、変換結果が undefined の要素は結果に入れない。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [494, 505]
function: "mapDefined"
difficulty: 2
format: 2
tags: [イテレータ, データ構造, イディオム]
---

## ひとことで

`mapDefined(array, mapFn)` は、配列の各要素を変換しつつ、変換の結果が `undefined` になったものは捨てて、残りだけを集めた配列を返す関数です。`map` と `filter` を 1 回の走査にまとめた形です。

```ts
mapDefined([1, 2, 3, 4], (x) => (x % 2 === 0 ? x * 10 : undefined))  // [20, 40]
```

## コード

```ts:line-numbers=494
export function mapDefined<T, U>(array: readonly T[] | undefined, mapFn: (x: T, i: number) => U | undefined): U[] {
    const result: U[] = [];
    if (array !== undefined) {
        for (let i = 0; i < array.length; i++) {
            const mapped = mapFn(array[i], i);
            if (mapped !== undefined) {
                result.push(mapped);
            }
        }
    }
    return result;
}
```

## 前提知識

- **`map`**: 配列の要素を変換して、新しい配列を作るメソッドです。
- **`filter`**: 条件を満たす要素だけを残すメソッドです。
- **`undefined`**: 値が無いことを表す値です。ここでは「結果を出さない」という印として使われています。
- **`!== undefined`**: `undefined` でないかを判定します。

## 何をしているか

### 1. 結果の配列を用意する

```ts:line-numbers=495
    const result: U[] = [];
    if (array !== undefined) {
```

空の配列を作り、配列が `undefined` でないかを確かめます。

### 2. 変換して、値があるものだけを入れる

```ts:line-numbers=497
        for (let i = 0; i < array.length; i++) {
            const mapped = mapFn(array[i], i);
            if (mapped !== undefined) {
                result.push(mapped);
            }
        }
```

各要素を `mapFn` で変換し、結果が `undefined` でなければ、結果の配列に入れます。`undefined` の要素は、何もせず捨てられます。

### 3. 結果を返す

```ts:line-numbers=504
    return result;
```

値があった変換結果だけの配列を返します。

## ここがすごい

- **走査が 1 回で済む**: `map` の後に `filter` をすると、配列を 2 回回り、中間の配列も作ります。この関数は、1 回の走査で両方の仕事をします。
- **`undefined` を「捨てる」という意味に使う**: 変換の戻り値に `undefined` を返すだけで、その要素を除けます。専用の印を別に用意する必要がありません。
- **型で結果の形を示す**: 戻り値は `U[]` で、`undefined` が含まれないことが型に表れています。
- **`undefined` の入力も安全**: 配列が無いときは、空の配列を返します。

## まとめ

- 変換と選別を 1 回の走査でまとめると、効率がよい。
- 変換の結果が `undefined` の要素を捨てる、と決めると、専用の印なしで選別できる。
- 中間の配列を作らないよう、結果を直接組み立てる。
- 入力が `undefined` のときも空の配列を返すと、呼び出し側が安全に使える。
