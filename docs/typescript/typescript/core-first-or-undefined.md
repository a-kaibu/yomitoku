---
title: "配列の先頭要素を、無ければ undefined で取り出す"
description: "TypeScript のコンパイラの firstOrUndefined は、配列の先頭要素を返す。配列が undefined や空のときは undefined を返し、範囲外の添字を避けている。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [1083, 1085]
function: "firstOrUndefined"
difficulty: 1
format: 2
tags: [防御的プログラミング, 型システム, ジェネリクス]
---

## ひとことで

`firstOrUndefined(array)` は、配列の先頭の要素を返す関数です。配列がない場合や空の場合は、エラーにせず `undefined` を返します。

```ts
firstOrUndefined([1, 2])   // 1
firstOrUndefined([])       // undefined
firstOrUndefined(undefined) // undefined
```

## コード

```ts:line-numbers=1083
export function firstOrUndefined<T>(array: readonly T[] | undefined): T | undefined {
    return array === undefined || array.length === 0 ? undefined : array[0];
}
```

## 前提知識

- **`undefined`**: 値が無いことを表す、JavaScript の特別な値です。
- **添字**: 配列の位置を表す数です。先頭は `0` です。空の配列の `array[0]` は `undefined` になります。
- **ジェネリクス `<T>`**: 中に入る要素の型を、呼び出すたびに決める仕組みです。

## 何をしているか

### 1. 空かどうかを先に確かめる

```ts:line-numbers=1084
    return array === undefined || array.length === 0 ? undefined : array[0];
```

配列が `undefined` か、長さが 0 なら `undefined` を返します。そうでなければ、先頭の要素 `array[0]` を返します。

## ここがすごい

- **例外を投げない**: 空の配列でも安全に呼べるので、呼び出す側で長さを確かめる手間が省けます。
- **型で注意を促す**: 戻り値は `T | undefined` なので、呼び出す側は `undefined` の場合を扱うように型で促されます。
- **中身の型を保つ**: ジェネリクスにより、要素の型は元の配列のまま保たれます。

## まとめ

- `firstOrUndefined` は、配列の先頭を安全に取り出す。
- 配列が無い、または空なら `undefined` を返す。
- 戻り値の型に `undefined` が含まれるので、呼び出し側も確認しやすい。
