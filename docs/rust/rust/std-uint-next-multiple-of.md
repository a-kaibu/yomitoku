---
title: 次の倍数へ、余りを使って切り上げる
description: 符号なし整数の next_multiple_of。余りを求め、0 ならそのまま、そうでなければ余りの分だけ足して次の倍数にする。割り算の切り上げの一種。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/num/uint_macros.rs
lines: [3838, 3843]
function: next_multiple_of
difficulty: 1
format: 2
tags: [数値計算, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`next_multiple_of` は、与えた値 `self` **以上で、最も小さい `rhs` の倍数** を返す関数です。たとえば 10 の次の 4 の倍数は 12 で、12 はそのまま 12 です。
ページ単位の大きさに揃えたり、バッファの大きさを一定の刻みに切り上げたりするときに使われる、基本的な計算です。

## コード

```rust:line-numbers=3838
        pub const fn next_multiple_of(self, rhs: Self) -> Self {
            match self % rhs {
                0 => self,
                r => self + (rhs - r)
            }
        }
```

この関数は `match` で余りを調べ、0 のときとそうでないときで、答えの作り方を分けています。

## 前提知識

- **倍数**: ある数を整数倍した数です。`rhs` の倍数は、`0`、`rhs`、`2 * rhs`、… などです。
- **`%`（余り）**: 割ったときの余りです。`self % rhs` が 0 なら、`self` はすでに `rhs` の倍数です。
- **`match`**: 値の形によって、分岐を書く方法です。ここでは `0` と、それ以外（`r`）の 2 つに分けています。
- **`rhs - r`**: `rhs` を余りの分だけ引いた値です。`self` にこの値を足すと、次の倍数に届きます。
- **`#[rustc_inherit_overflow_checks]`**: 溢れの検査を、呼び出し元のビルド設定に合わせる属性です。デバッグでは溢れを検出します。

## 何をしているか

### 1. 余りを求めて、割り切れるかを見る

```rust:line-numbers=3839
            match self % rhs {
                0 => self,
```

`self % rhs` が 0 なら、`self` はすでに `rhs` の倍数です。そのときは、`self` をそのまま返します。

### 2. 余りがあれば、次の倍数へ進む

```rust:line-numbers=3841
                r => self + (rhs - r)
```

余りが `r` のとき、`rhs - r` を足すと、ちょうど次の倍数になります。たとえば `self = 10`、`rhs = 4` なら、余りは 2、`4 - 2 = 2` を足して 12 です。

## ここがすごい

- **割り算の切り上げを 1 回の余りで**: 「切り上げ」を、割り算の商と余りで組み立てています。余りだけ分かれば、足す量が決まるので、ほかの計算は要りません。
- **割り切れる場合を特別扱いする**: 余りが 0 のとき、`rhs - 0 = rhs` を足すと、1 つ先の倍数になってしまいます。`match` で 0 を先に分けて、正しく `self` を返しています。
- **`(a + b - 1) / b` より読みやすい**: 切り上げの定番の書き方と比べると、「余りの分だけ足す」という意味が直接書かれています。
- **溢れの危険はある**: `self + (rhs - r)` は、型の最大値に近い値では溢れます。デバッグビルドではパニックするので、溢れ得る範囲は `checked_next_multiple_of` の方を使います。
- **`rhs` が 0 のときは `%` でパニック**: 0 で割れないので、`rhs` は 0 以外の値である必要があります。

## まとめ

- 余りが 0 なら `self` のまま、そうでなければ `rhs - 余り` を足す。
- この方法で、切り上げの倍数が 1 回の余りの計算で得られる。
- 溢れが心配な場合は、`checked_next_multiple_of` を使う。
