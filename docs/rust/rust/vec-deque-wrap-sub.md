---
title: 引き算が下に溢れても、リングバッファの位置を正しく戻す
description: VecDeque の wrap_sub。位置から数を引くとき、符号なしの引き算が 0 より下に溢れることを、容量を足してから折り返すことで防ぐ。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/collections/vec_deque/mod.rs
lines: [258, 263]
function: wrap_sub
difficulty: 3
format: 2
tags: [データ構造, 数値計算, 防御的プログラミング]
---

## ひとことで

`wrap_sub` は、`VecDeque` の内部で、**ある論理的な添字から一定の数を引いた位置** を、リングバッファの範囲内に直す関数です。たとえば先頭から 2 つ前の要素の位置を求めるときに使われます。
添字は符号なしの整数なので、引き算すると 0 より小さい値になると溢れてしまいます。この関数は、先に容量を足しておくことで、溢れを避けてから折り返しています。

## コード

```rust:line-numbers=258
    fn wrap_sub(&self, idx: WrappedIndex, subtrahend: usize) -> WrappedIndex {
        wrap_index(
            idx.as_index().wrapping_sub(subtrahend).wrapping_add(self.capacity()),
            self.capacity(),
        )
    }
```

`wrapping_sub` は、溢れても止まらない引き算です。その後に `wrapping_add` で容量を足すことで、結果が 0 から 2 倍の容量の範囲に入るようにしています。

## 前提知識

- **符号なしの溢れ**: `usize` の引き算で結果が 0 より小さくなると、2^64 などの大きな値になってしまいます。通常の `-` ではパニックするか、誤った値になります。
- **`wrapping_sub` と `wrapping_add`**: 溢れても止まらず、型の範囲で折り返した値を返す引き算と足し算です。
- **`wrap_index`**: 添字が容量以上なら容量を 1 回引いて、位置の範囲に直す関数です。この `wrap_sub` の最後で呼ばれます。
- **`as_index`**: 折り返し済みの位置（`WrappedIndex`）から、`usize` の添字を取り出します。
- **リングバッファの前提**: 添字は、容量より小さい範囲で扱われます。引く数も、容量以下であることが前提です。

## 何をしているか

### 1. 引いたあとに容量を足す

```rust:line-numbers=259
        wrap_index(
            idx.as_index().wrapping_sub(subtrahend).wrapping_add(self.capacity()),
            self.capacity(),
```

まず `idx.as_index()` から `subtrahend` を引きます。結果が 0 より小さいと、`wrapping_sub` によって大きな値になります。そこに `capacity()` を `wrapping_add` で足すと、結果は 0 から 2 倍の容量の範囲に入ります。
引く数が容量以下なら、この結果は必ず 0 以上になります。

### 2. 折り返して位置に直す

```rust:line-numbers=258
    fn wrap_sub(&self, idx: WrappedIndex, subtrahend: usize) -> WrappedIndex {
        wrap_index(
            idx.as_index().wrapping_sub(subtrahend).wrapping_add(self.capacity()),
            self.capacity(),
        )
    }
```

関数の残りの部分は、その値を `wrap_index` に渡して、容量以上なら容量を 1 回引かせる、という流れです。結果は、リングバッファの中の正しい位置になります。

## ここがすごい

- **溢れを避けつつ、比較を 1 回に抑える**: 先に容量を足すことで、符号なしの引き算が溢れないようにしています。そのあとの処理は、`wrap_index` の 1 回の比較と引き算だけです。
- **負の値を扱わない**: 符号付きの整数に変えると、型の変換や範囲の確認が増えます。容量を足すという 1 回の加算で、すべて `usize` のまま計算できます。
- **`wrapping_sub` の使い分け**: 途中の値が一時的に溢れても、最後に容量を足せば正しい値に戻ります。溢れを前提とした計算を、`wrapping_` 系のメソッドで明確に書いています。
- **`wrap_add` と対になっている**: 同じ形の `wrap_add`（足し算版）と並べると、前後の移動がどちらも折り返しで扱われることが分かります。
- **型で位置を表す**: 結果は `WrappedIndex` になるので、折り返し済みの位置だけが配列に使われる仕組みと合わせて、安全に扱えます。

## まとめ

- 符号なしの引き算は、先に容量を足してから折り返すと、溢れずに正しい位置が得られる。
- そのために `wrapping_sub` と `wrapping_add` を組み合わせる。
- 引く数は容量以下である、という前提を守ることが必要。
