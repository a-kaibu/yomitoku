---
title: 16 進数の 4 文字を表で変換し、不正な文字をまとめて判定する
description: serde_json の decode_four_hex_digits。\u に続く 4 文字を、2 つの表で 1 文字ずつ数に直し、ビットの OR を取ってから符号ビットを 1 回調べて、不正な文字を一括で判定する。
language: rust
project: serde_json
repo: https://github.com/serde-rs/json
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "8c535a260ce561eaab4111aafc29038eb9f77ff3"
file: src/read.rs
lines: [1126, 1140]
function: decode_four_hex_digits
difficulty: 3
format: 2
tags: [文字列処理, ビット演算, 防御的プログラミング]
---

## ひとことで

`decode_four_hex_digits` は、JSON の文字列にある `é` のような **16 進数 4 桁** を、1 つの数に変換する関数です。4 文字のそれぞれを、あらかじめ作っておいた表で数に直し、その結果を組み合わせます。
どれか 1 文字でも 16 進数の数字でなければ、`None` を返します。その判定を、個別の `if` ではなく、**符号ビットを 1 回調べる** だけで行っています。

## コード

::: code-group

```rust:line-numbers=1126 [日本語訳]
fn decode_four_hex_digits(a: u8, b: u8, c: u8, d: u8) -> Option<u16> {
    let a = HEX1[a as usize] as i32;
    let b = HEX0[b as usize] as i32;
    let c = HEX1[c as usize] as i32;
    let d = HEX0[d as usize] as i32;

    let codepoint = ((a | b) << 8) | c | d;

    // 符号ビットを 1 回だけ調べる。
    if codepoint >= 0 {
        Some(codepoint as u16)
    } else {
        None
    }
}
```

```rust:line-numbers=1126 [原文]
fn decode_four_hex_digits(a: u8, b: u8, c: u8, d: u8) -> Option<u16> {
    let a = HEX1[a as usize] as i32;
    let b = HEX0[b as usize] as i32;
    let c = HEX1[c as usize] as i32;
    let d = HEX0[d as usize] as i32;

    let codepoint = ((a | b) << 8) | c | d;

    // A single sign bit check.
    if codepoint >= 0 {
        Some(codepoint as u16)
    } else {
        None
    }
}
```

:::

`HEX1` と `HEX0` は、16 進数の上の桁と下の桁の値を引くための表です。その定義は、同じファイルにあります。

```rust:line-numbers=1123
static HEX0: [i16; 256] = build_hex_table(0);
static HEX1: [i16; 256] = build_hex_table(4);
```

## 前提知識

- **16 進数の 1 桁**: 0 から 9 と、A から F（大文字も小文字も）で、0 から 15 の値を表します。
- **表（テーブル）引き**: 文字の値（0 から 255）を添字にして、あらかじめ決めた値を配列から読み取る方法です。
- **符号付き整数の符号ビット**: 最上位のビットが 1 なら負の数になります。`-1` は全部のビットが 1 です。
- **`|`（OR）と `<<`（左シフト）**: 2 つの値のどちらかが 1 のビットを 1 にします。`<<` は値を左にずらします。
- **`as`**: 型を変換します。ここでは `u8` の値を `usize` の添字に、`i16` の値を `i32` に変えます。

## 何をしているか

### 1. 4 文字を表で数に直す

```rust:line-numbers=1127
    let a = HEX1[a as usize] as i32;
```

（4 文字のうち最初の文字を、上の桁の表 `HEX1` で数に直します。残りの 3 文字も同じように、上の桁か下の桁の表で変換します。）
16 進数でない文字は、表の中で `-1` になっています。

### 2. 数字をつなげ、符号ビットで判定する

```rust:line-numbers=1132
    let codepoint = ((a | b) << 8) | c | d;
```

（4 つの値を、OR で 1 つにまとめます。）
どれか 1 つでも `-1` があると、OR の結果は負の数になります。そのため、`codepoint` が負かどうかを 1 回調べれば、不正な文字があったかが分かります。

### 3. 符号ビットを 1 回調べて、結果を返す

```rust:line-numbers=1135
    if codepoint >= 0 {
```

（符号を調べて、負でなければ `Some` で値を返します。負なら `None` です。）

## ここがすごい

- **個別の判定を 1 回にまとめる**: 4 文字をそれぞれ `if` で確かめると、分岐が 4 回増えます。OR でまとめて、符号を 1 回調べるだけにしています。
- **負の値の性質を利用**: 無効な文字を `-1` にすると、どの位置で無効でも、OR の結果が負になります。値の仕組みをそのまま判定に使っています。
- **表で分岐を消す**: 文字ごとの変換は、表を引くだけです。`'0'..='9'` や `'a'..='f'` の範囲比較を、実行時にはしていません。
- **表もコンパイル時に作られる**: `static` の表は `const fn` で作られ、プログラムの中に埋め込まれます。実行時に表を作る費用がありません。
- **符号を捨てて `u16` に戻す**: 判定が済んだら、`as u16` で値を正しい範囲に戻します。負の値は、ここまで来ないので安全です。

## まとめ

- 4 文字の 16 進数は、表で数に直し、OR で 1 つにまとめる。
- 無効な文字は負の値になるので、符号ビットを 1 回調べれば、まとめて判定できる。
- 変換の表は、コンパイル時に作って埋め込む。
