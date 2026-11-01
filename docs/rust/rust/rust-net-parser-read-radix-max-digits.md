---
title: 桁数の上限を守りながら、数字を読み取る
description: 標準ライブラリの IP アドレス解析で使う、桁数に上限のある数字の読み取り。1 桁ずつ掛けて足し、上限を超えた桁や先頭ゼロの不正を、途中で検出する。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/net/parser.rs
lines: [104, 132]
function: Parser::read_radix_max_digits
difficulty: 3
format: 2
tags: [パース, 数値計算, 防御的プログラミング]
---

## ひとことで

`read_radix_max_digits` は、IP アドレスのような文字列の中から、**桁数に上限がある数字を 1 つ読み取る** 関数です。たとえば IPv4 の各区切りは、最大 3 桁の 10 進数です。その範囲を超える入力は、ここで拒否されます。

読み取りは 1 文字ずつ行い、`result` を基数倍して次の桁を足します。途中で上限を超えたら `None` を返し、先頭にゼロがあるなどの不正も見つけます。

## コード

::: code-group

```rust:line-numbers=104 [日本語訳]
    fn read_radix_max_digits<T: ReadNumberHelper + TryFrom<u32>>(
        &mut self,
        radix: u32,
        max_digits: u32,
        allow_zero_prefix: bool,
    ) -> Option<T> {
        debug_assert!(1 <= max_digits);
        debug_assert!(max_digits <= 6); // どの基数でも u32 の範囲で動きます
        self.read_atomically(|p| {
            let first = p.read_char()?.to_digit(radix)?;
            let mut result = first;
            let mut digit_count = 1;

            while let Some(digit) = p.read_atomically(|p| p.read_char()?.to_digit(radix)) {
                if digit_count >= max_digits {
                    return None;
                }
                result *= radix;
                result += digit;
                digit_count += 1;
            }

            if !allow_zero_prefix && first == 0 && digit_count > 1 {
                None
            } else {
                result.try_into().ok()
            }
        })
    }
```

```rust:line-numbers=104 [原文]
    fn read_radix_max_digits<T: ReadNumberHelper + TryFrom<u32>>(
        &mut self,
        radix: u32,
        max_digits: u32,
        allow_zero_prefix: bool,
    ) -> Option<T> {
        debug_assert!(1 <= max_digits);
        debug_assert!(max_digits <= 6); // Works for any radix in u32
        self.read_atomically(|p| {
            let first = p.read_char()?.to_digit(radix)?;
            let mut result = first;
            let mut digit_count = 1;

            while let Some(digit) = p.read_atomically(|p| p.read_char()?.to_digit(radix)) {
                if digit_count >= max_digits {
                    return None;
                }
                result *= radix;
                result += digit;
                digit_count += 1;
            }

            if !allow_zero_prefix && first == 0 && digit_count > 1 {
                None
            } else {
                result.try_into().ok()
            }
        })
    }
```

:::

この関数は、解析器（パーサー）の内部のメソッドです。`read_atomically` で囲まれているので、途中で失敗しても、読み取り位置は元に戻ります。そのため、呼び出し側は「失敗したら別の形を試す」という書き方ができます。

## 前提知識

- **パーサー**: 文字列を読み取り、決まった形の値に変える処理です。IP アドレスやポート番号を読むときに使います。
- **基数（radix）**: 数の表し方の基準です。10 進数なら 10、16 進数なら 16 です。
- **`to_digit`**: 文字が指定した基数の数字なら、その値を返します。そうでなければ `None` になります。
- **`try_into`**: 型の変換を、範囲を確かめながら行います。範囲外なら `None` になります。
- **`read_atomically`**: 途中で失敗したら、読み取り位置を戻す仕組みです。

## 何をしているか

### 1. 先頭の 1 桁を読む

```rust:line-numbers=113
            let first = p.read_char()?.to_digit(radix)?;
            let mut result = first;
            let mut digit_count = 1;
```

最初の文字を数字として読みます。数字でなければ、そこで `None` を返します。`digit_count` で、読んだ桁数を数えます。

### 2. 桁を足しながら、上限を確かめる

```rust:line-numbers=117
            while let Some(digit) = p.read_atomically(|p| p.read_char()?.to_digit(radix)) {
                if digit_count >= max_digits {
                    return None;
                }
                result *= radix;
                result += digit;
                digit_count += 1;
            }
```

次の文字が数字である限り、`result` を基数倍して、その桁を足します。桁数が上限に達しているのに、さらに数字があれば、それは桁あふれなので `None` を返します。

### 3. 先頭ゼロと型の範囲を確かめる

```rust:line-numbers=126
            if !allow_zero_prefix && first == 0 && digit_count > 1 {
                None
            } else {
                result.try_into().ok()
            }
```

先頭が 0 で桁が 2 つ以上なら、先頭ゼロとして拒否します。IP アドレスでは `01` のような表記を許さない、という意味です。最後に `try_into` で、目的の型に収まるかを確かめます。

## ここがすごい

- **桁あふれを先に防ぐ**: 上限の桁数を超えてから計算するので、`result` が大きくなりすぎる前に止まります。
- **不正な形を一度で見る**: 桁数の上限、先頭ゼロ、型の範囲の 3 つを、1 つの関数で確かめています。
- **失敗を戻せる**: `read_atomically` のおかげで、失敗しても読み取り位置が元に戻ります。解析器の上位の処理が、次の候補を試せます。

## まとめ

- 数字は 1 桁ずつ読み、桁数の上限を超えたら拒否する。
- 先頭ゼロや型の範囲も、読み取りの最後で確かめる。
- 失敗したら読み取り位置を戻し、別の形の解析を試せるようにする。
