---
title: 上限を含まない整数の範囲を、偏りを許して固定時間で作る
description: Zig 標準ライブラリの Random.intRangeLessThanBiased。符号付きの整数を符号なしに読み替え、uintLessThanBiased で幅の乱数を作ってから下限を足し戻す。実行時間が一定。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random.zig
lines: [198, 212]
function: Random.intRangeLessThanBiased
difficulty: 3
format: 2
tags: [乱数, 最適化, 数値計算]
---

## ひとことで

`intRangeLessThanBiased` は、下限以上、上限未満の整数を作る関数です。`uintLessThanBiased` を土台にしているので、乱数を 1 回引くだけで決まり、実行時間が一定です。その代わり、わずかな偏りがあります。

## コード

::: code-group

```zig:line-numbers=198 [日本語訳]
pub fn intRangeLessThanBiased(r: Random, comptime T: type, at_least: T, less_than: T) T {
    assert(at_least < less_than);
    const info = @typeInfo(T).int;
    if (info.signedness == .signed) {
        // 2 の補数だと、この計算はとても簡単になる。
        const UnsignedT = std.meta.Int(.unsigned, info.bits);
        const lo: UnsignedT = @bitCast(at_least);
        const hi: UnsignedT = @bitCast(less_than);
        const result = lo +% r.uintLessThanBiased(UnsignedT, hi -% lo);
        return @bitCast(result);
    } else {
        // 符号付きの実装でも動くが、ここではより厳密な演算子を使える。
        return at_least + r.uintLessThanBiased(T, less_than - at_least);
    }
}
```

```zig:line-numbers=198 [原文]
pub fn intRangeLessThanBiased(r: Random, comptime T: type, at_least: T, less_than: T) T {
    assert(at_least < less_than);
    const info = @typeInfo(T).int;
    if (info.signedness == .signed) {
        // Two's complement makes this math pretty easy.
        const UnsignedT = std.meta.Int(.unsigned, info.bits);
        const lo: UnsignedT = @bitCast(at_least);
        const hi: UnsignedT = @bitCast(less_than);
        const result = lo +% r.uintLessThanBiased(UnsignedT, hi -% lo);
        return @bitCast(result);
    } else {
        // The signed implementation would work fine, but we can use stricter arithmetic operators here.
        return at_least + r.uintLessThanBiased(T, less_than - at_least);
    }
}
```

:::

## 前提知識

- **`uintLessThanBiased`**: 0 以上、指定の値未満の符号なし整数を、掛け算で作る関数です。偏りがありますが、実行時間は一定です。
- **2 の補数**: 符号付きの値を、ビットの並びのまま符号なしとして扱う方法です。
- **偏り**: 範囲の値が、同じ確率では出ないことです。ここでは、わずかに偏ります。
- **`@bitCast`**: ビットの並びを、別の型として読み替える組み込み関数です。
- **`assert`**: 下限が上限より小さいことを確かめます。空の範囲は作れないからです。

## 何をしているか

### 1. 符号付きは符号なしに読み替える

::: code-group

```zig:line-numbers=201 [日本語訳]
    if (info.signedness == .signed) {
        // 2 の補数だと、この計算はとても簡単になる。
        const UnsignedT = std.meta.Int(.unsigned, info.bits);
        const lo: UnsignedT = @bitCast(at_least);
        const hi: UnsignedT = @bitCast(less_than);
        const result = lo +% r.uintLessThanBiased(UnsignedT, hi -% lo);
        return @bitCast(result);
```

```zig:line-numbers=201 [原文]
    if (info.signedness == .signed) {
        // Two's complement makes this math pretty easy.
        const UnsignedT = std.meta.Int(.unsigned, info.bits);
        const lo: UnsignedT = @bitCast(at_least);
        const hi: UnsignedT = @bitCast(less_than);
        const result = lo +% r.uintLessThanBiased(UnsignedT, hi -% lo);
        return @bitCast(result);
```

:::

`lo` と `hi` を符号なしに読み替え、幅 `hi -% lo` を `uintLessThanBiased` に渡します。結果に `lo` を足して、元の型に戻します。

### 2. 符号なしは直接計算する

::: code-group

```zig:line-numbers=208 [日本語訳]
    } else {
        // 符号付きの実装でも動くが、ここではより厳密な演算子を使える。
        return at_least + r.uintLessThanBiased(T, less_than - at_least);
    }
```

```zig:line-numbers=208 [原文]
    } else {
        // The signed implementation would work fine, but we can use stricter arithmetic operators here.
        return at_least + r.uintLessThanBiased(T, less_than - at_least);
    }
```

:::

符号なしの型なら、幅 `less_than - at_least` をそのまま渡し、最後に下限を足します。

## ここがすごい

- **固定時間**: 拒否法のようなやり直しがないので、実行時間が予測しやすいです。
- **負の範囲を同じ式で**: 2 の補数の性質で、符号付きの範囲も符号なしの計算になります。
- **偏りを関数名で示す**: `Biased` が付いていて、使う側が偏りを理解できます。
- **一様版と対**: 偏りのない `intRangeLessThan` と、用途で使い分けます。

## まとめ

- `intRangeLessThanBiased` は、固定時間で、上限を含まない整数の範囲の乱数を作ります。
- 符号付きは 2 の補数で符号なしに読み替えて計算します。
- 偏りがあるので、厳密さが必要な場合は一様版を使います。
