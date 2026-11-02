---
title: "配列の末尾要素を、無ければ undefined で取り出す"
description: "TypeScript のコンパイラの lastOrUndefined は、配列の末尾の要素を返す。配列が undefined や空のときは undefined を返す、先頭版の対になる関数。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [1116, 1118]
function: "lastOrUndefined"
difficulty: 1
format: 2
tags: [防御的プログラミング, 型システム, ジェネリクス]
---

## ひとことで

`lastOrUndefined(array)` は、配列の末尾の要素を返す関数です。配列がない場合や空の場合は、`undefined` を返します。先頭版の `firstOrUndefined` と対になる関数です。空の配列を渡しても例外にはならず、安全に `undefined` が返ります。

```ts
lastOrUndefined([1, 2, 3])  // 3
lastOrUndefined([])         // undefined
```

## コード

```ts:line-numbers=1116
export function lastOrUndefined<T>(array: readonly T[] | undefined): T | undefined {
    return array === undefined || array.length === 0 ? undefined : array[array.length - 1];
}
```

## 前提知識

- **末尾の添字**: 配列の最後の位置は、`長さ - 1` で表せます。
- **`undefined`**: 値が無いことを表す特別な値です。
- **ジェネリクス `<T>`**: 要素の型を、呼び出すたびに決める仕組みです。

## 何をしているか

### 1. 空かどうかを先に確かめる

```ts:line-numbers=1117
    return array === undefined || array.length === 0 ? undefined : array[array.length - 1];
```

配列が `undefined` か空なら `undefined` を返します。そうでなければ、長さから 1 を引いた位置の要素を返します。

## ここがすごい

- **末尾の位置を式で表す**: `array.length - 1` と書くことで、長さがいくつでも末尾を正しく指せます。
- **先頭版と同じ形**: 同じ条件分岐の形で書かれているので、2 つを並べて読むと違いが一目で分かります。
- **型で安全性を伝える**: 戻り値の `T | undefined` が、空の場合を呼び出し側に知らせます。

## まとめ

- `lastOrUndefined` は、配列の末尾を安全に取り出す。
- 配列が無い、または空なら `undefined` を返す。
- 先頭版の `firstOrUndefined` と同じ作りで、対になっている。
