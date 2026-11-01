---
title: 配列を半分に割ってから入れ替えると速くなる理由
description: スライスを逆順にする関数。前半と後半を別々のスライスに分けてから関数に渡すことで、両者が重ならないことをコンパイラに伝え、最適化しやすくしている。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/slice/mod.rs
lines: [979, 1020]
function: <[T]>::reverse
difficulty: 2
tags: [最適化, メモリ管理, 標準ライブラリ]
---

## ひとことで

`reverse` は、スライスの要素を **その場で逆順に並べ替える** 関数です。`[1, 2, 3, 4, 5]` は `[5, 4, 3, 2, 1]` になります。

やっていることは「先頭と末尾を入れ替え、1 つずつ内側に進む」だけですが、そのまま書かずに **前半と後半の 2 つのスライスに分けてから** 入れ替えています。その理由は、コンパイラに「この 2 つは重ならない」と教えるためです。

## コード

```rust:line-numbers=979
    pub const fn reverse(&mut self) {
        let half_len = self.len() / 2;
        let Range { start, end } = self.as_mut_ptr_range();

        // These slices will skip the middle item for an odd length,
        // since that one doesn't need to move.
        let (front_half, back_half) =
            // SAFETY: Both are subparts of the original slice, so the memory
            // range is valid, and they don't overlap because they're each only
            // half (or less) of the original slice.
            unsafe {
                (
                    slice::from_raw_parts_mut(start, half_len),
                    slice::from_raw_parts_mut(end.sub(half_len), half_len),
                )
            };

        // Introducing a function boundary here means that the two halves
        // get `noalias` markers, allowing better optimization as LLVM
        // knows that they're disjoint, unlike in the original slice.
        revswap(front_half, back_half, half_len);

        #[inline]
        const fn revswap<T>(a: &mut [T], b: &mut [T], n: usize) {
            debug_assert!(a.len() == n);
            debug_assert!(b.len() == n);

            // Because this function is first compiled in isolation,
            // this check tells LLVM that the indexing below is
            // in-bounds. Then after inlining -- once the actual
            // lengths of the slices are known -- it's removed.
            // FIXME(const_trait_impl) replace with let (a, b) = (&mut a[..n], &mut b[..n]);
            let (a, _) = a.split_at_mut(n);
            let (b, _) = b.split_at_mut(n);

            let mut i = 0;
            while i < n {
                mem::swap(&mut a[i], &mut b[n - 1 - i]);
                i += 1;
            }
        }
    }
```

## 前提知識

- **`&mut self`**: スライス自身を「書き換え可能な参照」で受け取ります。Rust では、書き換え可能な参照 `&mut` は同時に 1 つしか存在できないという規則があります。
- **生ポインタと `from_raw_parts_mut`**: `as_mut_ptr_range()` はスライスの先頭と末尾（の次）のアドレスを返します。`slice::from_raw_parts_mut(ptr, len)` はアドレスと長さから新しいスライスを作る `unsafe` な関数です。
- **関数の中の関数**: Rust では関数の中に別の関数（ここでは `revswap`）を定義できます。外からは見えません。
- **`mem::swap(&mut a, &mut b)`**: 2 つの場所の値を入れ替えます。
- **`split_at_mut(n)`**: スライスを位置 `n` で 2 つに分けます。`let (a, _) = ...` の `_` は「使わない値」です。
- **`debug_assert!`**: デバッグビルドのときだけ条件を確認します。リリースビルドでは消えます。

## 何をしているか

### 1. 前半と後半を切り出す（980〜994 行目）

長さの半分 `half_len` を求め、先頭から `half_len` 個のスライス `front_half` と、末尾から `half_len` 個のスライス `back_half` を作ります。
`[1, 2, 3, 4, 5]` なら `half_len = 2` で、`front_half = [1, 2]`、`back_half = [4, 5]` です。真ん中の `3` は動かす必要がないので、どちらにも含まれません。

### 2. 別の関数に渡す（999 行目）

2 つのスライスを `revswap` に渡します。

### 3. 入れ替える（1011〜1018 行目）

`a[i]` と `b[n - 1 - i]` を入れ替えます。

```
i=0: a[0]=1 と b[1]=5 を入れ替え → [5, 2, 3, 4, 1]
i=1: a[1]=2 と b[0]=4 を入れ替え → [5, 4, 3, 2, 1]
```

1011〜1012 行目の `split_at_mut(n)` は、一見何もしていないように見えますが、「`a` と `b` の長さは少なくとも `n`」とコンパイラに伝える役割があります。これでループ中の範囲チェック（添字が範囲内かの確認）が消えます。

## ここがすごい

- **関数の境界で「重ならない」を伝える**: 996〜998 行目のコメントのとおり、Rust では `&mut` の引数は互いに重ならないことが保証されるので、コンパイラ（LLVM）に `noalias`（別名なし）という情報が渡ります。1 つのスライスの前と後ろを触るだけでは、コンパイラは「前に書いた値が後ろの読み出しに影響するかも」と疑い、まとめて処理する最適化（SIMD 化など）をためらいます。2 つのスライスに分けることで、その疑いが消えます。
- **Rust の借用規則が最適化の材料になる**: 「`&mut` は同時に 1 つ」という安全のための規則が、そのまま性能向上の根拠として使われています。C では `restrict` キーワードを付けないと得られない情報です。
- **範囲チェックを消す小技**: `split_at_mut` で長さをはっきりさせると、ループ内の添字アクセスが安全だとコンパイラが証明でき、チェックが不要になります。インライン展開後にはこの `split_at_mut` 自体も消えるので、実行時のコストはありません。
- **真ん中を扱わない**: 奇数長でも偶数長でも、`half_len` 個ずつ取れば中央の要素は自然に除外されます。特別扱いの `if` が要りません。

## まとめ

- 配列の逆順は「両端を入れ替えて内側へ」の繰り返し。
- 1 つの配列の 2 か所を触るより、重ならない 2 つの配列として扱うほうがコンパイラは最適化しやすい。
- Rust の `&mut` の規則は、安全性だけでなく性能のための情報にもなる。
- 一見無意味な `split_at_mut` が、範囲チェックを消すヒントになることがある。
