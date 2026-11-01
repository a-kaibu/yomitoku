---
title: 64 ビットの浮動小数点どうしを、上位 64 ビットで掛け合わせる
description: 標準ライブラリの Grisu 法で使う小さな浮動小数点の掛け算。仮数どうしの 128 ビットの積を求め、上位 64 ビットを取り、最上位の下のビットで丸める。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/num/imp/diy_float.rs
lines: [24, 29]
function: Fp::mul
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 最適化]
---

## ひとことで

`mul` は、Grisu 法で使う **64 ビットの仮数と指数を持つ小さな浮動小数点** どうしの掛け算です。仮数は `u64`、指数は `i16` です。2 つの仮数の積は 128 ビットになるので、その上位 64 ビットを新しい仮数にします。

掛け算の結果を、もとの精度で保つために、下位の部分の最上位ビットを使って丸めます。指数は、2 つの指数の和に 64 を足して調整します。

## コード

::: code-group

```rust:line-numbers=24 [日本語訳]
    pub fn mul(self, other: Self) -> Self {
        let (lo, hi) = self.f.carrying_mul(other.f, 0);
        let f = hi + (lo >> 63) /* 丸め */;
        let e = self.e + other.e + 64;
        Self { f, e }
    }
```

```rust:line-numbers=24 [原文]
    pub fn mul(self, other: Self) -> Self {
        let (lo, hi) = self.f.carrying_mul(other.f, 0);
        let f = hi + (lo >> 63) /* round */;
        let e = self.e + other.e + 64;
        Self { f, e }
    }
```

:::

この関数は、`Fp` という構造体の掛け算です。`carrying_mul` は、2 つの `u64` の積を、下位と上位の 2 つの `u64` で返します。

## 前提知識

- **仮数と指数**: 浮動小数点の値を、「仮数 × 2 の指数乗」で表したものです。ここでは、仮数が `f`、指数が `e` です。
- **`carrying_mul`**: 2 つの `u64` の積を、下位 64 ビットと上位 64 ビットに分けて返します。
- **丸め**: 切り捨てられる部分を見て、結果の最後のビットを増やすかどうかを決める処理です。
- **指数の足し算**: 2 つの値の掛け算では、指数どうしを足します。仮数の積が 64 ビットを超えると、その分の指数を加えます。
- **`/* round */`**: 丸めを行う箇所であることを示すコメントです。

## 何をしているか

### 1. 仮数どうしの 128 ビットの積を求める

```rust:line-numbers=25
        let (lo, hi) = self.f.carrying_mul(other.f, 0);
```

`carrying_mul` で、2 つの仮数 `self.f` と `other.f` の積を求めます。下位 64 ビットが `lo`、上位 64 ビットが `hi` です。

### 2. 上位 64 ビットを丸めて仮数にする

```rust:line-numbers=26
        let f = hi + (lo >> 63) /* round */;
```

仮数には上位 `hi` を使います。さらに、下位 `lo` の最上位ビット（63 ビット目）を足します。それが 1 なら、切り捨てた部分が半分以上だったので、繰り上げになります。

### 3. 指数を調整して返す

```rust:line-numbers=27
        let e = self.e + other.e + 64;
        Self { f, e }
```

指数は、2 つの指数の和に 64 を足します。仮数を 64 ビット分の積の上位に取ったので、その分の調整です。結果を `Fp` として返します。

## ここがすごい

- **128 ビットを使わずに済む**: 上位と下位を分けて扱えば、結果を 64 ビットの仮数に収められます。
- **丸めがビット 1 つで済む**: 切り捨てた部分の最上位ビットを見るだけで、四捨五入の判断ができます。計算量が一定です。
- **精度を保ったまま高速**: 浮動小数点ライブラリの小さな型だけで掛け算を完結させるので、速く、正確な結果が得られます。

## まとめ

- 仮数どうしの積を 128 ビットで求め、上位 64 ビットを新しい仮数にする。
- 切り捨てる部分の最上位ビットを足して、四捨五入の丸めを行う。
- 指数は和に 64 を足して、仮数の桁の移動を補正する。
