---
title: 溢れない 19 桁まで、整数を先読みする
description: 標準ライブラリの浮動小数点の文字列解析。数字を 1 桁ずつ u64 に積み上げ、MIN_19DIGIT_INT に届くまでに限る。19 桁は u64 に必ず収まるので、溢れの心配がない。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/num/imp/dec2flt/parse.rs
lines: [51, 70]
function: try_parse_19digits
difficulty: 2
format: 2
tags: [パース, 数値計算, 防御的プログラミング]
---

## ひとことで

`try_parse_19digits` は、浮動小数点の文字列（例えば `3.14159…`）の **先頭の数字を、u64 の整数として先読みする** 関数です。読める数字は、`MIN_19DIGIT_INT` という上限に届くまでに限ります。

19 桁の 10 進数は、`u64` の範囲に必ず収まります。そのため、溢れを心配せずに、1 桁ずつ掛けて足せます。その後の正確な変換は、別の処理が担当します。

## コード

::: code-group

```rust:line-numbers=51 [日本語訳]
fn try_parse_19digits(s_ref: &mut &[u8], x: &mut u64) {
    let mut s = *s_ref;

    while *x < MIN_19DIGIT_INT {
        if let Some((c, s_next)) = s.split_first() {
            let digit = c.wrapping_sub(b'0');

            if digit < 10 {
                *x = (*x * 10) + digit as u64; // ここでは溢れません
                s = s_next;
            } else {
                break;
            }
        } else {
            break;
        }
    }

    *s_ref = s;
}
```

```rust:line-numbers=51 [原文]
fn try_parse_19digits(s_ref: &mut &[u8], x: &mut u64) {
    let mut s = *s_ref;

    while *x < MIN_19DIGIT_INT {
        if let Some((c, s_next)) = s.split_first() {
            let digit = c.wrapping_sub(b'0');

            if digit < 10 {
                *x = (*x * 10) + digit as u64; // no overflows here
                s = s_next;
            } else {
                break;
            }
        } else {
            break;
        }
    }

    *s_ref = s;
}
```

:::

この関数は、入力を `&mut &[u8]` として受け取り、読んだ分だけ先に進めます。`x` には、ここまでに読んだ数字の値が入っています。読み終わった後は、呼び出し側が続きを解析します。

## 前提知識

- **`u64` の範囲**: 符号なし 64 ビット整数は、約 1.8 × 10^19 までの値を表せます。19 桁の 10 進数は、この範囲に収まります。
- **`MIN_19DIGIT_INT`**: 19 桁の最小の数です。`x` がこの値に届いたら、それ以上の桁は読まずに止めます。
- **`split_first`**: バイト列の先頭の 1 バイトと、残りを取り出します。
- **`wrapping_sub`**: 引き算が負になっても、折り返して計算します。`c - b'0'` が数字でないと大きな値になるので、`digit < 10` で判定できます。
- **溢れ**: 計算結果が型の範囲を超えることです。Rust の通常の演算は、デバッグ時に溢れを検出します。

## 何をしているか

### 1. まだ上限に届いていなければ、次の文字を読む

```rust:line-numbers=54
    while *x < MIN_19DIGIT_INT {
        if let Some((c, s_next)) = s.split_first() {
            let digit = c.wrapping_sub(b'0');
```

`x` が `MIN_19DIGIT_INT` 未満の間だけ、次の文字を読みます。文字がなければ、そこで止めます。

### 2. 数字なら、桁を積み上げる

```rust:line-numbers=58
            if digit < 10 {
                *x = (*x * 10) + digit as u64; // no overflows here
                s = s_next;
```

文字を数字の値に変えて、`digit` が 10 未満なら数字です。`x` を 10 倍して `digit` を足し、読んだ位置を進めます。ここで `x` が溢れることはありません。

### 3. 数字でなければ止める

```rust:line-numbers=61
            } else {
                break;
            }
        } else {
            break;
        }
```

数字でない文字に当たったら、そこで止めます。その位置を、呼び出し側に返します。

## ここがすごい

- **溢れを構造で防ぐ**: 上限を 19 桁に決めているので、掛け算と足し算が必ず `u64` に収まります。溢れのチェックを、毎回書く必要がありません。
- **読みすぎない**: 上限に届いた時点で止まるので、それ以上の桁は後の処理に任せます。先読みの範囲が、一目で分かります。
- **文字の判定が 1 回**: `wrapping_sub` と 1 回の比較で、数字かどうかを判定します。分岐が少なく、速く動きます。

## まとめ

- 19 桁までは `u64` に必ず収まるので、溢れを心配せずに積み上げられる。
- 上限に届いたら、そこで読むのを止めて、続きは別の処理に任せる。
- 数字の判定は、`wrapping_sub` と 1 回の比較で済ませる。
