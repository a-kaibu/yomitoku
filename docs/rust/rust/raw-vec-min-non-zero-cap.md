---
title: 「小さい Vec はムダ」を 3 行の場合分けで表す
description: Vec が最初に確保する最低限の容量を、要素の大きさに応じて 8・4・1 のどれかに決める関数。メモリアロケータの事情を踏まえた実用的な判断。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/raw_vec/mod.rs
lines: [163, 176]
function: min_non_zero_cap
difficulty: 1
format: 2
tags: [メモリ管理, 最適化, 可読性]
---

## ひとことで

`min_non_zero_cap` は、空の `Vec` に初めて要素を追加するときなどに、**最低でも何個分の領域を確保するか** を決める関数です。
要素 1 個の大きさ（バイト数）を受け取り、次の値を返します。

- 1 バイト（`u8` など）なら **8**
- 1024 バイト以下なら **4**
- それより大きければ **1**

冒頭のコメント「Tiny Vecs are dumb.（小さい Vec はばかげている）」が、この関数の考え方をひとことで表しています。

## コード

::: code-group

```rust:line-numbers=163 [日本語訳]
// 小さすぎる Vec は無駄が多い。次の値にする:
// - 要素の大きさが 1 バイトなら 8（多くのヒープアロケータは 8 バイト未満の要求を切り上げるため）
//   8 バイト未満の要求でも少なくとも 8 バイトは確保されるから。
// - 1 KiB 以下の要素なら 4
// - それ以外は 1（とても短い Vec で領域を無駄にしないため）
const fn min_non_zero_cap(size: usize) -> usize {
    if size == 1 {
        8
    } else if size <= 1024 {
        4
    } else {
        1
    }
}
```

```rust:line-numbers=163 [原文]
// Tiny Vecs are dumb. Skip to:
// - 8 if the element size is 1, because any heap allocator is likely
//   to round up a request of less than 8 bytes to at least 8 bytes.
// - 4 if elements are moderate-sized (<= 1 KiB).
// - 1 otherwise, to avoid wasting too much space for very short Vecs.
const fn min_non_zero_cap(size: usize) -> usize {
    if size == 1 {
        8
    } else if size <= 1024 {
        4
    } else {
        1
    }
}
```

:::

## 前提知識

- **`const fn`**: コンパイル時にも実行できる関数です。引数が定数なら、結果もコンパイル時に計算されます。
- **`usize`**: ポインタと同じ大きさの符号なし整数です。大きさや個数を表すのに使います。
- **`if` は値を返す式**: Rust の `if ... { 8 } else if ... { 4 } else { 1 }` は、それ自体が値になります。`return` を書かなくても、関数の最後の式が戻り値になります。
- **`Vec` の容量**: `Vec` は「入っている要素数」とは別に「何個まで入る領域を確保しているか（容量）」を持っています。容量を超えると、より大きな領域を確保し直します。
- **ヒープアロケータ**: 実行時にメモリを貸し出す仕組みです（`malloc` など）。

## 何をしているか

この関数は、容量を増やす関数 `grow_amortized` の中で `max(min_non_zero_cap(要素の大きさ), 新しい容量)` のように使われます。つまり、新しい容量がこの値より小さいときに、この値まで引き上げます。

### 1. 1 バイトの要素なら 8

```rust:line-numbers=169
    if size == 1 {
        8
```


`Vec<u8>` に 1 バイト追加するとき、1 バイトだけ確保してもあまり意味がありません。のコメントのとおり、ほとんどのアロケータは 8 バイト未満の要求でも少なくとも 8 バイト（またはそれ以上）を割り当てるからです。どうせ 8 バイト使うなら、最初から容量 8 として扱えば、7 回分の作り直しを省けます。

```rust:line-numbers=164
// - 8 if the element size is 1, because any heap allocator is likely
//   to round up a request of less than 8 bytes to at least 8 bytes.
```


### 2. 1 KiB 以下なら 4

```rust:line-numbers=171
    } else if size <= 1024 {
        4
```


`Vec<i32>`（4 バイト）や、ちょっとした構造体の `Vec` なら、最初は 4 個分を確保します。`push` で 1 個ずつ追加すると、容量は `4 → 8 → 16 → ...` と増えていきます。

### 3. 大きい要素なら 1

```rust:line-numbers=173
    } else {
        1
    }
```


1 個が 1 KiB を超えるような大きな要素で 4 個分を確保すると、1 個しか使わない場合に 3 KiB 以上が無駄になります。そこで大きな要素では最低 1 個にとどめます。

## ここがすごい

- **アロケータの実情に合わせる**: 「小さな確保要求は切り上げられる」という現実の振る舞いを前提に、どうせ確保されるメモリを最初から使えるようにしています。理論だけでなく実装環境を見た判断です。
- **無駄な作り直しを減らす**: 容量 1 → 2 → 4 と育てると、最初の数回の `push` のたびにメモリの確保とコピーが起きます。最初から 4 や 8 にすれば、小さな `Vec` で多い「数個だけ入れる」使い方が速くなります。
- **大きな要素では控えめに**: 一律に 4 にせず、要素の大きさで場合分けしているので、メモリの無駄も抑えられます。速さとメモリ使用量のバランスを 3 段階の単純なルールで取っています。
- **コンパイル時に決まる**: 要素の大きさは型ごとに決まった定数なので、この関数の結果もコンパイル時に計算され、実行時の場合分けは残りません。

## まとめ

- 小さすぎる容量から始めると、最初の追加で何度も作り直しが起きる。
- メモリアロケータは小さな要求を切り上げることが多いので、それに合わせて確保すると無駄がない。
- 要素の大きさに応じて最低容量を変えると、速さとメモリのバランスが取れる。
- 経験則に基づく定数は、その理由をコメントで短く書いておく。
