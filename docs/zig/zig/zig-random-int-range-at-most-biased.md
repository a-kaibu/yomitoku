---
title: 上限を含む整数の範囲を、偏りを許して固定時間で作る
description: Zig 標準ライブラリの Random.intRangeAtMostBiased。符号付きを符号なしに読み替え、uintAtMostBiased で幅を作ってから下限を足し戻す。両端を含み、実行時間が一定。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random.zig
lines: [235, 249]
function: Random.intRangeAtMostBiased
difficulty: 3
format: 2
tags: [乱数, 最適化, 数値計算]
---

## ひとことで

`intRangeAtMostBiased` は、下限以上、上限以下の整数を作る関数です。両端を含みます。`uintAtMostBiased` を土台にしているので、実行時間が一定です。代わりに、わずかな偏りがあります。

## コード

::: code-group

```zig:line-numbers=235 [日本語訳]
pub fn intRangeAtMostBiased(r: Random, comptime T: type, at_least: T, at_most: T) T {
    assert(at_least <= at_most);
    const info = @typeInfo(T).int;
    if (info.signedness == .signed) {
        // 2 の補数だと、この計算はとても簡単になる。
        const UnsignedT = std.meta.Int(.unsigned, info.bits);
        const lo: UnsignedT = @bitCast(at_least);
        const hi: UnsignedT = @bitCast(at_most);
        const result = lo +% r.uintAtMostBiased(UnsignedT, hi -% lo);
        return @bitCast(result);
    } else {
        // 符号付きの実装でも動くが、ここではより厳密な演算子を使える。
        return at_least + r.uintAtMostBiased(T, at_most - at_least);
    }
}
```

```zig:line-numbers=235 [原文]
pub fn intRangeAtMostBiased(r: Random, comptime T: type, at_least: T, at_most: T) T {
    assert(at_least <= at_most);
    const info = @typeInfo(T).int;
    if (info.signedness == .signed) {
        // Two's complement makes this math pretty easy.
        const UnsignedT = std.meta.Int(.unsigned, info.bits);
        const lo: UnsignedT = @bitCast(at_least);
        const hi: UnsignedT = @bitCast(at_most);
        const result = lo +% r.uintAtMostBiased(UnsignedT, hi -% lo);
        return @bitCast(result);
    } else {
        // The signed implementation would work fine, but we can use stricter arithmetic operators here.
        return at_least + r.uintAtMostBiased(T, at_most - at_least);
    }
}
```

:::

## 前提知識

- **`uintAtMostBiased`**: 0 以上、上限以下の符号なし整数を、固定時間で作る関数です。偏りがあります。
- **両端を含む範囲**: `at_least <= i <= at_most` です。
- **2 の補数**: 符号付きの値を、ビットの並びのまま符号なしとして扱う方法です。
- **`+%` と `-%`**: 溢れを折り返す演算子です。
- **`@bitCast`**: ビットの並びを、別の型として読み替える組み込み関数です。

## 何をしているか

### 1. 符号付きは符号なしに読み替える

::: code-group

```zig:line-numbers=238 [日本語訳]
    if (info.signedness == .signed) {
        // 2 の補数だと、この計算はとても簡単になる。
        const UnsignedT = std.meta.Int(.unsigned, info.bits);
        const lo: UnsignedT = @bitCast(at_least);
        const hi: UnsignedT = @bitCast(at_most);
        const result = lo +% r.uintAtMostBiased(UnsignedT, hi -% lo);
        return @bitCast(result);
```

```zig:line-numbers=238 [原文]
    if (info.signedness == .signed) {
        // Two's complement makes this math pretty easy.
        const UnsignedT = std.meta.Int(.unsigned, info.bits);
        const lo: UnsignedT = @bitCast(at_least);
        const hi: UnsignedT = @bitCast(at_most);
        const result = lo +% r.uintAtMostBiased(UnsignedT, hi -% lo);
        return @bitCast(result);
```

:::

`lo` と `hi` を符号なしに読み替え、幅 `hi -% lo` で `uintAtMostBiased` を呼びます。結果に `lo` を足し、元の型に戻します。

### 2. 符号なしは直接計算する

::: code-group

```zig:line-numbers=245 [日本語訳]
    } else {
        // 符号付きの実装でも動くが、ここではより厳密な演算子を使える。
        return at_least + r.uintAtMostBiased(T, at_most - at_least);
    }
```

```zig:line-numbers=245 [原文]
    } else {
        // The signed implementation would work fine, but we can use stricter arithmetic operators here.
        return at_least + r.uintAtMostBiased(T, at_most - at_least);
    }
```

:::

符号なしの型なら、幅 `at_most - at_least` を渡し、下限を足します。

## ここがすごい

- **固定時間の両端版**: 両端を含みながら、やり直しがない乱数を作れます。
- **符号付きも同じ形**: 2 の補数の読み替えで、符号付きの範囲も同じ考え方で扱えます。
- **偏りを明示**: `Biased` の名前で、偏りの有無を区別できます。
- **一様版と対**: `intRangeAtMost` が、偏りのない版です。

## まとめ

- `intRangeAtMostBiased` は、両端を含む範囲の整数を、固定時間で作ります。
- 符号付きの型は、2 の補数で符号なしに読み替えます。
- 偏りが問題なら、一様版の `intRangeAtMost` を使います。
