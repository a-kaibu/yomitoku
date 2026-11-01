---
title: 配列の回転を「ブロックの入れ替え」の繰り返しで解く
description: 配列を左右に回転させる rotate_left の内部アルゴリズムの 1 つ。短い側のブロックを長い側の端と入れ替え続け、問題をどんどん小さくしていく。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/slice/rotate.rs
lines: [243, 315]
function: ptr_rotate_swap
difficulty: 3
tags: [アルゴリズム, メモリ管理, 最適化]
---

## ひとことで

`ptr_rotate_swap` は、配列の一部を **回転** させる関数です。回転とは、`[A A A A | B B]` を `[B B | A A A A]` のように、ある位置を境に前後を入れ替える操作です。`slice.rotate_left(k)` や `rotate_right(k)` の内部で使われる 3 つのアルゴリズムのうちの 1 つです。

この関数は、**短い側のブロックを、長い側の端にある同じ長さのブロックと丸ごと入れ替える** ことを繰り返します。入れ替えるたびに一部が最終位置に確定し、残りの問題が小さくなっていきます。

## コード

```rust:line-numbers=243
/// Algorithm 3 utilizes repeated swapping of `min(left, right)` elements.
///
/// ///
/// ```text
/// left = 11, right = 4
/// [4 5 6 7 8 9 10 11 12 13 14 . 0 1 2 3]
///                  ^  ^  ^  ^   ^ ^ ^ ^ swapping the right most elements with elements to the left
/// [4 5 6 7 8 9 10 . 0 1 2 3] 11 12 13 14
///        ^ ^ ^  ^   ^ ^ ^ ^ swapping these
/// [4 5 6 . 0 1 2 3] 7 8 9 10 11 12 13 14
/// we cannot swap any more, but a smaller rotation problem is left to solve
/// ```
/// when `left < right` the swapping happens from the left instead.
///
/// # Safety
///
/// The specified range must be valid for reading and writing.
#[inline]
const unsafe fn ptr_rotate_swap<T>(mut left: usize, mut mid: *mut T, mut right: usize) {
    loop {
        if left >= right {
            // Algorithm 3
            // There is an alternate way of swapping that involves finding where the last swap
            // of this algorithm would be, and swapping using that last chunk instead of swapping
            // adjacent chunks like this algorithm is doing, but this way is still faster.
            loop {
                // SAFETY:
                // `left >= right` so `[mid-right, mid+right)` is valid for reading and writing
                // Subtracting `right` from `mid` each turn is counterbalanced by the addition and
                // check after it.
                unsafe {
                    ptr::swap_nonoverlapping(mid.sub(right), mid, right);
                    mid = mid.sub(right);
                }
                left -= right;
                if left < right {
                    break;
                }
            }
        } else {
            // Algorithm 3, `left < right`
            loop {
                // SAFETY: `[mid-left, mid+left)` is valid for reading and writing because
                // `left < right` so `mid+left < mid+right`.
                // Adding `left` to `mid` each turn is counterbalanced by the subtraction and check
                // after it.
                unsafe {
                    ptr::swap_nonoverlapping(mid.sub(left), mid, left);
                    mid = mid.add(left);
                }
                right -= left;
                if right < left {
                    break;
                }
            }
        }
        if (right == 0) || (left == 0) {
            return;
        }

        // Switch to the buffered algorithm once the smaller side fits in the stack
        // buffer. The swap algorithm is efficient for reducing large blocks, but its
        // tail can degenerate into many small swaps when one side becomes tiny.
        if !cfg!(feature = "optimize_for_size")
            && const_min(left, right) <= size_of::<BufType>() / size_of::<T>()
        {
            // SAFETY: the remaining range `[mid-left, mid+right)` is a subrange of the
            // original input, so it is valid for reading and writing.
            unsafe { ptr_rotate_memmove(left, mid, right) };
            return;
        }
    }
}
```

## 前提知識

- **生ポインタ `*mut T`**: メモリのアドレスを直接指す値です。`mid` は境目の要素を指し、`mid.sub(n)` で n 要素前、`mid.add(n)` で n 要素後ろを指します。
- **`unsafe fn`**: 「呼ぶ側が前提条件を守る必要がある」関数です。ここでは「`mid` の左に `left` 個、右に `right` 個の要素が読み書きできること」が前提です。
- **`ptr::swap_nonoverlapping(a, b, n)`**: アドレス `a` から n 個と `b` から n 個を入れ替えます。2 つの範囲が重ならないことが前提で、そのぶん高速です。
- **`loop` と `break`**: `loop` は無限ループで、`break` で抜けます。
- **`mut` 引数**: `mut left` のように書くと、関数内で引数の値を書き換えられます。

## 何をしているか

ドキュメントコメント（246〜254 行目）の例、`left = 11`、`right = 4` で追います。`.` が境目 `mid` です。

### 1. 左が長いとき（263〜281 行目）

```
[4 5 6 7 8 9 10 11 12 13 14 . 0 1 2 3]
```

右側の 4 個 `0 1 2 3` と、境目のすぐ左の 4 個 `11 12 13 14` を入れ替えます（274 行目）。

```
[4 5 6 7 8 9 10 . 0 1 2 3] 11 12 13 14
```

`11 12 13 14` は最終的な位置に確定しました。境目 `mid` を 4 つ左に移し（275 行目）、`left` を 7 に減らします。まだ `left >= right` なのでもう一度入れ替えます。

```
[4 5 6 . 0 1 2 3] 7 8 9 10 11 12 13 14
```

`left = 3` となり、`right = 4` より小さくなったので内側のループを抜けます。

### 2. 右が長いとき（282〜298 行目）

今度は左側の 3 個 `4 5 6` を、境目の右の 3 個と入れ替え、境目を右に移していきます。左右の役割が逆になっただけで、やることは同じです。

### 3. 終了判定と切り替え（299〜313 行目）

どちらかが 0 になれば回転は完了です。また、短い側がスタック上のバッファ（`BufType` = `usize` 32 個分）に収まる大きさになったら、バッファを使って一気にコピーする `ptr_rotate_memmove` に切り替えます。

## ここがすごい

- **ユークリッドの互除法と同じ形**: 「大きいほうから小さいほうを引き続ける」流れは、最大公約数を求める互除法とそっくりです。毎回、確定したブロックが問題から取り除かれるので、必ず終わります。
- **連続したメモリを入れ替える**: 1 要素ずつ飛び飛びに動かすのではなく、連続したブロックをまとめて入れ替えるので、CPU のキャッシュ（よく使うメモリの一時置き場）を効率よく使えます。
- **苦手な場面では別アルゴリズムへ**: 片側がとても小さくなると、小さなブロックの入れ替えを何度も繰り返すことになります（305 行目のコメント）。そうなったら、バッファでまとめてコピーする方法に切り替えます。1 つのアルゴリズムに固執せず、得意な場面で使い分けています。
- **別案との比較がコメントにある**: 265〜267 行目に「最後の入れ替え位置を先に求める方法もあるが、この方法のほうが速い」と書かれていて、検討の跡がわかります。

## まとめ

- 配列の回転は、短い側と同じ長さのブロックを入れ替え続ければ解ける。
- 入れ替えるたびに一部が確定し、問題は小さくなっていく（互除法と同じ構造）。
- 連続したメモリをまとめて扱うと速い。
- 1 つのアルゴリズムの弱点は、状況に応じて別のアルゴリズムに切り替えて補う。
