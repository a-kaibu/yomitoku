---
title: ハッシュの上位 7 ビットを、表の目印にする
description: hashbrown の Tag::full。ハッシュ値の上の 7 ビットを取り出し、各バケットの目印（tag）にする。環境によって幅が違うハッシュ値でも、同じ位置から取り出す。
language: rust
project: hashbrown
repo: https://github.com/rust-lang/hashbrown
license: MIT OR Apache-2.0
copyright: Copyright (c) 2016 Amanieu d'Antras
commit: "f7bae3d165a3191d086a506ce6a39e516ffd5c67"
file: src/control/tag.rs
lines: [35, 49]
function: Tag::full
difficulty: 2
format: 2
tags: [ハッシュ, ビット演算, データ構造]
---

## ひとことで

`Tag::full` は、ハッシュ値の **上の 7 ビット** を取り出して、表のバケットに付ける目印（タグ）を作る関数です。タグは 1 バイトに収まり、ハッシュ値の一部を表します。
表に値を探しに行くとき、まずこのタグを比べて、違うバケットを素早く除外します。ハッシュの全部を比べるより、ずっと軽い作業で済みます。

## コード

::: code-group

```rust:line-numbers=35 [日本語訳]
    pub(crate) const fn full(hash: u64) -> Tag {
        // ハッシュの上位 7 ビットを取り出す関数のための定数。
        const MIN_HASH_LEN: usize = if size_of::<usize>() < size_of::<u64>() {
            size_of::<usize>()
        } else {
            size_of::<u64>()
        };

        // ハッシュの上位 7 ビットを取り出す。ハッシュは通常は 64 ビット全体だが、
        // FxHash のように usize を返すハッシュ関数もあるため、
        // 32 ビット環境では上位 32 ビットが 0 になることがある。
        // そこで MIN_HASH_LEN を使ってこれに対応する。
        let top7 = hash >> (MIN_HASH_LEN * 8 - 7);
        Tag((top7 & 0x7f) as u8) // 切り詰め
    }
```

```rust:line-numbers=35 [原文]
    pub(crate) const fn full(hash: u64) -> Tag {
        // Constant for function that grabs the top 7 bits of the hash.
        const MIN_HASH_LEN: usize = if size_of::<usize>() < size_of::<u64>() {
            size_of::<usize>()
        } else {
            size_of::<u64>()
        };

        // Grab the top 7 bits of the hash. While the hash is normally a full 64-bit
        // value, some hash functions (such as FxHash) produce a usize result
        // instead, which means that the top 32 bits are 0 on 32-bit platforms.
        // So we use MIN_HASH_LEN constant to handle this.
        let top7 = hash >> (MIN_HASH_LEN * 8 - 7);
        Tag((top7 & 0x7f) as u8) // truncation
    }
```

:::

`MIN_HASH_LEN` は、ハッシュ値の幅のうち、使える幅（`usize` の大きさ）を表す定数です。この値で、上位 7 ビットの位置を決めています。

## 前提知識

- **ハッシュ値の上位ビットと下位ビット**: 同じハッシュ値でも、上の位と下の位では役割が違います。hashbrown は、下の位で表のどこに置くか（`h1`）を決め、上の位で目印（`h2`）を作っています。両者を別のビットから取ることで、かぶりにくくなります。
- **`>>`（右シフト）**: ビットを右へずらし、下の位を捨てます。`hash >> (MIN_HASH_LEN * 8 - 7)` で、上の 7 ビットだけを残します。
- **`& 0x7f`**: `0x7f` は下位 7 ビットが 1 のマスクです。右シフトの結果を 7 ビットに収めるために使います。
- **`u8`**: 1 バイトの整数です。タグは 1 バイトに収まるように作られています。
- **`size_of`**: 型の大きさをバイトで返す関数です。環境に合わせた定数を、コンパイル時に決めるために使います。

## 何をしているか

### 1. 使えるハッシュ幅を決める

```rust:line-numbers=37
        const MIN_HASH_LEN: usize = if size_of::<usize>() < size_of::<u64>() {
            size_of::<usize>()
        } else {
            size_of::<u64>()
        };
```

`usize` が `u64` より小さい環境（32 ビットなど）では、`usize` の幅を使い、そうでなければ `u64` の幅を使います。どちらの場合も、ハッシュ値の上位のビットを正しく取り出すための基準です。

### 2. 上位 7 ビットを取り出す

```rust:line-numbers=47
        let top7 = hash >> (MIN_HASH_LEN * 8 - 7);
```

`MIN_HASH_LEN * 8 - 7` ビットだけ右にずらすと、ハッシュ値の上の 7 ビットだけが残ります。たとえば 64 ビットの環境では、57 ビットずらします。

### 3. 7 ビットに収めて、タグにする

```rust:line-numbers=48
        Tag((top7 & 0x7f) as u8) // truncation
```

`& 0x7f` で、残った値を 7 ビットに収め、`u8` に変換してタグにします。タグの最上位ビットは 0 になるので、後で「満たされたバケット」を見分けるのに使われます。

## ここがすごい

- **1 バイトで、ハッシュの一部を表せる**: タグは 1 バイトです。16 個のバケットのタグを、16 バイトの 1 つの領域にまとめて、SIMD 命令で一度に比べられます。
- **下位ビットと役割を分ける**: 表の位置は下位ビットで決め、目印は上位ビットから取ります。同じ位置に来た別の値でも、目印が違えば区別できることが多くなります。
- **環境の違いを定数で吸収する**: コメントにあるように、FxHash のような `usize` を返すハッシュ関数では、32 ビット環境で上位 32 ビットが 0 になります。`MIN_HASH_LEN` を使うと、どの環境でも上位 7 ビットが正しく取れます。
- **ビット操作だけで済む**: 右シフトと `&` だけで、割り算や剰余を使わずにタグが作れます。
- **定数の計算はコンパイル時**: `MIN_HASH_LEN` は `const` なので、実行時の分岐は残りません。

## まとめ

- 目印（タグ）は、ハッシュ値の上の 7 ビットを 1 バイトに収めて作る。
- 表の位置は下位ビットで決めるので、目印と位置が別の情報になる。
- 環境で異なるハッシュ幅は、定数で揃えてから上位ビットを取る。
