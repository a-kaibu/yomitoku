---
title: 立っているビットの位置を順に取り出す
description: hashbrown の BitMask を回して、1 になっているビットの位置を低い順に返すイテレータ。一番下の 1 を取り出して消す操作を繰り返す。
language: rust
project: hashbrown
repo: https://github.com/rust-lang/hashbrown
license: MIT OR Apache-2.0
copyright: Copyright (c) 2016 Amanieu d'Antras
commit: "f7bae3d165a3191d086a506ce6a39e516ffd5c67"
file: src/control/bitmask.rs
lines: [101, 106]
function: BitMaskIter::next
difficulty: 2
format: 2
tags: [イテレータ, ビット演算, ハッシュ]
---

## ひとことで

`BitMaskIter::next` は、`BitMask` の中で **1 になっているビットの位置** を、小さいほうから 1 つずつ返すイテレータの `next` 関数です。`for` 文で回すと、1 になっている場所をすべて順に得られます。
仕組みはシンプルで、一番下の 1 の位置を求めて、その 1 を消し、また次の一番下の 1 を探します。

hashbrown では、同じグループの中で一致するハッシュの候補を順に調べるときに使われています。

## コード

```rust:line-numbers=101
    #[inline]
    fn next(&mut self) -> Option<usize> {
        let bit = self.0.lowest_set_bit()?;
        self.0 = self.0.remove_lowest_bit();
        Some(bit)
    }
```

`lowest_set_bit` と `remove_lowest_bit` は、それぞれ「一番下の 1 の位置」「一番下の 1 を消す」を行う関数です。`next` はこの 2 つを組み合わせています。

## 前提知識

- **イテレータ**: 要素を 1 つずつ取り出せる仕組みです。`next` を呼ぶと、`Some(値)` か、もう無いことを表す `None` を返します。
- **`?` 演算子**: `Option` の `None` をその場で関数の戻り値にして、早く抜ける書き方です。ここでは、1 が無いときに `None` を返すために使っています。
- **`lowest_set_bit`**: 最も下の 1 のビットの位置を返します。1 が無ければ `None` です。
- **`remove_lowest_bit`**: 最も下の 1 のビットを 0 に変えた値を返します。
- **`BITMASK_STRIDE`**: 1 つの要素が何ビットを使うかを表す定数です。位置を計算するとき、ビット位置をこの数で割ります。

## 何をしているか

### 1. 一番下の 1 の位置を取り出す

```rust:line-numbers=103
        let bit = self.0.lowest_set_bit()?;
```

`lowest_set_bit()?` で、一番下の 1 の位置を取り出します。1 が 1 つも無ければ、ここで `None` を返して、イテレータは終わります。

```rust:line-numbers=39
    pub(crate) fn lowest_set_bit(self) -> Option<usize> {
        if let Some(nonzero) = NonZeroBitMaskWord::new(self.0) {
            Some(Self::nonzero_trailing_zeros(nonzero))
        } else {
            None
        }
    }
```

`lowest_set_bit` は、`NonZero` の値に変換してから、末尾の 0 の数を数えています。0 のときは `None` になるので、空のときを安全に扱えます。

### 2. その 1 を消して、次の候補を残す

```rust:line-numbers=104
        self.0 = self.0.remove_lowest_bit();
```

`remove_lowest_bit` で、今取り出した 1 を 0 に変えます。次に `next` が呼ばれたときは、残った中で一番下の 1 が取り出されます。

### 3. 位置を返す

```rust:line-numbers=105
        Some(bit)
```

取り出した位置を `Some` に包んで返します。`for` 文は、`None` が返るまでこれを繰り返します。

## ここがすごい

- **ループの回数が 1 の数と同じ**: 1 が 3 つあれば、`next` は 3 回だけ `Some` を返します。空のビットを何度も見る無駄がありません。
- **一番下の 1 を選ぶ仕組みが安い**: 末尾の 0 の数は、CPU の命令 1 つで求められます。位置を探すのに長いループは要りません。
- **状態は 1 つの整数だけ**: イテレータの持つ状態は `BitMask` の中の数字だけです。消費したビットを消すことで、進み具合を覚えています。
- **Option と `?` で終わりを表す**: 終わりを特別な値ではなく `None` で表すので、呼び出し側が `for` 文で自然に使えます。
- **グループの中の複数の一致を調べられる**: hashbrown では、同じグループ（SSE2 では 16 バイト）の中で、ハッシュの一致候補がいくつもあります。このイテレータで、それらを 1 つずつ確かめられます。

## まとめ

- 立っているビットの位置は、一番下の 1 を探して消す操作を繰り返すと、順に取り出せる。
- `next` は、位置を返す処理と、その 1 を消す処理の 2 段で作られている。
- 1 の数だけループが回るので、無駄なく全部の一致を調べられる。
