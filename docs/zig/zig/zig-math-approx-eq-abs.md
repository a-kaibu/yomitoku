---
title: 2 つの浮動小数点数が、許容誤差の中で等しいかを判定する
description: Zig 標準ライブラリの math.approxEqAbs。同じ値なら即座に真、NaN があれば偽、それ以外は差の絶対値が許容誤差以下かで判定する。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [76, 88]
function: approxEqAbs
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング]
---

## ひとことで

`approxEqAbs` は、2 つの浮動小数点数が、許容誤差の範囲で等しいかを判定する関数です。浮動小数点数の計算では、理論上は等しい値でも、わずかな誤差で `==` が偽になることがあります。その問題を避けるために使います。

## コード

::: code-group

```zig:line-numbers=76 [日本語訳]
pub fn approxEqAbs(comptime T: type, x: T, y: T, tolerance: T) bool {
    assert(@typeInfo(T) == .float or @typeInfo(T) == .comptime_float);
    assert(tolerance >= 0);

    // 等しい値の高速な経路（符号付きのゼロと無限大を含む）。
    if (x == y)
        return true;

    if (isNan(x) or isNan(y))
        return false;

    return @abs(x - y) <= tolerance;
}
```

```zig:line-numbers=76 [原文]
pub fn approxEqAbs(comptime T: type, x: T, y: T, tolerance: T) bool {
    assert(@typeInfo(T) == .float or @typeInfo(T) == .comptime_float);
    assert(tolerance >= 0);

    // Fast path for equal values (and signed zeros and infinites).
    if (x == y)
        return true;

    if (isNan(x) or isNan(y))
        return false;

    return @abs(x - y) <= tolerance;
}
```

:::

## 前提知識

- **浮動小数点数の誤差**: 2 進数で小数を表すと、すべての値を正確に表せません。計算の結果に、小さな誤差が入ることがあります。
- **許容誤差（tolerance）**: どれだけの差までを等しいとみなすかを決める値です。
- **絶対誤差**: 2 つの値の差の絶対値です。`@abs(x - y)` で求めます。
- **NaN（非数）**: 不正な計算の結果を表す特別な値です。NaN は自分自身とも等しくならないので、特別に扱います。
- **`assert`**: 前提の条件を確かめる関数です。ここでは、型が浮動小数点数で、許容誤差が 0 以上であることを確かめます。

## 何をしているか

### 1. 前提を確かめる

```zig:line-numbers=77
    assert(@typeInfo(T) == .float or @typeInfo(T) == .comptime_float);
    assert(tolerance >= 0);
```

浮動小数点数の型であることと、許容誤差が 0 以上であることを `assert` で確かめます。

### 2. 同じ値なら即座に真を返す

::: code-group

```zig:line-numbers=80 [日本語訳]
    // 等しい値の高速な経路（符号付きのゼロと無限大を含む）。
    if (x == y)
        return true;
```

```zig:line-numbers=80 [原文]
    // Fast path for equal values (and signed zeros and infinites).
    if (x == y)
        return true;
```

:::

`x == y` なら、誤差の計算をせずに `true` を返します。符号付きのゼロ（`+0` と `-0`）や無限大も、この経路で扱えます。

### 3. NaN を除外して差を比べる

```zig:line-numbers=84
    if (isNan(x) or isNan(y))
        return false;

    return @abs(x - y) <= tolerance;
```

どちらかが NaN なら、比べられないので `false` を返します。それ以外は `@abs(x - y)` が許容誤差以下かを見ます。

## ここがすごい

- **高速な経路がある**: 完全に等しい場合は、差の計算を省けます。よく起きるケースを、先に処理しています。
- **NaN を正しく扱う**: NaN は `==` でも偽になるので、ここで明示的に除外しています。誤って真になる事態を防ぎます。
- **許容誤差を引数で決める**: どこまでの差を許すかは、呼び出し側が選べます。用途に合わせた判定ができます。
- **前提を型で守る**: 浮動小数点数の型以外や、負の誤差は `assert` で弾かれます。

## まとめ

- `approxEqAbs` は、許容誤差の中で 2 つの浮動小数点数が等しいかを判定します。
- 同じ値なら即座に真、NaN なら偽を返します。
- それ以外は、差の絶対値と許容誤差を比べます。
