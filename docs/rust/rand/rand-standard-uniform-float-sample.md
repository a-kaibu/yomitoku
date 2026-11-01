---
title: 上位ビットから、[0, 1) の一様な小数を作る
description: rand の標準の浮動小数点の乱数。整数の乱数の上位 53 ビット（f64 の場合）を取り、2 のマイナス 53 乗を掛けて、0 以上 1 未満の値にする。割り算を使わない。
language: rust
project: rand
repo: https://github.com/rust-random/rand
license: MIT OR Apache-2.0
copyright: Copyright 2018 Developers of the Rand project
commit: "9e7d328f60d6372ae22927f37d1a816fc980f25e"
file: src/distr/float.rs
lines: [109, 119]
function: StandardUniform::sample
difficulty: 3
format: 2
tags: [乱数, 数値計算, ビット演算]
---

## ひとことで

`sample` は、0 以上 1 未満の **一様な浮動小数点数** を 1 つ作る関数です。乱数の基になる整数（64 ビットなど）を受け取り、その **上位 53 ビット**（`f64` の場合）だけを使います。

取り出したビットを、2 のマイナス 53 乗の倍数として解釈します。これで、0 から 1 の間の小数になります。割り算を使わず、ビットの取り出しと掛け算だけで済ませています。

## コード

::: code-group

```rust:line-numbers=109 [日本語訳]
            fn sample<R: Rng + ?Sized>(&self, rng: &mut R) -> $ty {
                // 掛け算による方法です。24 または 53 ビットの乱数を使い、区間は [0, 1) です。
                // 単純な乱数では、上位ビットの方がランダムなので、上位ビットを使います。
                // 多くの単純な乱数で、上位ビットのほうがランダムです。
                let float_size = mem::size_of::<$f_scalar>() as $u_scalar * 8;
                let precision = $fraction_bits + 1;
                let scale = 1.0 / ((1 as $u_scalar << precision) as $f_scalar);

                let value: $uty = rng.random();
                let value = value >> $uty::splat(float_size - precision);
                $ty::splat(scale) * $ty::cast_from_int(value)
```

```rust:line-numbers=109 [原文]
            fn sample<R: Rng + ?Sized>(&self, rng: &mut R) -> $ty {
                // Multiply-based method; 24/53 random bits; [0, 1) interval.
                // We use the most significant bits because for simple RNGs
                // those are usually more random.
                let float_size = mem::size_of::<$f_scalar>() as $u_scalar * 8;
                let precision = $fraction_bits + 1;
                let scale = 1.0 / ((1 as $u_scalar << precision) as $f_scalar);

                let value: $uty = rng.random();
                let value = value >> $uty::splat(float_size - precision);
                $ty::splat(scale) * $ty::cast_from_int(value)
```

:::

この関数は、マクロで `f32` と `f64` の両方に展開されます。`$f_scalar`、`$u_scalar`、`$fraction_bits` などは、型ごとのビット数や定数です。

## 前提知識

- **一様分布**: 区間の中のどの値も、同じ確率で現れる分布です。
- **仮数（有効数字）のビット数**: `f64` では、仮数は 53 ビット（暗黙の 1 を含む）で、そのうち区間を表すのに使うのは 53 ビットです。`f32` では 24 ビットです。
- **上位ビットと下位ビット**: 2 進数の左側が上位、右側が下位です。単純な乱数では、上位ビットのほうが偏りが少ないとされています。
- **`>>`（右シフト）**: ビットを右へ動かし、下位のビットを捨てます。上位だけを残すことができます。
- **`cast_from_int`**: 整数を浮動小数点の値に変換します。

## 何をしているか

### 1. 必要なビット数の大きさを決める

```rust:line-numbers=113
                let float_size = mem::size_of::<$f_scalar>() as $u_scalar * 8;
                let precision = $fraction_bits + 1;
                let scale = 1.0 / ((1 as $u_scalar << precision) as $f_scalar);
```

整数の大きさと、必要な精度（仮数のビット数に 1 を足したもの）を求めます。`scale` は、2 のマイナス精度乗に相当する値で、整数を区間に変換する係数です。

### 2. 乱数の上位ビットだけを残す

```rust:line-numbers=117
                let value: $uty = rng.random();
                let value = value >> $uty::splat(float_size - precision);
```

乱数を 1 つ作り、下位のビットを捨てて、上位の `precision` ビットだけを残します。これで、取り出される値は 0 から 2 の精度乗の間の整数になります。

### 3. 係数を掛けて小数にする

```rust:line-numbers=119
                $ty::splat(scale) * $ty::cast_from_int(value)
```

残った整数を浮動小数点に変え、`scale` を掛けます。結果は 0 以上 1 未満の一様な小数になります。

## ここがすごい

- **割り算がない**: 区間の幅で割る代わりに、2 の冪の係数を掛けるだけです。計算が速く、誤差も少なくなります。
- **すべての値が正確に表せる**: 整数の値はすべて、その精度の浮動小数点で正確に表せます。そのため、区間の中の値が偏りなく現れます。
- **上位ビットを使う**: 下位ビットは偏りやすいので、上位だけを使うことで、乱数の質を保っています。

## まとめ

- 乱数の上位ビットを、必要な精度の分だけ残す。
- 2 の冪の係数を掛けて、0 以上 1 未満の小数にする。
- 割り算を使わず、上位ビットと掛け算で一様な小数を作る。
