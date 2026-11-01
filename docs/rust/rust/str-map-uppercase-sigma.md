---
title: ギリシャ文字 Σ が語末かどうかを前後から判定する
description: 大文字 Σ を小文字にするとき、語末なら ς、それ以外なら σ を選ぶ関数。前は逆順、後ろは順方向のイテレータで、大小を持つ文字があるかを調べる。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/str.rs
lines: [223, 236]
function: map_uppercase_sigma
difficulty: 2
format: 2
tags: [Unicode, 文字列処理, イテレータ]
---

## ひとことで

`map_uppercase_sigma` は、ギリシャ文字の大文字 **Σ（シグマ）** を小文字にするとき、**ς（語末形）と σ（通常形）のどちらにするか** を決める関数です。

ギリシャ語では、同じ文字でも単語の最後に来ると形が変わります。`"ΟΔΥΣΣΕΥΣ"` を小文字にすると、途中の 2 つの Σ は `σ`、最後の Σ は `ς` になり、`"οδυσσευς"` になります。この判定は Unicode の規格で `Final_Sigma` という条件として定められています。

## コード

::: code-group

```rust:line-numbers=223 [日本語訳]
fn map_uppercase_sigma(from: &str, i: usize) -> char {
    fn case_ignorable_then_cased<I: Iterator<Item = char>>(iter: I) -> bool {
        match iter.skip_while(|&c| c.is_case_ignorable()).next() {
            Some(c) => c.is_cased(),
            None => false,
        }
    }

    // 定義は https://www.unicode.org/versions/latest/core-spec/chapter-3/#G54277 を参照
    // （`Final_Sigma` の定義）。
    let is_word_final = case_ignorable_then_cased(from[..i].chars().rev())
        && !case_ignorable_then_cased(from[i + const { 'Σ'.len_utf8() }..].chars());
    if is_word_final { 'ς' } else { 'σ' }
}
```

```rust:line-numbers=223 [原文]
fn map_uppercase_sigma(from: &str, i: usize) -> char {
    fn case_ignorable_then_cased<I: Iterator<Item = char>>(iter: I) -> bool {
        match iter.skip_while(|&c| c.is_case_ignorable()).next() {
            Some(c) => c.is_cased(),
            None => false,
        }
    }

    // See https://www.unicode.org/versions/latest/core-spec/chapter-3/#G54277
    // for the definition of `Final_Sigma`.
    let is_word_final = case_ignorable_then_cased(from[..i].chars().rev())
        && !case_ignorable_then_cased(from[i + const { 'Σ'.len_utf8() }..].chars());
    if is_word_final { 'ς' } else { 'σ' }
}
```

:::

## 前提知識

- **関数の中の関数とジェネリクス**: `case_ignorable_then_cased` は、この関数の中だけで使う補助関数です。`I: Iterator<Item = char>` は「文字を順に返すイテレータなら何でも受け取れる」という意味です。
- **イテレータのメソッド**: `chars()` は文字列を 1 文字ずつ返します。`rev()` で逆順になります。`skip_while(条件)` は、条件を満たす間は読み飛ばします。`next()` は次の 1 つを `Option`（`Some(文字)` か `None`）で返します。
- **`is_cased` と `is_case_ignorable`**: Unicode の文字の性質です。`is_cased` は大文字・小文字の区別がある文字（A, a, Σ など）、`is_case_ignorable` は大小の判定で無視してよい文字（アポストロフィやアクセント記号など）です。
- **`from[..i]` と `from[i + n..]`**: 文字列の一部を取り出すスライス記法です。`i` はバイト位置です。
- **`const { ... }`**: その場でコンパイル時に計算するブロックです。`'Σ'.len_utf8()` は Σ を UTF-8 で表したときのバイト数（2）です。
- **`&&` と `!`**: 論理積と否定です。

## 何をしているか

### 1. 「無視できる文字を飛ばして、次が大小のある文字か」を調べる

```rust:line-numbers=224
    fn case_ignorable_then_cased<I: Iterator<Item = char>>(iter: I) -> bool {
        match iter.skip_while(|&c| c.is_case_ignorable()).next() {
            Some(c) => c.is_cased(),
            None => false,
        }
    }
```


イテレータから、アポストロフィなどの無視できる文字を読み飛ばし、最初に出てきた文字が大小を持つかどうかを返します。文字が残っていなければ `false` です。

### 2. 語末かどうかを判定

```rust:line-numbers=233
    let is_word_final = case_ignorable_then_cased(from[..i].chars().rev())
        && !case_ignorable_then_cased(from[i + const { 'Σ'.len_utf8() }..].chars());
```


Σ の位置を `i` として、

- **前**（`from[..i]` を逆順に）を見て、大小のある文字がある
- **後ろ**（Σ の次から）を見て、大小のある文字が **ない**

の両方を満たすとき、語末と判断します。

`"ΟΔΥΣΣΕΥΣ"` の 4 文字目の Σ なら、前に `Υ` があり、後ろにも `Σ` があるので語末ではありません → `σ`。最後の Σ は、前に `Υ` があり、後ろに何もないので語末です → `ς`。
`"ΣΑ"` の Σ は前に何もないので語末ではありません。1 文字だけの単語 `"Σ"` も同様に `σ` です。

### 3. 文字を選ぶ

```rust:line-numbers=235
    if is_word_final { 'ς' } else { 'σ' }
```


`if` は値を返す式なので、`'ς'` か `'σ'` がそのまま戻り値になります。

## ここがすごい

- **前後で同じ補助関数を使う**: 前を見るときは逆順イテレータ、後ろを見るときは順方向イテレータを、同じ `case_ignorable_then_cased` に渡しています。ジェネリクスのおかげで、どちら向きのイテレータでも受け取れます。
- **必要な分だけ読む**: `skip_while` と `next` は遅延評価なので、無視できる文字を飛ばして最初の 1 文字を見た時点で止まります。文字列全体を走査しません。
- **規格への忠実さ**: Unicode 規格の該当箇所にリンクしています。「無視できる文字を飛ばす」のは、`ΟΔΥΣΣΕΥΣ'` のように語末にアポストロフィが付いた場合なども正しく扱うためです。
- **定数をコンパイル時に**: `const { 'Σ'.len_utf8() }` で、Σ のバイト数をハードコードせず、意味の分かる形で書いています。値はコンパイル時に `2` に決まるので、実行時のコストはありません。

## まとめ

- 文字の変換には、前後の文脈で結果が変わるものがある（ギリシャ語の語末シグマ）。
- 逆順と順方向のイテレータを同じ関数に渡せるのは、ジェネリクスの強み。
- イテレータの遅延評価を使えば、必要な文字だけを読んで判定できる。
- マジックナンバーは `const { ... }` で意味のある式として書ける。
