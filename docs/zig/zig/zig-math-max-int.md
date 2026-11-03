---
title: 整数型の最大値を、ビット数から 2 のべきの計算で求める
description: Zig 標準ライブラリの math.maxInt。ビット数と符号の有無から、1 を左にずらして 1 を引くだけで、その整数型の最大値をコンパイル時に求める。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [1443, 1448]
function: maxInt
difficulty: 2
format: 2
tags: [数値計算, ビット演算, 型システム]
---

## ひとことで

`maxInt` は、整数の型が表せる最大値を返す関数です。たとえば `u8` なら 255、`i8` なら 127 を返します。値は、型のビット数から計算で求められ、コンパイル時に決まります。

## コード

```zig:line-numbers=1443
pub fn maxInt(comptime T: type) comptime_int {
    const info = @typeInfo(T);
    const bit_count = info.int.bits;
    if (bit_count == 0) return 0;
    return (1 << (bit_count - @intFromBool(info.int.signedness == .signed))) - 1;
}
```

## 前提知識

- **ビット数**: 整数の型が使うビットの数です。`u8` は 8、`i32` は 32 です。
- **符号なしの最大値**: n ビットなら、すべてのビットが 1 の値、つまり `2^n - 1` です。`u8` なら 255 です。
- **符号付きの最大値**: 最上位ビットを符号に使うので、値の範囲は `2^(n-1) - 1` までです。`i8` なら 127 です。
- **`comptime_int`**: コンパイル時の任意精度の整数です。型の値をコンパイル時に計算できます。
- **`@intFromBool`**: 真偽値を 0 か 1 の整数に変換する組み込み関数です。

## 何をしているか

### 1. ビット数が 0 の場合を除く

```zig:line-numbers=1445
    const bit_count = info.int.bits;
    if (bit_count == 0) return 0;
```

ビット数が 0 の型は、表せる値が 0 だけなので、最大値は 0 です。

### 2. 2 のべきから 1 を引く

```zig:line-numbers=1447
    return (1 << (bit_count - @intFromBool(info.int.signedness == .signed))) - 1;
```

符号付きなら、符号のぶんだけビット数を 1 減らします。その上で `1 << n` から 1 を引くと、表せる最大値になります。符号の有無を、`@intFromBool` で 0 か 1 として計算に入れています。

## ここがすごい

- **計算だけで求まる**: 型ごとに値を書き並べる必要がありません。ビット数さえあれば、どの整数型にも使えます。
- **コンパイル時に確定**: `comptime_int` の値なので、配列の大きさなどにもそのまま使えます。
- **符号の違いを 1 つの式で**: 符号付きと符号なしの違いを、ビット数を 1 減らすかどうかだけで表しています。
- **`minInt` と対になる**: 同じファイルの `minInt` は、最小値を同じ考え方で求めます。

## まとめ

- `maxInt` は、整数型の最大値を、ビット数から `2^n - 1` 系の式で求めます。
- 符号付きの型は、符号のビットを除いて計算します。
- 結果はコンパイル時に決まり、配列の大きさなどに使えます。
