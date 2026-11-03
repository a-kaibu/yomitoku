---
title: 列の先頭から、1 つの値が最初に現れる位置を探す
description: Zig 標準ライブラリの mem.findScalar。開始位置を 0 にして findScalarPos を呼ぶだけの関数。見つかれば添字を、なければ null を返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [1259, 1261]
function: findScalar
difficulty: 1
format: 2
tags: [文字列処理, イディオム, 標準ライブラリ]
---

## ひとことで

`findScalar` は、スライスの中で、指定した 1 つの値が最初に現れる位置を探す関数です。見つからなければ `null` を返します。文字列の中の 1 文字を探すときなどに使われます。

## コード

```zig:line-numbers=1259
pub fn findScalar(comptime T: type, slice: []const T, value: T) ?usize {
    return indexOfScalarPos(T, slice, 0, value);
}
```

## 前提知識

- **`?usize`**: 位置か、見つからないことを表す `null` のどちらかを持つ型です。
- **スカラー（scalar）**: 配列の要素 1 つの値のことです。配列全体ではなく、1 つの要素を探すという意味です。
- **`findScalarPos`**: 同じファイルにある関数で、指定の位置から探し始めます。
- **開始位置 0**: 先頭から探すので、0 を渡します。
- **`comptime T`**: 要素の型を、コンパイル時に決めます。

## 何をしているか

### 1. 先頭から探す位置を決める

```zig:line-numbers=1260
    return indexOfScalarPos(T, slice, 0, value);
```

`findScalarPos` に、先頭の 0 を開始位置として渡します。実際の探索は、そちらの関数に任せます。

## ここがすごい

- **1 行の委譲**: 探索の本体を `findScalarPos` に任せ、この関数は開始位置だけを決めます。
- **開始位置を変えられる版と対**: 途中から探したいときは、`findScalarPos` を直接使えます。
- **結果の型で見つからない場合を表す**: `?usize` なので、見つからない場合を、呼び出し側が確かめて扱えます。
- **末尾から探す版と対**: `findScalarLast` は、同じ値の最後の位置を探します。

## まとめ

- `findScalar` は、先頭から、値が最初に現れる位置を探します。
- 探索の本体は `findScalarPos` に任せ、開始位置 0 を渡します。
- 見つからなければ `null` を返します。
