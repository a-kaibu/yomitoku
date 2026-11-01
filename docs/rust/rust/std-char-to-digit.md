---
title: 文字を、基数に応じた桁の値に変える
description: 標準ライブラリの char::to_digit。数字と英字を、引き算とビットのマスクだけで 0 から 35 の値に変え、基数に収まるかを判定する。英字の大文字と小文字を同じに扱う。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/char/methods.rs
lines: [409, 431]
function: char::to_digit
difficulty: 3
format: 2
tags: [文字列処理, 数値計算, 防御的プログラミング]
---

## ひとことで

`to_digit` は、1 文字を **指定した基数（進数）での桁の値** に変える関数です。たとえば基数 16 で `'f'` は 15、基数 10 で `'7'` は 7 を返します。その文字が基数の範囲に入らないときは `None` を返します。
数字は `'0'` から、英字は `'A'` や `'a'` から始まるように並んでいるので、その差を取るだけで値が出ます。この関数は、その性質を引き算とビットの操作で効率よく使っています。

## コード

::: code-group

```rust:line-numbers=409 [日本語訳]
    pub const fn to_digit(self, radix: u32) -> Option<u32> {
        assert!(
            radix >= 2 && radix <= 36,
            "to_digit: invalid radix -- radix must be in the range 2 to 36 inclusive"
        );
        // 基数を確かめて、基数が定数のときは文字の処理を取り除けるようにする。
        let value = if self > '9' && radix > 10 {
            // ASCII の英字を大文字にするためのマスク。
            const TO_UPPERCASE_MASK: u32 = !0b0010_0000;
            // ASCII の英字を、対応する整数の値に変換する：
            // A-Z も a-z も 10 から 35 にする。それ以外の文字は 36 以上の値になる。
            //
            // 溢れの安全性について：
            // 引き算の後にマスクを掛けることで、最初の加数が
            // u32::MAX - 0x20 を超えないように制限される。
            ((self as u32).wrapping_sub('A' as u32) & TO_UPPERCASE_MASK) + 10
        } else {
            // 数字を値に変える。数字でない文字は折り返して 36 より大きい値になる。
            (self as u32).wrapping_sub('0' as u32)
        };
        // FIXME(const-hack): then_some が const fn になったら、ここで使う。
        if value < radix { Some(value) } else { None }
    }
```

```rust:line-numbers=409 [原文]
    pub const fn to_digit(self, radix: u32) -> Option<u32> {
        assert!(
            radix >= 2 && radix <= 36,
            "to_digit: invalid radix -- radix must be in the range 2 to 36 inclusive"
        );
        // check radix to remove letter handling code when radix is a known constant
        let value = if self > '9' && radix > 10 {
            // mask to convert ASCII letters to uppercase
            const TO_UPPERCASE_MASK: u32 = !0b0010_0000;
            // Converts an ASCII letter to its corresponding integer value:
            // A-Z => 10-35, a-z => 10-35. Other characters produce values >= 36.
            //
            // Add Overflow Safety:
            // By applying the mask after the subtraction, the first addendum is
            // constrained such that it never exceeds u32::MAX - 0x20.
            ((self as u32).wrapping_sub('A' as u32) & TO_UPPERCASE_MASK) + 10
        } else {
            // convert digit to value, non-digits wrap to values > 36
            (self as u32).wrapping_sub('0' as u32)
        };
        // FIXME(const-hack): once then_some is const fn, use it here
        if value < radix { Some(value) } else { None }
    }
```

:::

`value` は、文字の値を基数と比べるための数です。数字でも英字でもない文字は、`36` 以上の値になるように作られています。

## 前提知識

- **基数（radix）**: 数の表し方の進数です。2 から 36 までの値を使えます。基数 36 までは、数字 0 から 9、英字 a から z を桁に使います。
- **文字コード**: 文字は、番号（コードポイント）で表されます。`'0'` から `'9'` は連続した番号、`'A'` から `'Z'` も連続した番号です。
- **`wrapping_sub`**: 引き算が 0 より下に溢れても、折り返した値を返す引き算です。`'0'` より小さい文字は、大きな値に折り返します。
- **`&` と `!0b0010_0000`**: 2 進数の 5 ビット目（値 32）を消すマスクです。大文字と小文字の違いは、この 1 ビットだけなので、この操作で大文字に揃えられます。
- **`assert!`**: 条件が偽のとき、パニックします。基数が 2 から 36 の範囲にないと、呼び出しを止めます。

## 何をしているか

### 1. 数字と英字で、計算の仕方を分ける

```rust:line-numbers=415
        let value = if self > '9' && radix > 10 {
            // mask to convert ASCII letters to uppercase
```

基数が 10 より大きく、文字が `'9'` より後なら、英字として扱います。それ以外は、数字として扱います。基数が 10 以下の場合は、英字の処理そのものを飛ばせます。

### 2. 英字の値を、大文字に揃えて求める

```rust:line-numbers=424
            ((self as u32).wrapping_sub('A' as u32) & TO_UPPERCASE_MASK) + 10
```

`'A'` を引いて、32 のビットを消し、10 を足します。小文字の `'a'` は `'A'` から 32 だけ離れているので、消すと同じ値になります。`'A'` から `'Z'` は 10 から 35 になります。

### 3. 数字の値を求め、基数と比べる

```rust:line-numbers=427
            (self as u32).wrapping_sub('0' as u32)
```

数字の場合は、`'0'` を引くだけです。`'0'` より小さい文字は、引き算が溢れて大きな値になります。
最後の `value < radix` で、基数の範囲に収まるときだけ `Some` を返します。

## ここがすごい

- **条件分岐を減らす**: 数字と英字の差を、大文字に揃えるマスクと引き算だけで表せます。`'a'..='z'` と `'A'..='Z'` を別々に比べる必要がありません。
- **溢れを逆に使う**: `'0'` より小さい文字は、`wrapping_sub` で大きな値になります。その値は基数より大きくなるので、範囲外の判定が 1 回の比較で済みます。
- **マスクの後で足す順序**: コメントにあるとおり、マスクは引き算の後に掛けます。先に足してしまうと、溢れの扱いが複雑になります。順序で安全性を保っています。
- **基数の判定が最後に 1 回**: 値の計算と基数の比較を分けて、最後の 1 回で判定します。どんな基数でも、同じ形で書けます。
- **定数の基数で、さらに速くなる**: 基数が定数のときは、コンパイラが英字の処理を取り除けます。`radix > 10` の条件が、その最適化の入口になっています。

## まとめ

- 数字は `'0'` を、英字は `'A'` を引いて値にし、大文字小文字の違いはビットのマスクで消す。
- 基数に収まらない文字は、引き算の溢れによって、比較 1 回で弾かれる。
- 基数が 10 以下のときは、英字の処理を飛ばせる。
