---
title: 値以上で最も小さい 2 のべきを作り、溢れは型を広げて検出する
description: Zig 標準ライブラリの math.ceilPowerOfTwo。1 ビット広い型で計算して、結果が元の型に収まらない場合を Overflow のエラーとして返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [1228, 1239]
function: ceilPowerOfTwo
difficulty: 3
format: 2
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`ceilPowerOfTwo` は、与えられた値以上で最も小さい 2 のべき乗を返す関数です。たとえば 33 なら 64 を返します。結果が元の型に収まらないときは、エラーとして知らせます。

## コード

```zig:line-numbers=1228
pub fn ceilPowerOfTwo(comptime T: type, value: T) (error{Overflow}!T) {
    comptime assert(@typeInfo(T) == .int);
    const info = @typeInfo(T).int;
    comptime assert(info.signedness == .unsigned);
    const PromotedType = std.meta.Int(info.signedness, info.bits + 1);
    const overflowBit = @as(PromotedType, 1) << info.bits;
    const x = ceilPowerOfTwoPromote(T, value);
    if (overflowBit & x != 0) {
        return error.Overflow;
    }
    return @as(T, @intCast(x));
}
```

## 前提知識

- **切り上げの 2 のべき乗**: 値以上で、2 のべき乗のうち最も小さいものです。`floorPowerOfTwo` の反対の働きです。
- **符号なしの型の制約**: 関数は符号なしの整数だけを受け付けます。`comptime assert` で、型を確かめています。
- **溢れ（オーバーフロー）**: 結果が型の最大値を超えることです。たとえば `u8` で 200 以上の値の切り上げは、256 になり `u8` に収まりません。
- **`std.meta.Int`**: 指定した符号とビット数の型を作ります。ここでは 1 ビット広い型を作っています。
- **`ceilPowerOfTwoPromote`**: 1 ビット広い型で、切り上げの 2 のべきを計算する関数です。同じファイルにあります。

## 何をしているか

### 1. 型を確かめて 1 ビット広い型を用意する

```zig:line-numbers=1229
    comptime assert(@typeInfo(T) == .int);
    const info = @typeInfo(T).int;
    comptime assert(info.signedness == .unsigned);
    const PromotedType = std.meta.Int(info.signedness, info.bits + 1);
```

型が符号なしの整数であることを確かめます。そのうえで、ビット数を 1 増やした型 `PromotedType` を作ります。

### 2. 溢れの印を用意して計算する

```zig:line-numbers=1233
    const overflowBit = @as(PromotedType, 1) << info.bits;
    const x = ceilPowerOfTwoPromote(T, value);
```

`overflowBit` は、元の型のビット数の位置に立つ 1 のビットです。`ceilPowerOfTwoPromote` で、広い型のまま切り上げの値を求めます。

### 3. 溢れを確かめて返す

```zig:line-numbers=1235
    if (overflowBit & x != 0) {
        return error.Overflow;
    }
    return @as(T, @intCast(x));
```

結果に `overflowBit` が立っていれば、元の型に収まらないので `Overflow` を返します。収まるなら、元の型に変換して返します。

## ここがすごい

- **1 ビット広げて溢れを検出**: 切り上げの結果が、元の型の最大値を超えるかどうかを、広い型の上位ビットで見られます。
- **エラーで知らせる**: 溢れを黙って折り返すのではなく、`error.Overflow` として返します。呼び出し側が、必ず対応できます。
- **型の制約を明示**: `comptime assert` で、符号なしの整数だけを受け付けています。誤った型は、コンパイルの時点で止まります。
- **`floorPowerOfTwo` と対**: 切り下げと切り上げが、同じ考え方で揃えられています。

## まとめ

- `ceilPowerOfTwo` は、値以上で最も小さい 2 のべきを返します。
- 1 ビット広い型で計算し、上位ビットで溢れを検出します。
- 溢れは `error.Overflow` として返されます。
