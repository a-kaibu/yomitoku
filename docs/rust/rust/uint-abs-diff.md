---
title: 「差の絶対値」でコンパイラに専用命令を使わせるための書き分け
description: 符号なし整数どうしの差の絶対値を返す関数。1 バイト整数のときだけ、わざと遠回りな式で書いて CPU の専用命令が出るよう誘導している。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/num/uint_macros.rs
lines: [3193, 3205]
function: abs_diff
difficulty: 2
format: 2
tags: [最適化, 数値計算, ハック]
---

## ひとことで

`abs_diff` は、2 つの符号なし整数 `a` と `b` の **差の絶対値** `|a - b|` を返す関数です。
`3u8.abs_diff(10)` は `7`、`10u8.abs_diff(3)` も `7` です。

符号なし整数は負の数を表せないので、`a - b` をそのまま計算すると `a < b` のときにオーバーフローしてしまいます。そこで「大きいほうから小さいほうを引く」のが基本ですが、この関数は **1 バイトの型（`u8`）のときだけ別の書き方** をしています。

## コード

::: code-group

```rust:line-numbers=3193 [日本語訳]
        pub const fn abs_diff(self, other: Self) -> Self {
            if size_of::<Self>() == 1 {
                // SSE2 が使えて、u8 でこの関数が自動ベクトル化されるとき、
                // LLVM に psadbw 命令を生成させるための書き方。
                (self as i32).wrapping_sub(other as i32).unsigned_abs() as Self
            } else {
                if self < other {
                    other - self
                } else {
                    self - other
                }
            }
        }
```

```rust:line-numbers=3193 [原文]
        pub const fn abs_diff(self, other: Self) -> Self {
            if size_of::<Self>() == 1 {
                // Trick LLVM into generating the psadbw instruction when SSE2
                // is available and this function is autovectorized for u8's.
                (self as i32).wrapping_sub(other as i32).unsigned_abs() as Self
            } else {
                if self < other {
                    other - self
                } else {
                    self - other
                }
            }
        }
```

:::

## 前提知識

- **マクロで生成されるコード**: このコードは `u8`・`u16`・`u32`・`u64` など、すべての符号なし整数型に対して同じ関数を作るマクロの一部です。`Self` は「いまの型（例: `u8`）」を指します。
- **`self` と `other`**: Rust のメソッドは最初の引数 `self` が「呼び出し元の値」です。`a.abs_diff(b)` なら `self` が `a`、`other` が `b` になります。
- **`size_of::<Self>()`**: 型が何バイトかを返します。`u8` なら 1、`u32` なら 4 です。`::<Self>` は「型を引数として渡す」書き方（ジェネリクス）です。
- **`if` は値を返す式**: Rust の `if ... { x } else { y }` は、それ自体が値になります。三項演算子の代わりに使えます。
- **`as`・`wrapping_sub`・`unsigned_abs`**: `as i32` は符号付き 32 ビット整数への変換、`wrapping_sub` はオーバーフローしたら折り返す引き算、`unsigned_abs` は絶対値を符号なしで返すメソッドです。

## 何をしているか

### 1. 型の大きさで分岐する

```rust:line-numbers=3194
            if size_of::<Self>() == 1 {
```

`size_of::<Self>() == 1` はコンパイル時に決まる値です。`u8` 版ではつねに真、それ以外ではつねに偽なので、コンパイラは使わないほうの枝を完全に消します。実行時に分岐が残ることはありません。

### 2. `u8` の場合: いったん `i32` に広げる

```rust:line-numbers=3197
                (self as i32).wrapping_sub(other as i32).unsigned_abs() as Self
```

`self = 3`、`other = 10` とすると、

```
3 as i32 = 3, 10 as i32 = 10
3.wrapping_sub(10) = -7
(-7).unsigned_abs() = 7
7 as u8 = 7
```

となります。`i32` は負の数を表せるので、そのまま引いて絶対値を取れば OK です。`u8` の範囲（0〜255）なら差は -255〜255 なので、`i32` でオーバーフローすることもありません（`wrapping_sub` は念のための書き方です）。

### 3. それ以外の型: 大きいほうから小さいほうを引く

```rust:line-numbers=3199
                if self < other {
                    other - self
                } else {
                    self - other
                }
```

`self < other` なら `other - self`、そうでなければ `self - other`。これなら結果がつねに 0 以上になり、オーバーフローしません。

## ここがすごい

- **コンパイラの「パターン認識」に合わせて書く**: コメントにあるとおり、`u8` の書き方は x86 CPU の `psadbw`（バイトごとの差の絶対値を足し合わせる SIMD 命令）を LLVM（Rust が使うコンパイラ基盤）に生成させるためのものです。大量のバイト列の差を合計するような処理を自動ベクトル化（ループを SIMD 命令でまとめて処理する最適化）したとき、この形なら専用命令に置き換えてもらえます。
- **意味は同じ、速さが違う**: 2 つの書き方はどちらも正しい答えを返します。違うのは「コンパイラにとって認識しやすいかどうか」だけです。最適化はアルゴリズムだけでなく、コンパイラとの付き合い方でもあることがわかります。
- **ゼロコストの型分岐**: `size_of` による分岐はコンパイル時に消えるので、汎用コードを 1 つ書きつつ型ごとに最適な実装を選べます。
- **理由をコメントで残す**: 一見「なぜわざわざ i32 に?」と思う書き方ですが、2 行のコメントで意図がはっきりわかります。後から誰かが「シンプルにしよう」と書き換えて性能を落とすのを防げます。

## まとめ

- 符号なし整数の差は、大きいほうから小さいほうを引けば安全に求められる。
- 小さい型なら、大きい符号付き型に広げてから計算するのも手。
- 同じ意味のコードでも、コンパイラが認識しやすい形にすると専用命令が使われることがある。
- 意外な書き方には、必ずその理由をコメントで書いておく。
