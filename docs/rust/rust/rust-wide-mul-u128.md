---
title: 128 ビットの積の上下 128 ビットを、64 ビットずつに分けて求める
description: 標準ライブラリの 128 ビット掛け算の代替実装。2 つの 128 ビット数を 64 ビットずつに割り、部分積を繰り上がりを管理しながら足し合わせて、積の上位と下位を得る。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/intrinsics/fallback.rs
lines: [55, 80]
function: wide_mul_u128
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 最適化]
---

## ひとことで

`wide_mul_u128` は、2 つの `u128`（128 ビットの符号なし整数）を掛けて、**積の下位 128 ビットと上位 128 ビットを、組にして返す** 関数です。128 ビット同士の積は、最大で 256 ビットになるので、1 つの `u128` には収まりません。

この関数は、ハードウェアが直接用意していない環境のための **代替（フォールバック）実装** です。64 ビットの部品だけを使って、同じ結果を組み立てます。

## コード

```rust:line-numbers=55
const fn wide_mul_u128(a: u128, b: u128) -> (u128, u128) {
    #[inline]
    const fn to_low_high(x: u128) -> [u128; 2] {
        const MASK: u128 = u64::MAX as _;
        [x & MASK, x >> 64]
    }
    #[inline]
    const fn from_low_high(x: [u128; 2]) -> u128 {
        x[0] | (x[1] << 64)
    }
    #[inline]
    const fn scalar_mul(low_high: [u128; 2], k: u128) -> [u128; 3] {
        let [x, c] = to_low_high(k * low_high[0]);
        let [y, z] = to_low_high(k * low_high[1] + c);
        [x, y, z]
    }
    let a = to_low_high(a);
    let b = to_low_high(b);
    let low = scalar_mul(a, b[0]);
    let high = scalar_mul(a, b[1]);
    let r0 = low[0];
    let [r1, c] = to_low_high(low[1] + high[0]);
    let [r2, c] = to_low_high(low[2] + high[1] + c);
    let r3 = high[2] + c;
    (from_low_high([r0, r1]), from_low_high([r2, r3]))
}
```

この関数は、掛け算の結果を `(下位, 上位)` の組で返します。呼び出し側は、必要に応じて両方を使えます。内部の小さな関数 `to_low_high` や `scalar_mul` は、64 ビットずつの扱いを分かりやすくするための道具です。

## 前提知識

- **`u128` と `u64`**: 128 ビットと 64 ビットの符号なし整数です。`u128` の積は、256 ビットまで大きくなる可能性があります。
- **桁（リム）**: 大きな整数を、扱いやすい単位（ここでは 64 ビット）に分けたものです。
- **部分積**: 大きな掛け算を、分けた桁同士の掛け算に分解したものです。ここでは 2 × 2 = 4 個の部分積になります。
- **繰り上がり（キャリー）**: 足し算で桁があふれたとき、上の桁に運ぶ値です。
- **`to_low_high`**: 1 つの `u128` を、下位 64 ビットと上位 64 ビットに分けて、`[下位, 上位]` の配列にします。

## 何をしているか

### 1. 両方を 64 ビットの 2 桁に分ける

```rust:line-numbers=71
    let a = to_low_high(a);
    let b = to_low_high(b);
```

`a` と `b` を、それぞれ下位と上位の 64 ビットに分けます。これで、掛け算を 4 個の部分積に分解する準備ができます。

### 2. 下の桁と上の桁のそれぞれに掛ける

```rust:line-numbers=73
    let low = scalar_mul(a, b[0]);
    let high = scalar_mul(a, b[1]);
```

`a` と `b` の下位の桁ごとに、`scalar_mul` で 3 桁の結果を得ます。`low` は `b` の下位に掛けた結果、`high` は `b` の上位に掛けた結果です。どちらも、位置をずらして足す必要があります。

### 3. 桁ごとに足して、繰り上がりを運ぶ

```rust:line-numbers=75
    let r0 = low[0];
    let [r1, c] = to_low_high(low[1] + high[0]);
    let [r2, c] = to_low_high(low[2] + high[1] + c);
    let r3 = high[2] + c;
```

`r0` は、そのまま最も低い桁です。`r1`、`r2`、`r3` は、部分積を位置をずらして足し合わせた結果です。足すたびに、64 ビットを超えた分（`c`）を次の桁へ運びます。

### 4. 下位と上位の組を作る

```rust:line-numbers=79
    (from_low_high([r0, r1]), from_low_high([r2, r3]))
```

`r0` と `r1` を組み合わせて下位 128 ビット、`r2` と `r3` を組み合わせて上位 128 ビットとして返します。

## ここがすごい

- **`u128` の掛け算がなくても計算できる**: 64 ビットの掛け算と足し算だけで、128 ビットの積を正しく作れます。
- **繰り上がりを明示する**: `to_low_high` を使って、足し算の上の桁を毎回取り出します。どこで桁があふれたかが、コードの形で明らかです。
- **分解が規則的**: 2 つの桁の組み合わせは、位置を順に並べるだけです。同じ形の処理を繰り返す構成になっています。

## まとめ

- 128 ビット同士の積は、64 ビットの桁に分けて部分積を作ると求められる。
- 部分積は位置をずらして足し、溢れた分は繰り上がりとして運ぶ。
- 結果は下位と上位の組で返すので、256 ビットの積を 2 つの `u128` で表せる。
