---
title: コンパイル時に作った表で、単語の文字かを調べる
description: regex-lite の is_word_byte。ASCII の単語文字の 256 要素の表を const 関数で作り、1 バイトを添字にして 1 回の配列アクセスで判定する。
language: rust
project: regex
repo: https://github.com/rust-lang/regex
license: MIT OR Apache-2.0
copyright: Copyright (c) 2014 The Rust Project Developers
commit: "94ac45b2a6e7b1c30927feb5b66c5ded5b7ad447"
file: regex-lite/src/utf8.rs
lines: [3, 28]
function: is_word_byte
difficulty: 2
format: 2
tags: [正規表現, 最適化, 文字列処理]
---

## ひとことで

`is_word_byte` は、与えられた 1 バイトが **単語の文字**（英字、数字、アンダースコア）かどうかを返す関数です。正規表現では、`\b`（単語の境界）などを判定するときに使われます。
判定のたびに条件を並べるのではなく、**256 個の要素を持つ表** を、コンパイル時に一度だけ作って使っています。判定は、表の添字を 1 つ引くだけです。

## コード

::: code-group

```rust:line-numbers=3 [日本語訳]
pub(crate) fn is_word_byte(b: u8) -> bool {
    const fn mkwordset() -> [bool; 256] {
        // FIXME: トレイトの const 関数が安定したら as_usize() を使う。
        let mut set = [false; 256];
        set[b'_' as usize] = true;

        let mut byte = b'0';
        while byte <= b'9' {
            set[byte as usize] = true;
            byte += 1;
        }
        byte = b'A';
        while byte <= b'Z' {
            set[byte as usize] = true;
            byte += 1;
        }
        byte = b'a';
        while byte <= b'z' {
            set[byte as usize] = true;
            byte += 1;
        }
        set
    }
    const WORD: [bool; 256] = mkwordset();
    WORD[b as usize]
}
```

```rust:line-numbers=3 [原文]
pub(crate) fn is_word_byte(b: u8) -> bool {
    const fn mkwordset() -> [bool; 256] {
        // FIXME: Use as_usize() once const functions in traits are stable.
        let mut set = [false; 256];
        set[b'_' as usize] = true;

        let mut byte = b'0';
        while byte <= b'9' {
            set[byte as usize] = true;
            byte += 1;
        }
        byte = b'A';
        while byte <= b'Z' {
            set[byte as usize] = true;
            byte += 1;
        }
        byte = b'a';
        while byte <= b'z' {
            set[byte as usize] = true;
            byte += 1;
        }
        set
    }
    const WORD: [bool; 256] = mkwordset();
    WORD[b as usize]
}
```

:::

`mkwordset` は、表を作るための `const fn` です。`const WORD` の初期化で呼ばれるので、表はプログラムを作るときに決まり、実行時には作られません。

## 前提知識

- **`const fn`**: コンパイル時に実行できる関数です。ループや配列の書き換えも使えます（新しい Rust では多くが可能です）。
- **`const`**: コンパイル時に値が決まる定数です。配列のような大きな値も、そのまま埋め込まれます。
- **`[bool; 256]`**: 256 個の `bool` を並べた配列です。1 バイトの値（0 から 255）を、そのまま添字に使えます。
- **バイトリテラル `b'a'`**: 1 バイトの文字を表す書き方です。`b'a'` は 97 です。
- **`while` ループ**: 条件が成り立つ間、本体を繰り返します。`const fn` の中で使えるため、表の範囲を順に埋めるのに使われています。

## 何をしているか

### 1. 空の表を作り、記号を入れる

```rust:line-numbers=4
    const fn mkwordset() -> [bool; 256] {
        // FIXME: Use as_usize() once const functions in traits are stable.
        let mut set = [false; 256];
        set[b'_' as usize] = true;
```

全要素が `false` の配列を作り、アンダースコア `_` の位置だけを `true` にします。ここで、表の添字は文字の値そのものです。

### 2. 数字と英字の範囲を埋める

```rust:line-numbers=9
        let mut byte = b'0';
        while byte <= b'9' {
            set[byte as usize] = true;
            byte += 1;
        }
        byte = b'A';
        while byte <= b'Z' {
            set[byte as usize] = true;
            byte += 1;
        }
        byte = b'a';
        while byte <= b'z' {
            set[byte as usize] = true;
            byte += 1;
        }
```

`0` から `9`、`A` から `Z`、`a` から `z` までを、`while` ループで 1 つずつ `true` にします。範囲の端を比べるだけで、英数字の全体を埋められます。

### 3. 表を引く

```rust:line-numbers=26
    const WORD: [bool; 256] = mkwordset();
    WORD[b as usize]
```

`WORD` は `mkwordset()` の結果を入れた定数です。関数の本体では、`WORD[b as usize]` を返すだけです。実行時には、配列の添字を 1 つ読むだけになります。

## ここがすごい

- **判定が 1 回のメモリ読み込み**: 文字の範囲を比べる方法は、いくつもの比較が必要になります。表を引く方法は、1 回の読み込みで済みます。
- **表は一度だけ作られる**: `const` なので、表はビルド時に決まり、プログラムの中に埋め込まれます。実行時に表を作る費用がありません。
- **比較の方法と表の方法を比べられる**: regex-syntax にも同じ名前の関数があり、こちらは `match` で範囲を比べる書き方です。表の方法は、大量の判定を繰り返すときに向いています。
- **添字に変換しやすい**: `u8` は 0 から 255 の範囲なので、添字として使うと、表の大きさと必ず一致します。範囲外のアクセスが起きない設計です。
- **ASCII だけを扱う範囲を明示**: 表は 256 要素なので、ASCII の範囲に限られた判定だと、型で明確になります。

## まとめ

- 単語の文字の判定は、256 要素の `bool` の表を `const` で作り、添字で引くと 1 回で済む。
- 表は実行時には作られず、ビルド時に埋め込まれる。
- 1 バイトの値は、表の大きさとちょうど対応するので、安全に添字として使える。
