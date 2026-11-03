---
title: 並び順を引数で指定して、整数を機械の並び順に変換する
description: Zig 標準ライブラリの mem.toNative。元の並び順を Endian の値で受け取り、littleToNative か bigToNative に振り分ける。データの並び順を引数で選べる入口。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [4207, 4212]
function: toNative
difficulty: 1
format: 2
tags: [低レイヤ, 型システム, イディオム]
---

## ひとことで

`toNative` は、整数を、指定された並び順から機械の並び順へ変換する関数です。並び順をどちらにするかは、引数で決めます。データの形式が、実行の前に分かっていないときにも使えます。

## コード

```zig:line-numbers=4207
pub fn toNative(comptime T: type, x: T, endianness_of_x: Endian) T {
    return switch (endianness_of_x) {
        .little => littleToNative(T, x),
        .big => bigToNative(T, x),
    };
}
```

## 前提知識

- **`Endian`**: 並び順を表す列挙型です。`.little` と `.big` の 2 つの値を持ちます。
- **`littleToNative` と `bigToNative`**: 同じファイルにある、それぞれの並び順からの変換です。
- **`switch` の振り分け**: 値ごとに、呼び出す関数を選ぶ書き方です。
- **引数で決める**: 並び順を型ではなく値として受け取るので、同じ関数を色々な形式に使えます。
- **`comptime T`**: 整数の型を、コンパイル時に決めます。

## 何をしているか

### 1. 並び順で振り分ける

```zig:line-numbers=4208
    return switch (endianness_of_x) {
        .little => littleToNative(T, x),
        .big => bigToNative(T, x),
    };
```

`switch` で、引数 `endianness_of_x` の値に応じて、`littleToNative` か `bigToNative` を呼びます。どちらも、`x` を機械の並び順にした値を返します。

## ここがすごい

- **入口が 1 つ**: 呼び出し側は、並び順の値を 1 つ渡すだけで済みます。どの変換が必要かを、自分で判断しなくてよいです。
- **振り分けは網羅的**: `switch` は `Endian` のすべての値を扱っているので、新しい並び順が増えると、コンパイラが指摘します。
- **変換の中身は分離**: 実際の並べ替えは、2 つの専用の関数に任せています。
- **データ形式が実行時に決まる場合に便利**: ファイルの先頭に並び順が書かれているような場合でも、同じ関数で扱えます。

## まとめ

- `toNative` は、並び順を引数で受け取り、対応する変換を呼びます。
- 変換の中身は、`littleToNative` と `bigToNative` に任せています。
- 1 つの入口で、2 つの並び順を扱えます。
