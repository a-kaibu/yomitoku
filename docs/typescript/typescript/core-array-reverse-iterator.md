---
title: "配列を後ろから 1 つずつ取り出す。ジェネレータの例"
description: "TypeScript コンパイラの arrayReverseIterator。function* と yield を使い、配列を末尾から先頭へ順に返す。新しい配列を作らずに逆順に読める。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [1043, 1047]
function: "arrayReverseIterator"
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, データ構造]
---

## ひとことで

`arrayReverseIterator(array)` は、配列の要素を後ろから先頭へ、1 つずつ取り出していく関数です。戻り値はジェネレータ（`Generator`）で、`for...of` で読むと逆順に回せます。配列を逆にしたコピーを作らずに済みます。

```ts
for (const x of arrayReverseIterator([1, 2, 3])) {
  console.log(x) // 3, 2, 1 の順に出力される
}
```

## コード

```ts:line-numbers=1043
export function* arrayReverseIterator<T>(array: readonly T[]): Generator<T, void, unknown> {
    for (let i = array.length - 1; i >= 0; i--) {
        yield array[i];
    }
}
```

## 前提知識

- **ジェネレータ（`function*`）**: 途中で止まりながら、値を 1 つずつ返せる関数です。`yield` で値を渡し、次に呼ばれると続きから再開します。
- **`yield`**: ジェネレータの中で、値を外に渡して一時停止する文です。
- **`Generator<T, void, unknown>`**: ジェネレータの型です。`T` が渡す値の型、`void` が最後の戻り値の型です。
- **`for...of`**: イテレータ（順に値を返せるもの）から、値を 1 つずつ取り出して繰り返す文です。
- **逆順のループ**: `i = array.length - 1` から `i >= 0` まで `i--` で進めると、末尾から先頭へ回れます。

## 何をしているか

### 1. 末尾から先頭へ位置を進める

```ts:line-numbers=1044
    for (let i = array.length - 1; i >= 0; i--) {
```

位置 `i` を、配列の最後の添字から始めて、0 まで 1 ずつ減らします。

### 2. 要素を 1 つずつ yield する

```ts:line-numbers=1045
        yield array[i];
```

`yield array[i]` で、その位置の要素を外に渡します。関数はそこで一時停止し、次に呼ばれると続きを実行します。

## ここがすごい

- **逆順のコピーを作らない**: `[...array].reverse()` のように新しい配列を作ると、メモリを使います。ジェネレータは、必要な分だけ 1 つずつ値を出すので、無駄がありません。
- **途中で止められる**: `for...of` の途中で `break` すると、残りの要素は計算されません。大きな配列の先頭だけを見たいときに効きます。
- **元の配列を変えない**: 読むだけで、配列の中身には触りません。`reverse()` と違い、副作用がないことが保証されます。
- **型で読み取り専用を示す**: 引数は `readonly T[]` なので、この関数が配列を書き換えないことが型に表れています。

## まとめ

- 逆順に読むだけなら、ジェネレータで 1 つずつ値を返すと、コピーを作らずに済む。
- `yield` で値を渡すと、呼び出し側は必要な分だけ読める。
- `for...of` と組み合わせると、途中で止める処理も自然に書ける。
- 引数を読み取り専用の型にすると、副作用がないことを型で伝えられる。
