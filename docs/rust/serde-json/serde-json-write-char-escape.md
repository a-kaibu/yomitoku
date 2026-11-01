---
title: 制御文字を \u00XX の 6 バイトに変えて書く
description: serde_json が JSON の文字列に書くエスケープ。引用符や改行などは 2 文字の組に、それ以外の制御文字は \u00 に続けて 16 進数 2 桁を書く。
language: rust
project: serde_json
repo: https://github.com/serde-rs/json
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "8c535a260ce561eaab4111aafc29038eb9f77ff3"
file: src/ser.rs
lines: [1766, 1799]
function: Formatter::write_char_escape
difficulty: 2
format: 2
tags: [文字列処理, 防御的プログラミング, 移植性]
---

## ひとことで

`write_char_escape` は、JSON の文字列の中で **エスケープが必要な 1 文字** を、正しい書き方で書き出す関数です。引用符 `"` は `\"`、改行は `\n` のように、2 バイトの組で書きます。

それ以外の制御文字（0 から 31 までの表示されない文字）は、`\u0007` のように、6 バイトの形で書きます。16 進数の 2 桁を、固定の表から選びます。

## コード

```rust:line-numbers=1766
    fn write_char_escape<W>(&mut self, writer: &mut W, char_escape: CharEscape) -> io::Result<()>
    where
        W: ?Sized + io::Write,
    {
        use self::CharEscape::*;

        let escape_char = match char_escape {
            Quote => b'"',
            ReverseSolidus => b'\\',
            Solidus => b'/',
            Backspace => b'b',
            FormFeed => b'f',
            LineFeed => b'n',
            CarriageReturn => b'r',
            Tab => b't',
            AsciiControl(_) => b'u',
        };

        match char_escape {
            AsciiControl(byte) => {
                static HEX_DIGITS: [u8; 16] = *b"0123456789abcdef";
                let bytes = &[
                    b'\\',
                    escape_char,
                    b'0',
                    b'0',
                    HEX_DIGITS[(byte >> 4) as usize],
                    HEX_DIGITS[(byte & 0xF) as usize],
                ];
                writer.write_all(bytes)
            }
            _ => writer.write_all(&[b'\\', escape_char]),
        }
    }
```

この関数は、`Formatter` のメソッドとして、書き出し先（`writer`）に直接書き込みます。エスケープの種類は、`CharEscape` という列挙型で渡されます。

## 前提知識

- **`CharEscape`**: エスケープの種類を表す列挙型です。引用符、逆スラッシュ、改行などの名前付きのものと、`AsciiControl(byte)` のような制御文字があります。
- **`write_all`**: バイトの並びを、すべて書き出します。途中で書けなければエラーになります。
- **16 進数の表**: 0 から 15 までの値を、`0` から `f` の文字に対応させる表です。
- **`byte >> 4` と `byte & 0xF`**: 1 バイトを上位 4 ビットと下位 4 ビットに分けます。それぞれが 16 進数の 1 桁になります。
- **`static`**: プログラムの中で 1 つだけ存在する値です。表のような固定のデータを置くのに使います。

## 何をしているか

### 1. エスケープの種類から、書く文字を決める

```rust:line-numbers=1772
        let escape_char = match char_escape {
            Quote => b'"',
            ReverseSolidus => b'\\',
            Solidus => b'/',
            Backspace => b'b',
            FormFeed => b'f',
            LineFeed => b'n',
            CarriageReturn => b'r',
            Tab => b't',
            AsciiControl(_) => b'u',
        };
```

`match` で、エスケープの種類ごとに、`\` の後ろに書く文字を決めます。たとえば改行は `n`、タブは `t`、制御文字は `u` です。

### 2. 制御文字は、6 バイトの形で書く

```rust:line-numbers=1785
            AsciiControl(byte) => {
                static HEX_DIGITS: [u8; 16] = *b"0123456789abcdef";
                let bytes = &[
                    b'\\',
                    escape_char,
                    b'0',
                    b'0',
                    HEX_DIGITS[(byte >> 4) as usize],
                    HEX_DIGITS[(byte & 0xF) as usize],
                ];
                writer.write_all(bytes)
            }
```

制御文字なら、`\`、`u`、`0`、`0`、上位の 16 進数の桁、下位の 16 進数の桁、の 6 バイトを作ります。上位と下位の桁は、`HEX_DIGITS` の表から選びます。作ったバイト列を、1 回の `write_all` で書きます。

### 3. それ以外は、2 バイトで書く

```rust:line-numbers=1797
            _ => writer.write_all(&[b'\\', escape_char]),
```

引用符や改行などは、`\` と文字の 2 バイトだけを書きます。

## ここがすごい

- **書き方を表で固定**: 制御文字の 16 進数は、表を引くだけです。計算もループも要らず、常に 2 桁の値が出ます。
- **一度の書き込み**: 6 バイトを 1 つの配列にまとめて、`write_all` で一度に書きます。小さな書き込みを何度も行わずに済みます。
- **名前付きの場合を優先**: 改行やタブのような、よく使う制御文字は、短い 2 バイトの形で書きます。JSON として読みやすく、短い表現になります。

## まとめ

- 引用符や改行は、`\` と 1 文字の 2 バイトで書く。
- 名前のない制御文字は、`\u00` と 16 進数 2 桁の 6 バイトで書く。
- 16 進数の桁は固定の表から選び、まとめて 1 回の書き込みにする。
