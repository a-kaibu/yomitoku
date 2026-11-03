---
title: 負の数を含む範囲の整数を、2 の補数の引き算で一様に作る
description: Zig 標準ライブラリの Random.intRangeLessThan。符号付きの整数を符号なしに読み替えて、下限を足すことで、負の値を含む範囲の乱数を作る。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random.zig
lines: [217, 231]
function: Random.intRangeLessThan
difficulty: 3
format: 2
tags: [乱数, 数値計算, 型システム]
---

## ひとことで

`intRangeLessThan` は、下限以上、上限未満の整数を、一様な乱数で作る関数です。下限が負の数でも動きます。たとえば -10 以上 10 未満の値を、同じ確からしさで作れます。

## コード

::: code-group

```zig:line-numbers=217 [日本語訳]
pub fn intRangeLessThan(r: Random, comptime T: type, at_least: T, less_than: T) T {
    assert(at_least < less_than);
    const info = @typeInfo(T).int;
    if (info.signedness == .signed) {
        // 2 の補数だと、この計算はとても簡単になる。
        const UnsignedT = std.meta.Int(.unsigned, info.bits);
        const lo: UnsignedT = @bitCast(at_least);
        const hi: UnsignedT = @bitCast(less_than);
        const result = lo +% r.uintLessThan(UnsignedT, hi -% lo);
        return @bitCast(result);
    } else {
        // 符号付きの実装でも動くが、ここではより厳密な演算子を使える。
        return at_least + r.uintLessThan(T, less_than - at_least);
    }
}
```

```zig:line-numbers=217 [原文]
pub fn intRangeLessThan(r: Random, comptime T: type, at_least: T, less_than: T) T {
    assert(at_least < less_than);
    const info = @typeInfo(T).int;
    if (info.signedness == .signed) {
        // Two's complement makes this math pretty easy.
        const UnsignedT = std.meta.Int(.unsigned, info.bits);
        const lo: UnsignedT = @bitCast(at_least);
        const hi: UnsignedT = @bitCast(less_than);
        const result = lo +% r.uintLessThan(UnsignedT, hi -% lo);
        return @bitCast(result);
    } else {
        // The signed implementation would work fine, but we can use stricter arithmetic operators here.
        return at_least + r.uintLessThan(T, less_than - at_least);
    }
}
```

:::

## 前提知識

- **2 の補数**: 負の数を、ビットの並びで表す方法です。現在の CPU のほとんどは、この方法を使っています。
- **ビットの読み替え（`@bitCast`）**: 同じビットの並びを、符号付きの型と符号なしの型の間で読み替える組み込み関数です。値は変わりません。
- **ラップする足し算と引き算（`+%`、`-%`）**: 溢れても止まらず、折り返す演算です。
- **`uintLessThan`**: 符号なしの範囲で、上限未満の一様な乱数を作る関数です。この関数の土台になっています。
- **`@typeInfo(T).int`**: 整数の型の、ビット数と符号の情報を取り出す組み込み関数です。

## 何をしているか

### 1. 符号付きの場合は符号なしに読み替える

::: code-group

```zig:line-numbers=219 [日本語訳]
    const info = @typeInfo(T).int;
    if (info.signedness == .signed) {
        // 2 の補数だと、この計算はとても簡単になる。
        const UnsignedT = std.meta.Int(.unsigned, info.bits);
        const lo: UnsignedT = @bitCast(at_least);
        const hi: UnsignedT = @bitCast(less_than);
        const result = lo +% r.uintLessThan(UnsignedT, hi -% lo);
        return @bitCast(result);
```

```zig:line-numbers=219 [原文]
    const info = @typeInfo(T).int;
    if (info.signedness == .signed) {
        // Two's complement makes this math pretty easy.
        const UnsignedT = std.meta.Int(.unsigned, info.bits);
        const lo: UnsignedT = @bitCast(at_least);
        const hi: UnsignedT = @bitCast(less_than);
        const result = lo +% r.uintLessThan(UnsignedT, hi -% lo);
        return @bitCast(result);
```

:::

`lo` と `hi` を符号なしに読み替えます。2 の補数では、差の計算が符号なしの値として正しく求まります。そのため、`hi -% lo` の幅で `uintLessThan` を使い、結果に `lo` を足して戻します。`+%` と `-%` は、溢れても折り返すので、負の値の処理も安全です。最後に `@bitCast` で、もとの符号付きの型に戻します。

### 2. 符号なしの場合はそのまま計算する

::: code-group

```zig:line-numbers=228 [日本語訳]
        // 符号付きの実装でも動くが、ここではより厳密な演算子を使える。
        return at_least + r.uintLessThan(T, less_than - at_least);
```

```zig:line-numbers=228 [原文]
        // The signed implementation would work fine, but we can use stricter arithmetic operators here.
        return at_least + r.uintLessThan(T, less_than - at_least);
```

:::

符号なしの型なら、読み替えは要りません。`less_than - at_least` の幅を使って、`uintLessThan` に任せます。ここでは、溢れを起こさない通常の演算子を使えます。

## ここがすごい

- **負の数を特別扱いしない**: 2 の補数の性質を使うと、負の値の範囲も、符号なしの計算でそのまま扱えます。
- **偏りが出ない**: 幅を符号なしの `uintLessThan` に渡すので、一様性は元の関数が保証しています。
- **コメントで理由を示す**: 符号なしの場合のコメントは、なぜ別の演算子を使うのかを説明しています。
- **事前の確認**: `assert` で、下限が上限より小さいことを確かめています。空の範囲は作れないからです。

## まとめ

- `intRangeLessThan` は、下限以上、上限未満の整数を一様に作ります。
- 符号付きの型は、2 の補数の性質を使って符号なしに読み替えて計算します。
- 符号なしの型なら、そのまま計算できます。
