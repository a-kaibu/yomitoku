---
title: 乱数のビットに指数を重ねて、浮動小数点を作る
description: rand が一様な浮動小数点を作る方法。仮数部の乱数ビットに、指数部のビットを OR で重ねるだけ。マクロで型ごとに展開される。
language: rust
project: rand
repo: https://github.com/rust-random/rand
license: MIT OR Apache-2.0
copyright: Copyright 2018 Developers of the Rand project
commit: "9e7d328f60d6372ae22927f37d1a816fc980f25e"
file: src/distr/float.rs
lines: [98, 104]
function: IntoFloat::into_float_with_exponent
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 乱数]
---

## ひとことで

`into_float_with_exponent` は、**整数のビット列を、そのまま浮動小数点の表現として読み替え、指数部を重ねて値を作る** 関数です。乱数で作った仮数部（小数の細かい部分）のビットに、指数部（大きさの目安）のビットを OR で足し込みます。

乱数から浮動小数点を作るとき、割り算や変換を使うと遅くなり、偏りも生まれやすくなります。この関数は、ビットを組み合わせるだけで、指定した範囲に一様な値を作ります。

## コード

::: code-group

```rust:line-numbers=98 [日本語訳]
            #[inline(always)]
            fn into_float_with_exponent(self, exponent: i32) -> $ty {
                // 指数は、バイアスを足した 2 進表現で格納されます
                let exponent_bits: $u_scalar =
                    (($exponent_bias + exponent) as $u_scalar) << $fraction_bits;
                $ty::from_bits(self | $uty::splat(exponent_bits))
            }
```

```rust:line-numbers=98 [原文]
            #[inline(always)]
            fn into_float_with_exponent(self, exponent: i32) -> $ty {
                // The exponent is encoded using an offset-binary representation
                let exponent_bits: $u_scalar =
                    (($exponent_bias + exponent) as $u_scalar) << $fraction_bits;
                $ty::from_bits(self | $uty::splat(exponent_bits))
            }
```

:::

この関数は、`$uty` と `$ty` といった型の名前を、マクロで型ごとに埋め込んだ形になっています。`f32` と `f64` のように、型が違う実装を 1 つの定義から作るための書き方です。

## 前提知識

- **浮動小数点（IEEE 754）**: 符号、指数部、仮数部の 3 つの部分で値を表します。指数部が大きさの目安、仮数部が細かい部分を表します。
- **バイアス付きの指数**: 指数を負の値にも対応させるため、ある定数（バイアス）を足して格納します。ここでは `exponent_bias + exponent` がそれにあたります。
- **`from_bits`**: ビットの並びを、そのまま浮動小数点の値として作ります。値の変換は行いません。
- **OR（`|`）**: 同じ位置のビットのどちらかが 1 なら 1 になる演算です。仮数部に指数部を重ねるのに使います。
- **マクロ**: ソースの書き方を生成する仕組みです。ここでは、型の名前や定数を差し替えて、複数の型の実装を作っています。

## 何をしているか

### 1. 指数をビット位置に合わせる

```rust:line-numbers=101
                let exponent_bits: $u_scalar =
                    (($exponent_bias + exponent) as $u_scalar) << $fraction_bits;
```

指数に定数（バイアス）を足し、仮数部のビット数だけ左にずらします。これで、指数部のフィールドの位置に、正しい値のビットが並びます。

### 2. 乱数のビットと合わせて、浮動小数点を作る

```rust:line-numbers=103
                $ty::from_bits(self | $uty::splat(exponent_bits))
```

乱数のビット列 `self` に、指数部のビットを OR で重ねてから `from_bits` で浮動小数点にします。`self` の仮数部は乱数のままなので、結果は指数の範囲の中で一様に分布します。

## ここがすごい

- **変換の命令が要らない**: 整数から浮動小数点への変換は、普通は計算を伴います。この方法では、ビットを OR するだけです。
- **一様な分布が自然に得られる**: 仮数部が一様な乱数なら、結果の値も、その指数の範囲の中で一様になります。割り算で正規化するより、偏りを作りにくいです。
- **型ごとの差をマクロに閉じ込める**: ビット数や定数はマクロの引数です。ロジックは 1 つで、型ごとに正しいビット幅の実装が生成されます。

## まとめ

- 乱数のビットに指数部のビットを OR で重ねると、浮動小数点の乱数になる。
- 変換の計算を省けるので、速く、偏りも作りにくい。
- マクロを使うと、型ごとの差を 1 つの定義にまとめられる。
