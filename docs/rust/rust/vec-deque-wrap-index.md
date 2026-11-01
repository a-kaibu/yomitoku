---
title: リングバッファの添字を 1 回の引き算で折り返す
description: VecDeque の wrap_index。論理的な添字が容量を超えたら、容量を 1 回引くだけで内部のバッファの位置に直す。割り算や剰余を使わない。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/collections/vec_deque/mod.rs
lines: [3767, 3777]
function: wrap_index
difficulty: 2
format: 2
tags: [データ構造, 最適化, 防御的プログラミング]
---

## ひとことで

`wrap_index` は、`VecDeque`（両端から出し入れできる配列）の中で、**論理的な添字を内部のバッファの位置に直す** 関数です。`VecDeque` の内部は、同じ領域を前後に回って使う **リングバッファ** になっています。そのため、添字が容量を超えたら、先頭に戻す必要があります。
この関数は、その折り返しを **引き算 1 回** で行います。割り算や剰余（`%`）は使いません。

## コード

```rust:line-numbers=3767
    pub(super) fn wrap_index(logical_index: usize, capacity: usize) -> WrappedIndex {
        debug_assert!(
            (logical_index == 0 && capacity == 0)
                || logical_index < capacity
                || (logical_index - capacity) < capacity
        );
        if logical_index >= capacity {
            WrappedIndex(logical_index - capacity)
        } else {
            WrappedIndex(logical_index)
        }
```

`WrappedIndex` は、折り返し済みの位置であることを型で表す薄いラッパーです。使う側が、折り返していない添字を誤って使うことを防ぎます。

## 前提知識

- **リングバッファ**: 配列の末尾の次が先頭に戻るように見なして使うデータ構造です。先頭からも末尾からも、要素を速く追加・削除できます。
- **論理的な添字と物理的な位置**: 論理的な添字は、先頭を 0 とした「何番目の要素か」です。物理的な位置は、内部の配列の実際の添字です。両者は、先頭の位置によってずれます。
- **容量（capacity）**: 内部のバッファの大きさです。論理的な添字は、この値より小さい範囲で使われる前提です。
- **`WrappedIndex`**: 折り返し済みの添字を包む型です。`VecDeque` の中で、正しい位置だけが内部の配列に使われるようにしています。
- **`debug_assert!`**: デバッグビルドでだけ、前提の条件を確かめます。

## 何をしているか

### 1. 前提を確かめる

```rust:line-numbers=3768
        debug_assert!(
            (logical_index == 0 && capacity == 0)
                || logical_index < capacity
                || (logical_index - capacity) < capacity
        );
```

デバッグビルドでは、`logical_index` が容量より小さいか、少なくとも 1 回の引き算で範囲に入る値であることを確かめます。空のバッファ（容量 0 で添字 0）も許されています。

### 2. 容量以上なら、容量を 1 回引く

```rust:line-numbers=3773
        if logical_index >= capacity {
            WrappedIndex(logical_index - capacity)
```

`logical_index` が容量以上なら、容量を引いて折り返します。添字は、容量より小さい範囲で作られるので、1 回の引き算で必ず範囲内に入ります。

### 3. それ以外はそのまま使う

```rust:line-numbers=3775
        } else {
            WrappedIndex(logical_index)
        }
```

容量より小さければ、そのままの値を位置として使います。折り返しが不要な通常の場合は、比較 1 回で済みます。

## ここがすごい

- **割り算を使わない**: 添字を `% capacity` で求めると、毎回割り算になります。この関数は、比較と引き算だけで済むので、要素へのアクセスが速くなります。
- **前提を型と `debug_assert!` で表す**: 添字が容量を超える範囲では使えない、という前提を、デバッグ時に確かめられます。リリースビルドでは、速さのために確認を省いています。
- **`WrappedIndex` で取り違えを防ぐ**: 論理的な添字と物理的な位置は、同じ `usize` ですが意味が違います。型を分けることで、折り返していない値を配列に使うミスをコンパイル時に防げます。
- **条件分岐が予測しやすい**: 多くの場合は折り返しが起きないので、分岐が一方に偏ります。CPU の分岐予測がよく当たります。
- **引き算だけで足りる理由**: 添字は `0 .. 2 * capacity` の範囲に入るので、容量を 1 回引けば十分です。何度も引く必要はありません。

## まとめ

- リングバッファの論理的な添字は、容量以上なら容量を 1 回引くだけで位置に直せる。
- 割り算や剰余を使わないので、要素アクセスの速さが保たれる。
- `WrappedIndex` 型で、折り返し済みの位置だけを配列に使うように守っている。
