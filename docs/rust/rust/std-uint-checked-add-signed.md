---
title: 符号なしの値に負の数を足し、範囲外なら None を返す
description: 符号なし整数に符号付きの値を足す checked_add_signed。結果が 0 より下や型の最大値より上になる場合は None を返し、呼び出し側が溢れを判断できる。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/num/uint_macros.rs
lines: [1055, 1058]
function: checked_add_signed
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

`checked_add_signed` は、符号なしの整数 `self` に、符号付きの整数 `rhs` を足した結果を `Option` で返す関数です。結果が型の範囲に収まれば `Some(値)`、0 より下に行くか、最大値を超えれば `None` を返します。
たとえば、配列の添字を前後にずらすとき、範囲を外れたかどうかを安全に確かめられます。

## コード

```rust:line-numbers=1055
        pub const fn checked_add_signed(self, rhs: $SignedT) -> Option<Self> {
            let (a, b) = self.overflowing_add_signed(rhs);
            if intrinsics::unlikely(b) { None } else { Some(a) }
        }
```

この関数は、`overflowing_add_signed` の結果を使っています。値と溢れの有無のうち、溢れがあれば `None`、なければ `Some` を返すだけの薄いラッパーです。

## 前提知識

- **`Option`**: 値があるかないかを表す型です。`Some(値)` か `None` のどちらかになります。
- **`overflowing_add_signed`**: 値と溢れの組を返す関数です。溢れの判定は、符号の向きを考えて正しく直されています。
- **`intrinsics::unlikely`**: この分岐がめったに通らないことを、コンパイラに伝える指定です。最適化のヒントになります。
- **`if ... { None } else { Some(a) }`**: 条件によって、どちらかの値を返す式です。
- **符号なし整数の範囲**: 0 から型の最大値までです。負の値は表せません。

## 何をしているか

### 1. 値と溢れの組を求める

```rust:line-numbers=1056
            let (a, b) = self.overflowing_add_signed(rhs);
```

`overflowing_add_signed` で、足し算の結果 `a` と、溢れたかどうか `b` を組で受け取ります。

### 2. 溢れたら `None`、そうでなければ `Some`

```rust:line-numbers=1057
            if intrinsics::unlikely(b) { None } else { Some(a) }
```

溢れていれば `None` を返し、そうでなければ結果を `Some` に包んで返します。`unlikely` によって、溢れる経路が普通には通らないと伝えています。

## ここがすごい

- **判定の仕事を 1 か所に任せる**: 溢れの判定は `overflowing_add_signed` の中にあります。この関数は、その結果を `Option` の形に変えるだけです。役割が分かれて、読みやすくなっています。
- **呼び出し側が安全に判断できる**: 範囲を外れたときに、パニックや誤った値ではなく `None` が返るので、呼び出し側が「範囲外」として扱えます。
- **負の方向も、正の方向も同じ形で扱える**: `rhs` の符号に関係なく、同じ関数で範囲の内外を判定できます。
- **`unlikely` で普通の経路を速くする**: 溢れは例外的な場合なので、その分岐を後ろに回すように指示しています。
- **`saturating` や `wrapping` の版との使い分け**: 値を端で止めたい場合は `saturating_add_signed`、折り返したい場合は `wrapping_add_signed`、判断したい場合は `checked_add_signed` を使います。目的に合う版が用意されています。

## まとめ

- 符号なしの値に符号付きの値を足すとき、範囲を外れたら `None` を返す。
- 中身は `overflowing_add_signed` の結果を `Option` に変えるだけ。
- 溢れは例外的な場合として扱い、呼び出し側が判断できる形にしている。
