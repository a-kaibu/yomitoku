---
title: 値の大きさに比例した許容誤差で、浮動小数点数が近いかを判定する
description: Zig 標準ライブラリの math.approxEqRel。差の絶対値を、2 つの値の大きい方の絶対値に許容比率を掛けたものと比べ、大きさに応じた相対的な誤差で判定する。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [104, 115]
function: approxEqRel
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング]
---

## ひとことで

`approxEqRel` は、2 つの浮動小数点数が、相対的な誤差の範囲で近いかを判定する関数です。値が大きければ許される差も大きく、値が小さければ許される差も小さくなります。

## コード

::: code-group

```zig:line-numbers=104 [日本語訳]
pub fn approxEqRel(comptime T: type, x: T, y: T, tolerance: T) bool {
    assert(@typeInfo(T) == .float or @typeInfo(T) == .comptime_float);
    assert(tolerance > 0);

    // 等しい値の高速な経路（符号付きのゼロと無限大を含む）。
    if (x == y)
        return true;

    if (isNan(x) or isNan(y))
        return false;

    return @abs(x - y) <= @max(@abs(x), @abs(y)) * tolerance;
```

```zig:line-numbers=104 [原文]
pub fn approxEqRel(comptime T: type, x: T, y: T, tolerance: T) bool {
    assert(@typeInfo(T) == .float or @typeInfo(T) == .comptime_float);
    assert(tolerance > 0);

    // Fast path for equal values (and signed zeros and infinites).
    if (x == y)
        return true;

    if (isNan(x) or isNan(y))
        return false;

    return @abs(x - y) <= @max(@abs(x), @abs(y)) * tolerance;
```

:::

## 前提知識

- **相対誤差**: 差を値の大きさで割った比率です。値が 1000 のときの 1 の差と、値が 1 のときの 1 の差は、意味が違います。
- **絶対誤差との違い**: `approxEqAbs` は、差の絶対値そのものを許容誤差と比べます。大きさに関係なく同じ幅で判定します。
- **`@max`**: 2 つの値の大きい方を返す組み込み関数です。
- **NaN**: 比べられない値です。この関数では、特別に `false` を返します。
- **`tolerance > 0`**: 許容比率は正の値でなければなりません。`assert` で確かめます。

## 何をしているか

### 1. 同じ値なら即座に真

```zig:line-numbers=109
    if (x == y)
        return true;
```

`x == y` なら `true` を返します。符号付きのゼロや無限大も、この経路で扱います。

### 2. NaN を除外して相対誤差を比べる

```zig:line-numbers=112
    if (isNan(x) or isNan(y))
        return false;

    return @abs(x - y) <= @max(@abs(x), @abs(y)) * tolerance;
```

NaN が含まれていれば `false` を返します。それ以外は、差の絶対値が、大きい方の絶対値に許容比率を掛けた値以下かを確かめます。

## ここがすごい

- **大きさに合わせた判定**: 大きな値の計算結果の誤差は、大きくなりがちです。相対誤差なら、その性質に合わせて判定できます。
- **0 の付近に注意**: 両方の値が 0 に近いと、相対誤差は意味を失います。そういう場合は `approxEqAbs` を使う、と使い分けられます。
- **同じ形の関数との対**: `approxEqAbs` と見比べると、判定の式の違いだけが分かります。
- **NaN を明示的に扱う**: NaN は比べられないので、偽を返す経路を用意しています。

## まとめ

- `approxEqRel` は、値の大きさに比例した許容誤差で、近さを判定します。
- 同じ値や NaN は、先に処理されます。
- 0 付近の値では `approxEqAbs` と使い分けます。
