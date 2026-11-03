---
title: 1 ビット広い型で、値以上の最小の 2 のべきを作る
description: Zig 標準ライブラリの math.ceilPowerOfTwoPromote。値から 1 を引いた値のビット長を使い、1 ビット広い型で 2 のべきを作る。0 は入力として許されない。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [1216, 1223]
function: ceilPowerOfTwoPromote
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 型システム]
---

## ひとことで

`ceilPowerOfTwoPromote` は、値以上で最も小さい 2 のべき乗を、1 ビット広い型で返す関数です。結果が元の型に収まらなくても、広い型なら値を正しく表せます。`ceilPowerOfTwo` の中で使われている部品です。

## コード

```zig:line-numbers=1216
pub fn ceilPowerOfTwoPromote(comptime T: type, value: T) std.meta.Int(@typeInfo(T).int.signedness, @typeInfo(T).int.bits + 1) {
    comptime assert(@typeInfo(T) == .int);
    comptime assert(@typeInfo(T).int.signedness == .unsigned);
    assert(value != 0);
    const PromotedType = std.meta.Int(@typeInfo(T).int.signedness, @typeInfo(T).int.bits + 1);
    const ShiftType = std.math.Log2Int(PromotedType);
    return @as(PromotedType, 1) << @as(ShiftType, @intCast(@typeInfo(T).int.bits - @clz(value - 1)));
}
```

## 前提知識

- **切り上げの 2 のべき**: 値以上で、2 のべき乗のうち最も小さいものです。
- **先頭の 0 の数（`@clz`）**: 整数の先頭から続く 0 の数です。値のビット長を求めるのに使えます。
- **`std.meta.Int`**: 符号とビット数を指定して、整数の型を作る関数です。
- **`Log2Int`**: 2 を底とする対数の、整数の型です。シフト量の型として使います。
- **`value - 1`**: 切り上げの 2 のべきを求めるときに、値から 1 を引いてから、ビット長を見ます。

## 何をしているか

### 1. 入力を確かめて広い型を作る

```zig:line-numbers=1217
    comptime assert(@typeInfo(T) == .int);
    comptime assert(@typeInfo(T).int.signedness == .unsigned);
    assert(value != 0);
    const PromotedType = std.meta.Int(@typeInfo(T).int.signedness, @typeInfo(T).int.bits + 1);
```

符号なしの整数であることを確かめ、`value` が 0 でないことを `assert` で確かめます。1 ビット広い型 `PromotedType` を作ります。

### 2. ビット長からシフト量を求めて 1 を動かす

```zig:line-numbers=1221
    const ShiftType = std.math.Log2Int(PromotedType);
    return @as(PromotedType, 1) << @as(ShiftType, @intCast(@typeInfo(T).int.bits - @clz(value - 1)));
```

`value - 1` の先頭の 0 の数 `@clz` から、ビット長を求めます。そのビット長の位置に `1` を置いて、2 のべきを作ります。`value - 1` を使うのは、`value` がちょうど 2 のべきのときに、その値を返すためです。

## ここがすごい

- **1 回の `@clz` で済む**: ループで 2 を掛け続けるよりも、ビット長の計算 1 回で結果が決まります。
- **`value - 1` の工夫**: `value` が 2 のべきのとき、`value - 1` のビット長は、その指数より 1 小さくなります。そのため、ちょうどの値を正しく返せます。
- **広い型で溢れを防ぐ**: 元の型の最大値を超える切り上げも、広い型で表せます。溢れの判定を、呼び出し側で行えます。
- **シフト量の型を選ぶ**: `Log2Int` を使うので、シフト量が型の範囲に収まります。

## まとめ

- `ceilPowerOfTwoPromote` は、ビット長から 2 のべきを作り、1 ビット広い型で返します。
- `value - 1` のビット長を使うので、2 のべきの値もそのまま返せます。
- 0 は入力として許されず、`assert` で確かめます。
