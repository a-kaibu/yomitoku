---
title: 文字が単語の一部かを、範囲の表で調べる
description: regex-syntax の is_word_character。ASCII は速い判定で済ませ、それ以外は Unicode の単語文字の範囲表を二分探索して、文字が範囲に入るかを確かめる。
language: rust
project: regex
repo: https://github.com/rust-lang/regex
license: MIT OR Apache-2.0
copyright: Copyright (c) 2014 The Rust Project Developers
commit: "94ac45b2a6e7b1c30927feb5b66c5ded5b7ad447"
file: regex-syntax/src/unicode.rs
lines: [463, 492]
function: is_word_character
difficulty: 2
format: 2
tags: [正規表現, Unicode, 探索]
---

## ひとことで

`is_word_character` は、ある文字が正規表現の `\w`（単語文字）に当たるかを判定する関数です。`\w` は、英字、数字、アンダースコアだけでなく、日本語などを含む Unicode の単語文字も対象にします。

判定は 2 段階です。ASCII の文字は、バイトとして素早く判定します。それ以外の文字は、Unicode の範囲表を二分探索して判定します。表がビルドに含まれていなければ、判定そのものができないので、エラーを返します。

## コード

```rust:line-numbers=463
pub fn is_word_character(c: char) -> Result<bool, UnicodeWordError> {
    #[cfg(not(feature = "unicode-perl"))]
    fn imp(_: char) -> Result<bool, UnicodeWordError> {
        Err(UnicodeWordError(()))
    }

    #[cfg(feature = "unicode-perl")]
    fn imp(c: char) -> Result<bool, UnicodeWordError> {
        use crate::{is_word_byte, unicode_tables::perl_word::PERL_WORD};

        if u8::try_from(c).map_or(false, is_word_byte) {
            return Ok(true);
        }
        Ok(PERL_WORD
            .binary_search_by(|&(start, end)| {
                use core::cmp::Ordering;

                if start <= c && c <= end {
                    Ordering::Equal
                } else if start > c {
                    Ordering::Greater
                } else {
                    Ordering::Less
                }
            })
            .is_ok())
    }

    imp(c)
}
```

## 前提知識

- **`\w`（単語文字）**: 正規表現で単語の一部とみなされる文字の集合です。Unicode を使うと、ひらがなや漢字などの多くの文字を含みます。
- **範囲表**: `(開始, 終了)` の組を、昇順に並べた配列です。ある文字がどこかの範囲に入るかを、表だけで判定できます。
- **二分探索**: 並んだ表を、真ん中から半分ずつ絞り込んで探す方法です。
- **`binary_search_by`**: 比較の関数を渡して二分探索をする関数です。ここでは、範囲に対して「どちら側にあるか」を返す比較を渡しています。
- **`u8::try_from(c)`**: 文字 `c` を 1 バイトに変換できれば `Ok` を返す操作です。ASCII の文字だけが成功します。

## 何をしているか

### 1. Unicode の機能が無効なとき

```rust:line-numbers=464
    #[cfg(not(feature = "unicode-perl"))]
    fn imp(_: char) -> Result<bool, UnicodeWordError> {
        Err(UnicodeWordError(()))
    }
```

`unicode-perl` の機能がなければ、判定できないので、`UnicodeWordError` を返す関数を使います。

### 2. ASCII の文字は、先に判定する

```rust:line-numbers=473
        if u8::try_from(c).map_or(false, is_word_byte) {
            return Ok(true);
        }
```

文字を 1 バイトに変換できて、それが単語のバイトなら、すぐに `true` を返します。多くの文字が ASCII なので、ここで大半が決まります。

### 3. 範囲表を二分探索する

```rust:line-numbers=476
        Ok(PERL_WORD
            .binary_search_by(|&(start, end)| {
                use core::cmp::Ordering;

                if start <= c && c <= end {
                    Ordering::Equal
                } else if start > c {
                    Ordering::Greater
                } else {
                    Ordering::Less
                }
            })
            .is_ok())
```

`PERL_WORD` の範囲表を二分探索します。比較の関数は、文字が範囲に入っていれば `Equal`、範囲より前なら `Greater`、後なら `Less` を返します。見つかれば `true` です。

### 4. 外から呼ぶ

```rust:line-numbers=491
    imp(c)
```

内部の `imp` を呼んで、結果を返します。

## ここがすごい

- **よくある場合を速く**: ASCII の文字は、表を探すより先に、1 回の変換だけで判定できます。ふつうの文章の大半で、早く終わります。
- **比較関数で範囲を探す**: 範囲の表を、文字との位置関係だけで探せるように比較の関数を作っています。範囲どうしが重ならないので、この方法で正しく見つかります。
- **表の大きさを抑える**: 範囲の組で表を持つので、個々の文字を並べるより、ずっと小さく済みます。
- **機能によって判定できる範囲を決める**: 表がないビルドでは、誤った判定を返さず、エラーで知らせます。

## まとめ

- 文字の集合を判定するときは、よくある範囲を先に判定すると、平均の速さが上がります。
- 範囲を表にして二分探索すると、個々の文字を並べるより小さく速く判定できます。
- 機能が無いときは、誤った答えを返さず、エラーとして伝えるのが安全です。
