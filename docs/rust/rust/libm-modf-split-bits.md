---
title: 浮動小数点数を整数部と小数部に分ける
description: libm の modf。指数部から小数の部分が何ビットあるかを求め、そのビットを 0 にマスクして整数部を作り、元の値との差で小数部を得る。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/compiler-builtins/libm/src/math/modf.rs
lines: [2, 35]
function: modf
difficulty: 2
format: 2
tags: [数値計算, ビット演算]
---

## ひとことで

`modf` は、`f64` の値を **整数部分** と **小数部分** に分ける関数です。たとえば `3.75` は、整数部分が `3.0`、小数部分が `0.75` になります。C の標準ライブラリにある関数と同じ働きをするものを、`libm` が Rust で実装しています。

この関数は、浮動小数点数のビットを直接読みます。指数部から、仮数部（小数の桁を表すビット）のうち、どこまでが小数の部分かを計算し、その部分のビットを 0 にして整数部を作ります。

## コード

::: code-group

```rust:line-numbers=2 [日本語訳]
pub fn modf(x: f64) -> (f64, f64) {
    let rv2: f64;
    let mut u = x.to_bits();
    let mask: u64;
    let e = (((u >> 52) & 0x7ff) as i32) - 0x3ff;

    /* 小数部分がない */
    if e >= 52 {
        rv2 = x;
        if e == 0x400 && (u << 12) != 0 {
            /* 非数 */
            return (x, rv2);
        }
        u &= 1 << 63;
        return (f64::from_bits(u), rv2);
    }

    /* 整数部分がない */
    if e < 0 {
        u &= 1 << 63;
        rv2 = f64::from_bits(u);
        return (x, rv2);
    }

    mask = ((!0) >> 12) >> e;
    if (u & mask) == 0 {
        rv2 = x;
        u &= 1 << 63;
        return (f64::from_bits(u), rv2);
    }
    u &= !mask;
    rv2 = f64::from_bits(u);
    return (x - rv2, rv2);
}
```

```rust:line-numbers=2 [原文]
pub fn modf(x: f64) -> (f64, f64) {
    let rv2: f64;
    let mut u = x.to_bits();
    let mask: u64;
    let e = (((u >> 52) & 0x7ff) as i32) - 0x3ff;

    /* no fractional part */
    if e >= 52 {
        rv2 = x;
        if e == 0x400 && (u << 12) != 0 {
            /* nan */
            return (x, rv2);
        }
        u &= 1 << 63;
        return (f64::from_bits(u), rv2);
    }

    /* no integral part*/
    if e < 0 {
        u &= 1 << 63;
        rv2 = f64::from_bits(u);
        return (x, rv2);
    }

    mask = ((!0) >> 12) >> e;
    if (u & mask) == 0 {
        rv2 = x;
        u &= 1 << 63;
        return (f64::from_bits(u), rv2);
    }
    u &= !mask;
    rv2 = f64::from_bits(u);
    return (x - rv2, rv2);
}
```

:::

## 前提知識

- **IEEE 754 の `f64`**: 符号 1 ビット、指数 11 ビット、仮数 52 ビットで値を表す形式です。値は「仮数 × 2 の指数乗」に相当します。
- **指数（exponent）**: 2 のべき乗を表す部分です。`0x3ff` のバイアス（ずれ）を引くと、実際の指数になります。
- **仮数（mantissa）**: 値の有効な桁を表すビットです。指数が大きいほど、小数の部分に使われるビットは少なくなります。
- **`to_bits` と `from_bits`**: `f64` とその内部のビット列（`u64`）を、相互に変換する関数です。
- **マスク**: 特定のビットだけを残したり消したりするための値です。`&` と組み合わせて使います。

## 何をしているか

### 1. 指数を取り出す

```rust:line-numbers=4
    let mut u = x.to_bits();
    let mask: u64;
    let e = (((u >> 52) & 0x7ff) as i32) - 0x3ff;
```

`to_bits` でビット列を取り出し、指数部を 11 ビット取り出して、バイアスを引きます。この `e` が、2 のべき乗としての指数です。

### 2. 整数しか含まない場合

```rust:line-numbers=8
    /* no fractional part */
    if e >= 52 {
        rv2 = x;
        if e == 0x400 && (u << 12) != 0 {
            /* nan */
            return (x, rv2);
        }
        u &= 1 << 63;
        return (f64::from_bits(u), rv2);
    }
```

`e` が 52 以上なら、仮数の全部が整数の桁を表すので、小数部分はありません。符号ビットだけを残した値（±0）を小数部とし、`x` 自身を整数部とします。`NaN` のときは、そのまま `x` を返します。

### 3. 整数部分がない場合

```rust:line-numbers=19
    /* no integral part*/
    if e < 0 {
        u &= 1 << 63;
        rv2 = f64::from_bits(u);
        return (x, rv2);
    }
```

`e` が負なら、絶対値は 1 より小さいので、整数部分は 0 です。小数部分が `x` で、整数部分は符号つきの 0 になります。

### 4. マスクで小数のビットを消す

```rust:line-numbers=26
    mask = ((!0) >> 12) >> e;
    if (u & mask) == 0 {
        rv2 = x;
        u &= 1 << 63;
        return (f64::from_bits(u), rv2);
    }
```

`mask` は、仮数の下側にある「小数の桁」のビットを表します。`mask` と `u` の `&` が 0 なら、小数の桁がすべて 0 なので、整数そのものです。

```rust:line-numbers=32
    u &= !mask;
    rv2 = f64::from_bits(u);
    return (x - rv2, rv2);
```

`!mask` で小数のビットを消し、整数部分 `rv2` を作ります。小数部分は、元の値から整数部分を引いた `x - rv2` です。

## ここがすごい

- **ビットで場合分けする**: 指数の範囲だけで、「小数がない」「整数がない」「両方ある」を判定しています。浮動小数点の割り算や丸めを使わずに、正確な結果を得られます。
- **引き算が正確**: 整数部分は、元の値の一部のビットを消しただけなので、`x - rv2` は誤差なく小数部分になります。
- **符号を保つ**: 0 の場合も、符号ビットだけを残すので、負の値の小数部分の符号が正しく保たれます。
- **特殊な値を先に返す**: `NaN` の判定を先に行うので、後の計算は有限の値だけを考えればよくなります。

## まとめ

- 浮動小数点数の分解は、ビット列の指数と仮数を読むと、丸め誤差なく行えます。
- マスクで消すビットを決めれば、整数部と小数部を同時に求められます。
- 特殊な値（NaN、無限大）を先に分けると、本体の処理が単純になります。
