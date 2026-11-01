---
title: 一番下のビットを 1 回の引き算と AND で消す
description: 整数のいちばん下で 1 になっているビットを、引き算と AND だけで消す hashbrown の内部関数。反復処理で一致した位置を 1 つずつ取り出すのに使われる。
language: rust
project: hashbrown
repo: https://github.com/rust-lang/hashbrown
license: MIT OR Apache-2.0
copyright: Copyright (c) 2016 Amanieu d'Antras
commit: "f7bae3d165a3191d086a506ce6a39e516ffd5c67"
file: src/control/bitmask.rs
lines: [24, 29]
function: BitMask::remove_lowest_bit
difficulty: 1
format: 2
tags: [ビット演算, ハック, ハッシュ]
---

## ひとことで

`remove_lowest_bit` は、`BitMask`（ビットが 1 のところが「一致した位置」を表す整数）の中で、**いちばん下の 1 のビットを消す** 関数です。
たとえば `0b0101_1000` は `0b0101_0000` になります。

hashbrown という高速なハッシュテーブルでは、1 つのグループに含まれる一致位置をこの関数で 1 つずつ取り出します。取り出しのたびにビットを消すので、同じ位置を二度返すことがありません。

## コード

::: code-group

```rust:line-numbers=24 [日本語訳]
    /// いちばん下のビットを取り除いた新しい `BitMask` を返す。
    #[inline]
    #[must_use]
    fn remove_lowest_bit(self) -> Self {
        BitMask(self.0 & (self.0 - 1))
    }
```

```rust:line-numbers=24 [原文]
    /// Returns a new `BitMask` with the lowest bit removed.
    #[inline]
    #[must_use]
    fn remove_lowest_bit(self) -> Self {
        BitMask(self.0 & (self.0 - 1))
    }
```

:::

## 前提知識

- **`BitMask`**: この型の中身は整数 1 つです（`pub(crate) struct BitMask(pub(crate) BitMaskWord);`）。各ビットが「その位置が一致した」という印になります。
- **`self.0`**: 構造体の 1 つ目の要素を指す書き方です。`BitMask(x)` の `x` は `self.0` で取り出せます。
- **`fn` の戻り値 `Self`**: `Self` は実装しているのと同じ型（ここでは `BitMask`）を指します。
- **引き算の挙動**: 符号なし整数では、0 から 1 を引くと全ビットが 1 になるように折り返されます。ここでは `self.0` が 0 でない前提で使われます。
- **`&` と `-`**: `&` はビットごとの AND、`-` は引き算です。Rust では `-` の優先順位が `&` より高いので、`self.0 & (self.0 - 1)` は `(self.0 - 1)` を先に計算してから AND を取ります。括弧で書かれているのは読みやすさのためです。

## 何をしているか

### 1. いちばん下の 1 のビットを確かめる

たとえば `self.0 = 0b0101_1000` です。いちばん下の 1 は、右から 4 番目（値は 8）のビットです。

### 2. 1 を引く

```rust:line-numbers=28
        BitMask(self.0 & (self.0 - 1))
```

`self.0 - 1` を計算すると、いちばん下の 1 のビットは 0 になり、その右側のビットはすべて 1 になります。

```
self.0      = 0101 1000
self.0 - 1  = 0101 0111
AND         = 0101 0000
```

上の式の結果と AND を取ると、右側の 0 のビットは 0 のまま、いちばん下の 1 だけが消えた値になります。上の位のビットは両方とも 1 なので残ります。こうして、いちばん下の 1 のビットだけが取り除かれます。

### 3. 反復処理で使う

```rust:line-numbers=102
    fn next(&mut self) -> Option<usize> {
        let bit = self.0.lowest_set_bit()?;
        self.0 = self.0.remove_lowest_bit();
        Some(bit)
    }
```

`BitMaskIter` の `next` は、まず `lowest_set_bit` で一番下の 1 の位置を取り出し、次に `remove_lowest_bit` でそのビットを消します。何度呼んでも、一致した位置を小さい順に 1 つずつ返します。

## ここがすごい

- **1 回の引き算と AND で済む**: 1 ビットずつ右からシフトして確かめる方法より、ずっと少ない命令数で同じ結果になります。CPU の命令で見ても数個です。
- **ビットを消すのに分岐がない**: `if` で一番下の位置を探す必要がありません。値が 0 のとき以外は、どんな値でも同じ式で正しく動きます。
- **ビットハックの定番**: `x & (x - 1)` は、整数の 1 の個数を数える（popcount）や、2 のべき乗の判定などで使われる定番の技法です。この関数はその一番基本の形をしています。
- **反復の安全性**: 消したビットは二度と見ないので、ループが同じ位置を返し続けることがありません。取り出し処理の終わりは、ビットが 0 になることで自然に決まります。
- **短い関数に意味を集めた**: `remove_lowest_bit` は 1 行で、名前が動きをそのまま表しています。読み手は実装を見なくても、呼び出し側の意味がわかります。

## まとめ

- `x & (x - 1)` は、いちばん下の 1 のビットを 1 回の演算で消す。
- 一致位置の列挙は、「一番下を取り出す」「そのビットを消す」を繰り返せば書ける。
- 分岐を使わない小さな式は、読みやすさを保ったまま速さも得られる。
- ビットハックは名前を付けて関数にすると、呼び出し側の意味がわかりやすくなる。
