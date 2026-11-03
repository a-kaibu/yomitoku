---
title: 下限と上限を両方含む範囲の整数を、負の数も含めて一様に作る
description: Zig 標準ライブラリの Random.intRangeAtMost。符号付きの整数を 2 の補数で符号なしに読み替え、幅を uintAtMost に渡してから下限を足し戻す。両端を含む範囲。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random.zig
lines: [254, 268]
function: Random.intRangeAtMost
difficulty: 3
format: 2
tags: [乱数, 数値計算, 型システム]
---

## ひとことで

`intRangeAtMost` は、下限以上、上限以下の整数を、一様な乱数で作る関数です。`intRangeLessThan` と違い、上限そのものも含まれます。サイコロの目のように、両端が出てほしい場合に使います。

## コード

::: code-group

```zig:line-numbers=254 [日本語訳]
pub fn intRangeAtMost(r: Random, comptime T: type, at_least: T, at_most: T) T {
    assert(at_least <= at_most);
    const info = @typeInfo(T).int;
    if (info.signedness == .signed) {
        // 2 の補数だと、この計算はとても簡単になる。
        const UnsignedT = std.meta.Int(.unsigned, info.bits);
        const lo: UnsignedT = @bitCast(at_least);
        const hi: UnsignedT = @bitCast(at_most);
        const result = lo +% r.uintAtMost(UnsignedT, hi -% lo);
        return @bitCast(result);
    } else {
        // 符号付きの実装でも動くが、ここではより厳密な演算子を使える。
        return at_least + r.uintAtMost(T, at_most - at_least);
    }
}
```

```zig:line-numbers=254 [原文]
pub fn intRangeAtMost(r: Random, comptime T: type, at_least: T, at_most: T) T {
    assert(at_least <= at_most);
    const info = @typeInfo(T).int;
    if (info.signedness == .signed) {
        // Two's complement makes this math pretty easy.
        const UnsignedT = std.meta.Int(.unsigned, info.bits);
        const lo: UnsignedT = @bitCast(at_least);
        const hi: UnsignedT = @bitCast(at_most);
        const result = lo +% r.uintAtMost(UnsignedT, hi -% lo);
        return @bitCast(result);
    } else {
        // The signed implementation would work fine, but we can use stricter arithmetic operators here.
        return at_least + r.uintAtMost(T, at_most - at_least);
    }
}
```

:::

## 前提知識

- **両端を含む範囲**: `at_least <= i <= at_most` の範囲です。サイコロの 1 から 6 は、この形です。
- **2 の補数**: 負の数をビットで表す方法です。符号付きの値を符号なしに読み替えると、幅の計算が正しく求まります。
- **`uintAtMost`**: 0 以上、上限以下の符号なし整数の乱数を作る関数です。
- **`+%`**: 溢れを折り返す足し算です。
- **`@bitCast`**: ビットの並びを、別の型として読み替える組み込み関数です。

## 何をしているか

### 1. 符号付きは符号なしに読み替える

::: code-group

```zig:line-numbers=256 [日本語訳]
    const info = @typeInfo(T).int;
    if (info.signedness == .signed) {
        // 2 の補数だと、この計算はとても簡単になる。
        const UnsignedT = std.meta.Int(.unsigned, info.bits);
        const lo: UnsignedT = @bitCast(at_least);
        const hi: UnsignedT = @bitCast(at_most);
        const result = lo +% r.uintAtMost(UnsignedT, hi -% lo);
```

```zig:line-numbers=256 [原文]
    const info = @typeInfo(T).int;
    if (info.signedness == .signed) {
        // Two's complement makes this math pretty easy.
        const UnsignedT = std.meta.Int(.unsigned, info.bits);
        const lo: UnsignedT = @bitCast(at_least);
        const hi: UnsignedT = @bitCast(at_most);
        const result = lo +% r.uintAtMost(UnsignedT, hi -% lo);
```

:::

`lo` と `hi` を符号なしに読み替え、幅 `hi -% lo` を `uintAtMost` に渡します。2 の補数では、この幅が正しく求まります。結果に `lo` を足して、最後に `@bitCast` で元の符号付きの型に戻します。

### 2. 符号なしは直接計算する

::: code-group

```zig:line-numbers=264 [日本語訳]
    } else {
        // 符号付きの実装でも動くが、ここではより厳密な演算子を使える。
        return at_least + r.uintAtMost(T, at_most - at_least);
```

```zig:line-numbers=264 [原文]
    } else {
        // The signed implementation would work fine, but we can use stricter arithmetic operators here.
        return at_least + r.uintAtMost(T, at_most - at_least);
```

:::

符号なしの型なら、読み替えが要りません。`at_most - at_least` の幅を `uintAtMost` に渡し、最後に下限を足します。

## ここがすごい

- **負の範囲も同じ式で**: 2 の補数の性質で、符号付きの範囲も符号なしの計算に置き換えられます。
- **一様性を保つ**: 幅の乱数の一様性を、`uintAtMost` が保証します。
- **`intRangeLessThan` と対**: 上限を含むかどうかだけが違います。2 つを比べると、範囲の書き方の違いが分かります。
- **溢れを折り返す**: `+%` と `-%` で、負の値の計算も安全です。

## まとめ

- `intRangeAtMost` は、下限と上限を両方含む整数の範囲を、一様に作ります。
- 符号付きの型は、2 の補数の性質で符号なしに読み替えて計算します。
- 上限を含まない `intRangeLessThan` と対になっています。
