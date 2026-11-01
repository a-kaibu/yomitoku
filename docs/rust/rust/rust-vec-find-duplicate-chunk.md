---
title: 一定の幅の中で、最初に重なる位置をビットで探す
description: Vec::dedup の内部で、重複の位置を探す find_duplicate。隣り合う要素の一致を 1 ビットずつ mask に集め、trailing_zeros で最初の重複位置を求める。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/vec/mod.rs
lines: [3832, 3851]
function: find_duplicate
difficulty: 3
format: 2
tags: [アルゴリズム, ビット演算, 探索]
---

## ひとことで

`find_duplicate` は、`Vec` の重複を取り除く処理（`dedup`）で使われる、小さな探索の関数です。スライスの一部、長さ `chunk_size` の区間の中で、**隣り合う要素が等しくなる最初の位置** を探します。

比較の結果を 1 ビットずつ `mask` という整数にまとめ、最後にその中で最も低い 1 のビットを探します。こうすると、比較を全部終えてから結果をまとめて判断できるので、CPU が並列に比較を進めやすくなります。

## コード

::: code-group

```rust:line-numbers=3832 [日本語訳]
    unsafe fn find_duplicate<T: PartialEq>(
        v: &[T],
        start: usize,
        chunk_size: usize,
    ) -> Option<usize> {
        let mut mask: u32 = 0;
        debug_assert!(
            u32::BITS as usize >= chunk_size,
            "the bit width of mask must be greater than or equal to chunk_size"
        );
        for j in 0..chunk_size {
            // SAFETY: start + j は常に [1..v.len()) の範囲内
            let eq = unsafe { v.get_unchecked(start + j) == v.get_unchecked(start + j - 1) };
            mask |= (eq as u32) << j;
        }
        if mask != 0 {
            return Some(start + mask.trailing_zeros() as usize);
        }
        None
    }
```

```rust:line-numbers=3832 [原文]
    unsafe fn find_duplicate<T: PartialEq>(
        v: &[T],
        start: usize,
        chunk_size: usize,
    ) -> Option<usize> {
        let mut mask: u32 = 0;
        debug_assert!(
            u32::BITS as usize >= chunk_size,
            "the bit width of mask must be greater than or equal to chunk_size"
        );
        for j in 0..chunk_size {
            // SAFETY: start + j always in range [1..v.len())
            let eq = unsafe { v.get_unchecked(start + j) == v.get_unchecked(start + j - 1) };
            mask |= (eq as u32) << j;
        }
        if mask != 0 {
            return Some(start + mask.trailing_zeros() as usize);
        }
        None
    }
```

:::

この関数は、`find_first_duplicate` の中から区間ごとに呼ばれます。`Some` が返ると、その位置が最初の重複として使われます。`None` なら、この区間には重複がないので、次の区間へ進みます。

## 前提知識

- **`dedup`**: 隣り合う同じ要素をまとめて 1 つにする操作です。ソート済みの列から重複を消すのによく使われます。
- **`mask`**: 比較の結果を 1 ビットずつ入れた整数です。`j` 番目のビットが、`j` 番目の比較の結果を表します。
- **`trailing_zeros`**: 最も下位にある 1 より下の 0 の個数を返します。`mask` の中で最初に見つかった一致の位置を、そのまま表します。
- **`unsafe`**: 境界の確認を省いて高速化した処理です。呼び出し側が、範囲が正しいことを保証します。
- **`get_unchecked`**: 範囲の確認をせずに要素を取り出します。`SAFETY` のコメントに、その前提が書かれています。

## 何をしているか

### 1. 区間の中で隣との一致を調べる

```rust:line-numbers=3842
        for j in 0..chunk_size {
            // SAFETY: start + j always in range [1..v.len())
            let eq = unsafe { v.get_unchecked(start + j) == v.get_unchecked(start + j - 1) };
            mask |= (eq as u32) << j;
        }
```

`j` を 0 から `chunk_size - 1` まで動かし、`start + j` の要素と、その 1 つ前の要素が等しいかを比べます。等しければ、`mask` の `j` 番目のビットを 1 にします。この段階では、途中で止まらずに全部比べます。

### 2. 一致があれば、最初の位置を返す

```rust:line-numbers=847
    /// This method must be called if the memory used by `Vec` needs to appear in the final
    /// values of constants.
    #[unstable(feature = "const_heap", issue = "79597")]
```

`mask` が 0 でなければ、どこかで一致しています。`trailing_zeros` で、最も低いビットの位置を求めます。それが最初に一致した位置なので、`start` に足して、全体の添字として返します。

### 3. 一致がなければ `None`

```rust:line-numbers=850
    #[rustc_const_unstable(feature = "const_heap", issue = "79597")]
```

`mask` が 0 なら、この区間に重複はありません。`None` を返して、呼び出し側に次の区間へ進んでもらいます。

## ここがすごい

- **比較を並列に進められる**: 途中で止まらないループなので、コンパイラが複数の比較をまとめて SIMD で実行しやすくなります。
- **最初の一致を 1 命令で求める**: `trailing_zeros` は、ビットの走査をせずに、最も低い 1 の位置を取り出せます。
- **結果を 1 つの整数にまとめる**: 一致の情報が `mask` 1 つに入るので、結果の受け渡しが小さく済みます。

## まとめ

- 区間内の隣との一致を、1 ビットずつ整数にまとめる。
- `trailing_zeros` で、最初の一致の位置を一度に求める。
- 途中で止まらない比較にすると、並列化の恩恵を受けやすい。
