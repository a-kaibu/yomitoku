---
title: 引き算1回で「8バイトのどこかに0があるか」を判定する
description: 整数に詰めた 8 バイトのどれかが 0 かどうかを、引き算・反転・AND の 3 演算で判定する古典的なビットハック。memchr の高速化の心臓部。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/slice/memchr.rs
lines: [10, 20]
function: contains_zero_byte
difficulty: 3
format: 2
tags: [ビット演算, 最適化, ハック]
---

## ひとことで

`contains_zero_byte` は、`usize`（64 ビット環境では 8 バイト）の値 `x` の中に **値が `0x00` のバイトが 1 つでもあるか** を返す関数です。

1 バイトずつ比べれば 8 回の比較が必要ですが、この関数は **引き算 1 回、AND 2 回、反転 1 回** で答えを出します。
これをバイト検索 `memchr` に使うと、「探したいバイトと XOR して 0 になったバイトがあるか」を 8 バイト同時に調べられます。

## コード

::: code-group

```rust:line-numbers=10 [日本語訳]
/// `x` のどこかに 0 のバイトがあれば `true` を返す。
///
/// 出典: J. Arndt『Matters Computational』
///
/// 「各バイトから 1 を引き、借りが最上位ビットまで伝わったバイトを探す」
/// というのが考え方である。
/// 」
#[inline]
const fn contains_zero_byte(x: usize) -> bool {
    x.wrapping_sub(LO_USIZE) & !x & HI_USIZE != 0
}
```

```rust:line-numbers=10 [原文]
/// Returns `true` if `x` contains any zero byte.
///
/// From *Matters Computational*, J. Arndt:
///
/// "The idea is to subtract one from each of the bytes and then look for
/// bytes where the borrow propagated all the way to the most significant
/// bit."
#[inline]
const fn contains_zero_byte(x: usize) -> bool {
    x.wrapping_sub(LO_USIZE) & !x & HI_USIZE != 0
}
```

:::

## 前提知識

- **`usize::repeat_u8(0x01)`**: `0x01` を全バイトに並べた定数です（`LO_USIZE`）。64 ビットなら `0x0101010101010101`。同様に `HI_USIZE` は `0x8080808080808080` で、各バイトの最上位ビットだけが 1 です。
- **`wrapping_sub`**: 引き算をして、0 を下回ったら折り返す（オーバーフローを許す）メソッドです。
- **`!x`**: ビット反転です。
- **演算子の優先順位**: Rust では `&` が `!=` より先に計算されるので、`a & b & c != 0` は `(a & b & c) != 0` と読みます。
- **`///` コメント**: ドキュメントコメントです。関数の説明として API ドキュメントに出力されます。

## 何をしているか

アイデアはコメントの引用のとおり、「**各バイトから 1 を引くと、0 のバイトだけは借りが最上位ビットまで伝わる**」ことです。

### 1. 各バイトから 1 を引く

```rust:line-numbers=18
const fn contains_zero_byte(x: usize) -> bool {
    x.wrapping_sub(LO_USIZE) & !x & HI_USIZE != 0
}
```

`x.wrapping_sub(LO_USIZE)` は、全バイトから同時に 1 を引くのに近い計算です。
`0x00` のバイトから 1 を引くと `0xFF` になり、最上位ビットが 1 になります。

### 2. もともと最上位ビットが立っていたバイトを除く

`0x81` のようなバイトは、1 を引いても `0x80` で最上位ビットが 1 のままです。これを「0 だった」と誤解しないように、`& !x` で **元の値で最上位ビットが 0 だったバイト** だけを残します。

### 3. 最上位ビットだけを見る

`& HI_USIZE` で各バイトの最上位ビットだけを残し、どれか 1 つでも立っていれば「0 のバイトがある」と判定します。

32 ビット（4 バイト）で `x = 0x41004243` の例です（2 バイト目が 0）。

```
x - 0x01010101 = 0x3FFF4142
!x             = 0xBEFFBDBC
AND            = 0x3EFF0100
& 0x80808080   = 0x00800000  ≠ 0 → true
```

0 のバイトの位置にだけ最上位ビットが残りました。

なお、0 のバイトから借りが発生すると、そのすぐ上のバイトも 1 余分に引かれます。このため「どのバイトが 0 か」の位置は上側で誤判定することがありますが、「**1 つでも 0 があるか**」の答えは必ず正しくなります。いちばん下にある 0 のバイトは、それより下からの借りを受けないので、確実に検出されるからです。memchr はこの関数で「この 8 バイトに候補がある」とわかったら、そこからは 1 バイトずつ調べ直すので問題ありません。

## ここがすごい

- **比較を算術に置き換える**: 「0 か」の比較 8 回を、引き算の借りの伝わり方で一度に調べています。分岐がないので CPU の予測ミスもありません。
- **誤検出を `!x` で潰す**: 最上位ビットがもともと立っていたバイトを除外する一手で、判定を正確にしています。
- **歴史のある技法**: コメントに出典（J. Arndt『Matters Computational』）が書かれています。C の `strlen` などでも昔から使われている有名なハックです。
- **検索に転用できる**: `x` を「探したいバイトを全バイトに並べた値と XOR したもの」にすれば、「そのバイトがあるか」の判定になります。同じファイルの `memchr_aligned` がまさにその使い方をしています。

## まとめ

- 0 から 1 を引くと最上位ビットまで借りが伝わる。これで 0 を見つけられる。
- `& !x` で、もともと最上位ビットが立っていたものを除外する。
- 「あるかどうか」だけを高速に判定し、位置は後で精密に調べる、という 2 段構えが効率的。
