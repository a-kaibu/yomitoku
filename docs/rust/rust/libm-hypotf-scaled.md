---
title: 桁あふれを避けて、直角三角形の斜辺を求める
description: 標準ライブラリの libm にある hypotf。二乗すると溢れる大きさや、ほぼ 0 の大きさを、2 の 90 乗で拡大・縮小してから平方根を取る。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/compiler-builtins/libm/src/math/hypotf.rs
lines: [4, 40]
function: hypotf
difficulty: 3
format: 2
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`hypotf` は、2 つの数 `x` と `y` から、**直角三角形の斜辺の長さ `√(x² + y²)` を求める** 関数です。f32（単精度の浮動小数点数）を使います。

素直に計算すると、`x` や `y` が大きすぎると `x²` が溢れ、小さすぎると `x²` が 0 に潰れてしまいます。この関数は、そうした極端な値を、2 の 90 乗で拡大または縮小してから計算し、最後に元の大きさへ戻します。

## コード

::: code-group

```rust:line-numbers=4 [日本語訳]
pub fn hypotf(mut x: f32, mut y: f32) -> f32 {
    let x1p90 = f32::from_bits(0x6c800000); // 2^90 を表す
    let x1p_90 = f32::from_bits(0x12800000); // 2^-90 を表す

    let mut uxi = x.to_bits();
    let mut uyi = y.to_bits();
    let uti;
    let mut z: f32;

    uxi &= -1i32 as u32 >> 1;
    uyi &= -1i32 as u32 >> 1;
    if uxi < uyi {
        uti = uxi;
        uxi = uyi;
        uyi = uti;
    }

    x = f32::from_bits(uxi);
    y = f32::from_bits(uyi);
    if uyi == 0xff << 23 {
        return y;
    }
    if uxi >= 0xff << 23 || uyi == 0 || uxi - uyi >= 25 << 23 {
        return x + y;
    }

    z = 1.;
    if uxi >= (0x7f + 60) << 23 {
        z = x1p90;
        x *= x1p_90;
        y *= x1p_90;
    } else if uyi < (0x7f - 60) << 23 {
        z = x1p_90;
        x *= x1p90;
        y *= x1p90;
    }
    z * sqrtf((x as f64 * x as f64 + y as f64 * y as f64) as f32)
```

```rust:line-numbers=4 [原文]
pub fn hypotf(mut x: f32, mut y: f32) -> f32 {
    let x1p90 = f32::from_bits(0x6c800000); // 0x1p90f === 2 ^ 90
    let x1p_90 = f32::from_bits(0x12800000); // 0x1p-90f === 2 ^ -90

    let mut uxi = x.to_bits();
    let mut uyi = y.to_bits();
    let uti;
    let mut z: f32;

    uxi &= -1i32 as u32 >> 1;
    uyi &= -1i32 as u32 >> 1;
    if uxi < uyi {
        uti = uxi;
        uxi = uyi;
        uyi = uti;
    }

    x = f32::from_bits(uxi);
    y = f32::from_bits(uyi);
    if uyi == 0xff << 23 {
        return y;
    }
    if uxi >= 0xff << 23 || uyi == 0 || uxi - uyi >= 25 << 23 {
        return x + y;
    }

    z = 1.;
    if uxi >= (0x7f + 60) << 23 {
        z = x1p90;
        x *= x1p_90;
        y *= x1p_90;
    } else if uyi < (0x7f - 60) << 23 {
        z = x1p_90;
        x *= x1p90;
        y *= x1p90;
    }
    z * sqrtf((x as f64 * x as f64 + y as f64 * y as f64) as f32)
```

:::

この関数は、標準ライブラリの数学関数（libm）の一部です。C 言語の `hypotf` と同じ役割を、Rust で書き直したものです。

## 前提知識

- **単精度浮動小数点（f32）**: 32 ビットで小数を表す型です。扱える最大値と、最小の正の値に限りがあります。
- **桁あふれ（オーバーフロー）**: 計算結果が型の最大値を超えて、無限大になってしまうことです。
- **アンダーフロー**: 小さすぎる値が 0 になってしまうことです。
- **`to_bits` と `from_bits`**: 浮動小数点数と、そのビットの並びを、相互に変換します。指数部を直接調べるのに使われます。
- **2 の冪による拡大・縮小**: 2^90 を掛けたり割ったりしても、仮数部の精度は変わりません。指数部だけが動くからです。

## 何をしているか

### 1. 絶対値のビットを取り出し、大きいほうを `x` にする

```rust:line-numbers=8
    let mut uxi = x.to_bits();
    let mut uyi = y.to_bits();
    let uti;
    let mut z: f32;

    uxi &= -1i32 as u32 >> 1;
    uyi &= -1i32 as u32 >> 1;
    if uxi < uyi {
        uti = uxi;
        uxi = uyi;
        uyi = uti;
    }
```

符号ビットを消して絶対値だけを残し、`x` が `y` 以上になるように入れ替えます。以降は、`x` が常に大きい方として扱えます。

### 2. 特殊な値を先に処理する

```rust:line-numbers=23
    if uyi == 0xff << 23 {
        return y;
    }
    if uxi >= 0xff << 23 || uyi == 0 || uxi - uyi >= 25 << 23 {
        return x + y;
    }
```

絶対値の小さいほう（`y`）が無限大なら、大きいほうも無限大なので、答えは無限大です。`x` が無限大か NaN（非数）なら、足し算の結果をそのまま返します。`y` が 0 のときも、答えは `x` です。さらに、`x` と `y` の指数の差が 25 以上なら、小さい方の `y` は結果にほとんど影響しないので、`x + y` で済ませます。

### 3. 極端な大きさを、2 の 90 乗で調整する

```rust:line-numbers=30
    z = 1.;
    if uxi >= (0x7f + 60) << 23 {
        z = x1p90;
        x *= x1p_90;
        y *= x1p_90;
    } else if uyi < (0x7f - 60) << 23 {
        z = x1p_90;
        x *= x1p90;
        y *= x1p90;
    }
```

`x` が大きすぎる（指数が 60 以上）なら、両方を `2^-90` 倍して計算し、後で `2^90` 倍して戻します。逆に `y` が小さすぎる（指数が -60 より小さい）なら、両方を `2^90` 倍します。どちらでもなければ、そのまま計算します。

### 4. 倍精度で計算して平方根を取る

```rust:line-numbers=40
    z * sqrtf((x as f64 * x as f64 + y as f64 * y as f64) as f32)
```

`x²` と `y²` の和を f64（倍精度）で計算し、f32 に戻してから平方根を取ります。二乗の段階で精度を上げるので、f32 のまま計算するより誤差が小さくなります。最後に、調整で掛けた `z` を掛けて元の大きさに戻します。

## ここがすごい

- **溢れも潰れもしない**: 極端な大きさを、2 の冪で持ち上げたり下げたりするので、計算中に桁あふれやアンダーフローが起きません。
- **2 の冪なので誤差が増えない**: 2 の冪を掛けるのは、指数部を動かすだけです。仮数部の情報が失われないので、拡大と縮小が正確に戻せます。
- **特殊な値を早めに返す**: 無限大や NaN、0、極端に差がある値は、計算の前に答えが決まります。分岐を先に置くことで、通常の計算の道筋を単純に保っています。

## まとめ

- 二乗の桁あふれを避けるため、極端な大きさを 2 の 90 乗で調整してから計算する。
- 特殊な値と、差が大きすぎる値は、早めの分岐で答えを返す。
- 二乗の和だけを倍精度で計算し、誤差を抑える。
