---
title: 文字列の中の、エスケープが要らない区間をまとめて書く
description: serde_json が文字列を JSON に書き出すとき、エスケープが要らない文字の連続を一度に書き、特殊な文字の前で区切る。1 バイトずつ書く無駄を避ける。
language: rust
project: serde_json
repo: https://github.com/serde-rs/json
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "8c535a260ce561eaab4111aafc29038eb9f77ff3"
file: src/ser.rs
lines: [2079, 2133]
function: format_escaped_str_contents
difficulty: 3
format: 2
tags: [文字列処理, 防御的プログラミング, 最適化]
---

## ひとことで

`format_escaped_str_contents` は、文字列を JSON の形で書き出すときの **本体の処理** です。`"` や `\` や改行のような、エスケープ（別の表記への置き換え）が必要な文字だけを特別に書き、それ以外の文字は、まとめて一度に書きます。

1 バイトずつ書き出すと、関数の呼び出しが文字の数だけ発生して、とても遅くなります。この関数は、エスケープが要らない文字の **連なり（ラン）** を見つけて、その単位で書き出します。

## コード

::: code-group

```rust:line-numbers=2079 [日本語訳]
fn format_escaped_str_contents<W, F>(
    writer: &mut W,
    formatter: &mut F,
    value: &str,
) -> io::Result<()>
where
    W: ?Sized + io::Write,
    F: ?Sized + Formatter,
{
    let mut bytes = value.as_bytes();

    let mut i = 0;
    while i < bytes.len() {
        let (string_run, rest) = bytes.split_at(i);
        let (&byte, rest) = rest.split_first().unwrap();

        let escape = ESCAPE[byte as usize];

        i += 1;
        if escape == 0 {
            continue;
        }

        bytes = rest;
        i = 0;

        // Safety: string_run は有効な UTF-8 です。分割するのは ASCII の並びだけだからです。
        let string_run = unsafe { str::from_utf8_unchecked(string_run) };
        if !string_run.is_empty() {
            tri!(formatter.write_string_fragment(writer, string_run));
        }

        let char_escape = match escape {
            self::BB => CharEscape::Backspace,
            self::TT => CharEscape::Tab,
            self::NN => CharEscape::LineFeed,
            self::FF => CharEscape::FormFeed,
            self::RR => CharEscape::CarriageReturn,
            self::QU => CharEscape::Quote,
            self::BS => CharEscape::ReverseSolidus,
            self::UU => CharEscape::AsciiControl(byte),
            // Safety: エスケープ表には、ほかの種類の文字は含まれていません。
            _ => unsafe { hint::unreachable_unchecked() },
        };
        tri!(formatter.write_char_escape(writer, char_escape));
    }

    // Safety: bytes は有効な UTF-8 です。分割するのは ASCII の並びだけだからです。
    let string_run = unsafe { str::from_utf8_unchecked(bytes) };
    if string_run.is_empty() {
        return Ok(());
    }

    formatter.write_string_fragment(writer, string_run)
}
```

```rust:line-numbers=2079 [原文]
fn format_escaped_str_contents<W, F>(
    writer: &mut W,
    formatter: &mut F,
    value: &str,
) -> io::Result<()>
where
    W: ?Sized + io::Write,
    F: ?Sized + Formatter,
{
    let mut bytes = value.as_bytes();

    let mut i = 0;
    while i < bytes.len() {
        let (string_run, rest) = bytes.split_at(i);
        let (&byte, rest) = rest.split_first().unwrap();

        let escape = ESCAPE[byte as usize];

        i += 1;
        if escape == 0 {
            continue;
        }

        bytes = rest;
        i = 0;

        // Safety: string_run is a valid utf8 string, since we only split on ascii sequences
        let string_run = unsafe { str::from_utf8_unchecked(string_run) };
        if !string_run.is_empty() {
            tri!(formatter.write_string_fragment(writer, string_run));
        }

        let char_escape = match escape {
            self::BB => CharEscape::Backspace,
            self::TT => CharEscape::Tab,
            self::NN => CharEscape::LineFeed,
            self::FF => CharEscape::FormFeed,
            self::RR => CharEscape::CarriageReturn,
            self::QU => CharEscape::Quote,
            self::BS => CharEscape::ReverseSolidus,
            self::UU => CharEscape::AsciiControl(byte),
            // Safety: the escape table does not contain any other type of character.
            _ => unsafe { hint::unreachable_unchecked() },
        };
        tri!(formatter.write_char_escape(writer, char_escape));
    }

    // Safety: bytes is a valid utf8 string, since we only split on ascii sequences
    let string_run = unsafe { str::from_utf8_unchecked(bytes) };
    if string_run.is_empty() {
        return Ok(());
    }

    formatter.write_string_fragment(writer, string_run)
}
```

:::

この関数は、`writer`（書き出し先）と `formatter`（書式を決める役）を受け取ります。実際の書き出しは `formatter` に任せ、この関数は「どこで区切るか」だけを決めています。

## 前提知識

- **JSON のエスケープ**: 文字列の中では、`"` や `\` や制御文字を、`\"` や `\\` や `\n` のような形で書きます。これを「エスケープ」と呼びます。
- **`ESCAPE` 表**: 256 個のバイトごとに、エスケープが必要かどうかと、その種類を表す表です。`ESCAPE[byte]` を引くと、0 なら何もしなくてよいと分かります。
- **`split_at` と `split_first`**: バイト列を途中で 2 つに分ける操作です。前の部分と、後の部分を同時に得られます。
- **`from_utf8_unchecked`**: バイト列が正しい UTF-8 だと分かっているとき、文字列として扱います。確認を省くので、`unsafe` が必要です。
- **`write_string_fragment`**: 文字列の一部を書き出す処理です。ラン単位で呼ぶことで、呼び出しの回数を減らせます。

## 何をしているか

### 1. エスケープが要るバイトを探す

```rust:line-numbers=2091
    while i < bytes.len() {
        let (string_run, rest) = bytes.split_at(i);
        let (&byte, rest) = rest.split_first().unwrap();

        let escape = ESCAPE[byte as usize];

        i += 1;
        if escape == 0 {
            continue;
        }
```

`i` を先頭から進め、`ESCAPE` 表でそのバイトを調べます。0 なら、そのバイトはエスケープ不要なので、次へ進みます。0 でなければ、ここでラン（エスケープ不要の連なり）が終わります。

### 2. 手前のラン、次に特殊な文字を書く

```rust:line-numbers=2102
        bytes = rest;
        i = 0;
```

ラン `string_run` を先に書き出します。空でなければ `write_string_fragment` で 1 回だけ書きます。その後、特殊な文字に対応する `CharEscape` を選んで、エスケープ付きで書きます。

### 3. 最後のランを書く

```rust:line-numbers=2126
    // Safety: bytes is a valid utf8 string, since we only split on ascii sequences
    let string_run = unsafe { str::from_utf8_unchecked(bytes) };
    if string_run.is_empty() {
        return Ok(());
    }

    formatter.write_string_fragment(writer, string_run)
```

ループを抜けたら、残りのバイト列を 1 回で書き出します。空なら何もしません。

## ここがすごい

- **呼び出しの回数が減る**: 通常の文字は、エスケープの有無を判定するだけで、書き出しは連なりごとに 1 回です。長い文字列ほど効果が大きくなります。
- **表で判定する**: エスケープの判定は、256 個の表を 1 回引くだけです。分岐を並べるより速く、読みやすくもなります。
- **安全性の根拠がコメントに残る**: 文字列の分割が ASCII の境界でだけ行われるので、UTF-8 として正しいことが保たれます。その理由が `Safety` のコメントに書かれています。

## まとめ

- エスケープが要らない文字の連なりは、まとめて 1 回で書く。
- 判定は 256 個の表で行い、特殊な文字の前後だけで区切る。
- 分割が ASCII の境界だけで行われるので、UTF-8 の正しさが保たれる。
