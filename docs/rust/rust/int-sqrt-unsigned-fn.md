---
title: 平方根は「偶数ビット」だけずらせば、あとで半分戻せばいい
description: 整数の平方根を求める関数をマクロで型ごとに生成する。上位ビットを詰める正規化シフトを偶数にすることで、結果を半分のシフトで元に戻せる。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/num/imp/int_sqrt.rs
lines: [47, 101]
function: unsigned_fn!
difficulty: 3
tags: [マクロ, 数値計算, アルゴリズム, ビット演算]
---

## ひとことで

`unsigned_fn!` は、`u16`・`u32`・`u64`・`u128` それぞれについて **整数の平方根**（`isqrt`、小数点以下切り捨て）を計算する関数を作るマクロです。
たとえば `isqrt(10)` は `3`、`isqrt(1_000_000)` は `1000` になります。

中では「カラツバ平方根」というアルゴリズムを使いますが、その前提条件をそろえるために、**入力を左にずらして（正規化して）から計算し、最後に結果を右にずらして戻す** という下ごしらえをしています。そのずらし方に気の利いた工夫があります。

## コード

```rust:line-numbers=47
macro_rules! unsigned_fn {
    ($UnsignedT:ident, $HalfBitsT:ident, $stages:ident) => {
        /// Returns the [integer square root](
        /// https://en.wikipedia.org/wiki/Integer_square_root) of any
        #[doc = concat!("[`", stringify!($UnsignedT), "`](prim@", stringify!($UnsignedT), ")")]
        /// input.
        #[must_use = "this returns the result of the operation, \
                      without modifying the original"]
        #[inline]
        pub(in crate::num) const fn $UnsignedT(mut n: $UnsignedT) -> $UnsignedT {
            if n <= <$HalfBitsT>::MAX as $UnsignedT {
                $HalfBitsT(n as $HalfBitsT) as $UnsignedT
            } else {
                // The normalization shift satisfies the Karatsuba square root
                // algorithm precondition "a₃ ≥ b/4" where a₃ is the most
                // significant quarter of `n`'s bits and b is the number of
                // values that can be represented by that quarter of the bits.
                //
                // b/4 would then be all 0s except the second most significant
                // bit (010...0) in binary. Since a₃ must be at least b/4, a₃'s
                // most significant bit or its neighbor must be a 1. Since a₃'s
                // most significant bits are `n`'s most significant bits, the
                // same applies to `n`.
                //
                // The reason to shift by an even number of bits is because an
                // even number of bits produces the square root shifted to the
                // left by half of the normalization shift:
                //
                // sqrt(n << (2 * p))
                // sqrt(2.pow(2 * p) * n)
                // sqrt(2.pow(2 * p)) * sqrt(n)
                // 2.pow(p) * sqrt(n)
                // sqrt(n) << p
                //
                // Shifting by an odd number of bits leaves an ugly sqrt(2)
                // multiplied in:
                //
                // sqrt(n << (2 * p + 1))
                // sqrt(2.pow(2 * p + 1) * n)
                // sqrt(2 * 2.pow(2 * p) * n)
                // sqrt(2) * sqrt(2.pow(2 * p)) * sqrt(n)
                // sqrt(2) * 2.pow(p) * sqrt(n)
                // sqrt(2) * (sqrt(n) << p)
                const EVEN_MAKING_BITMASK: u32 = !1;
                let normalization_shift = n.leading_zeros() & EVEN_MAKING_BITMASK;
                n <<= normalization_shift;

                let s = $stages(n);

                let denormalization_shift = normalization_shift >> 1;
                s >> denormalization_shift
            }
        }
    };
}
```

## 前提知識

- **`macro_rules!`**: Rust のマクロ（コードを生成するしくみ）の定義です。`$UnsignedT:ident` のような部分は「呼び出し時に識別子を受け取る引数」で、本体中の `$UnsignedT` がその名前に置き換わります。たとえば `unsigned_fn!(u32, u16, u32_stages)` と呼ぶと、`u32` 用の関数ができます。
- **`#[doc = ...]` などの属性**: `#[...]` は関数に付けるメタ情報です。ドキュメントの生成や「戻り値を使わないと警告」（`must_use`）などに使います。
- **`mut n`**: Rust の変数は基本的に変更できません。`mut` を付けた変数だけ値を書き換えられます。
- **`<$HalfBitsT>::MAX`**: 型の最大値です。`u16::MAX` は 65535 です。
- **`leading_zeros()`**: 2 進数で表したとき、上位に 0 が何個続くかを返します。`u32` の `1` なら 31 です。
- **`!1`**: Rust の `!` は整数に使うと「ビット反転」です。`!1` は最下位ビットだけが 0、ほかが全部 1 の数になります。

## 何をしているか

### 1. 小さい数は半分の型に任せる（57〜58 行目）

`n` が半分のビット数の型（`u32` 版なら `u16`）に収まるなら、その型の平方根関数を呼びます。小さい型の計算のほうが速く、`u16` → `u8` のように再帰的に小さい問題へ落とせます（`u8` は表引きです）。

### 2. 正規化シフト（90〜92 行目）

カラツバ平方根は「入力の最上位の 2 ビットのどちらかが 1」でないと正しく動きません。そこで `n` を左にずらして上位の 0 を詰めます。

ポイントは **ずらす量を必ず偶数にする** ことです。`n.leading_zeros()` に `!1` を AND すると最下位ビットが消えて偶数になります。たとえば上位の 0 が 7 個なら、ずらすのは 6 ビットです（最上位ビットは 0 のままでも、その隣が 1 なので条件を満たします）。

### 3. 計算して、半分だけ戻す（94〜97 行目）

`n` を `2p` ビット左にずらすのは、`n` に `4^p` を掛けるのと同じです。すると

```
sqrt(n × 4^p) = sqrt(n) × 2^p
```

となり、**結果は `p` ビットだけ左にずれた値** になります。なので最後に `s >> (normalization_shift >> 1)`、つまりシフト量の半分だけ右に戻せば元の答えです。
もし奇数ビットずらすと `sqrt(2)` が掛かってしまい、シフトでは戻せません。コメント（71〜89 行目）はこの式変形を丁寧に示しています。

## ここがすごい

- **シフトで掛け算・割り算をする**: 正規化も逆正規化もシフト 1 回で済み、割り算や浮動小数点数を使いません。
- **`!1` で「偶数に切り下げ」**: `if` で偶奇を調べる代わりに、最下位ビットを消すだけで偶数化しています。1 命令です。
- **型ごとの再帰構造**: マクロ引数に「半分の型」を渡すことで、`u128` → `u64` → `u32` → `u16` → `u8`（表引き）と、同じコードで段階的に小さい問題へ委ねられます。
- **コメントが数学の教科書**: 前提条件の意味、偶数にする理由、奇数だとどうなるかまでが式で説明されていて、アルゴリズムの論文を読まなくても要点がわかります。

## まとめ

- 左に `2p` ビットずらした数の平方根は、元の平方根を `p` ビットずらした値になる。
- アルゴリズムの前提条件は「入力の下ごしらえ」でそろえられる。
- `x & !1` は x を偶数に切り下げる定番のビット演算。
- マクロに型を引数として渡すと、型ごとに同じ構造の関数をまとめて生成できる。
