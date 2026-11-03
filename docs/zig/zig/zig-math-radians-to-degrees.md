---
title: ラジアンの角度を、度の角度に型をそのまま保って変換する
description: Zig 標準ライブラリの math.radiansToDegrees。浮動小数点数やそのベクトルに対して、定数 180/π を掛けて度に変換する。型に合わない値はコンパイルエラーにする。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [267, 275]
function: radiansToDegrees
difficulty: 2
format: 2
tags: [数値計算, 型システム, 防御的プログラミング]
---

## ひとことで

`radiansToDegrees` は、角度の単位をラジアンから度へ変える関数です。円を 1 周すると、ラジアンでは 2π、度では 360 になります。その比をそのまま掛け算にして、変換しています。

## コード

```zig:line-numbers=267
pub fn radiansToDegrees(ang: anytype) if (@TypeOf(ang) == comptime_int) comptime_float else @TypeOf(ang) {
    const T = @TypeOf(ang);
    switch (@typeInfo(T)) {
        .float, .comptime_float, .comptime_int => return ang * deg_per_rad,
        .vector => |V| if (@typeInfo(V.child) == .float) return ang * @as(T, @splat(deg_per_rad)),
        else => {},
    }
    @compileError("Input must be float or a comptime number, or a vector of floats.");
}
```

## 前提知識

- **ラジアン**: 角度の単位の 1 つで、半径と同じ長さの弧に対する中心角を表します。1 周は 2π ラジアンです。
- **度（degree）**: 円の 1 周を 360 等分した単位です。日常の角度で使われます。
- **変換係数**: ラジアンから度へは `180 / π` を、度からラジアンへは `π / 180` を掛けます。`deg_per_rad` は、この定数です。
- **`@typeInfo`**: 型の種類を調べる組み込み関数です。浮動小数点数か、そのベクトルかを判定しています。
- **`@compileError`**: 想定外の型が渡されたときに、コンパイルの時点でエラーを出します。

## 何をしているか

### 1. 型の種類を調べる

```zig:line-numbers=268
    const T = @TypeOf(ang);
    switch (@typeInfo(T)) {
        .float, .comptime_float, .comptime_int => return ang * deg_per_rad,
```

`@typeInfo` で型を調べます。浮動小数点数、コンパイル時の浮動小数点数、コンパイル時の整数なら、そのまま定数を掛けて返します。

### 2. ベクトルの場合は全要素に掛ける

```zig:line-numbers=271
        .vector => |V| if (@typeInfo(V.child) == .float) return ang * @as(T, @splat(deg_per_rad)),
```

要素が浮動小数点数のベクトルなら、定数を同じ形のベクトルに広げて、全要素に掛けます。

### 3. それ以外はコンパイルエラーにする

```zig:line-numbers=272
        else => {},
    }
    @compileError("Input must be float or a comptime number, or a vector of floats.");
```

どの場合にも当てはまらなければ、`@compileError` で止めます。整数の型などを間違えて渡すと、実行の前に気づけます。

## ここがすごい

- **型がそのまま返る**: 戻り値の型は引数の型と同じです。`f32` を渡せば `f32` が返り、精度を失いません。
- **ベクトルにも対応**: 同じ式で、複数の角度を一度に変換できます。
- **誤りを早く見つける**: 対応しない型を、コンパイル時に弾くので、実行時の驚きが減ります。
- **係数が名前付き**: `deg_per_rad` と名前が付いているので、何を掛けているかが分かります。

## まとめ

- `radiansToDegrees` は、ラジアンの値に `180 / π` を掛けて度にします。
- 戻り値の型は引数と同じで、ベクトルにも対応します。
- 対応しない型はコンパイルの時点でエラーになります。
