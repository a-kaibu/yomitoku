---
title: 大きいほうの子を「bool を足す」だけで選ぶヒープの沈み込み
description: 二分ヒープで要素を子より大きくなるまで下へ沈める関数。2 つの子のうち大きいほうを、比較結果の bool を添字に足すことで分岐なしに選ぶ。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/collections/binary_heap/mod.rs
lines: [830, 875]
function: BinaryHeap::sift_down_range
difficulty: 2
tags: [データ構造, アルゴリズム, 最適化]
---

## ひとことで

`sift_down_range` は、二分ヒープ（いちばん大きい値をすぐ取り出せるデータ構造）で、**ある要素を、子よりも大きくなるまで下に沈める** 関数です。配列からヒープを作るときや、要素を取り除いたあとの修復に使われます。

下に沈めるときは「2 つの子のうち大きいほう」と比べる必要があります。この関数はそれを `if` ではなく、**比較結果の `bool` を整数として添字に足す** ことで選んでいます。

## コード

```rust:line-numbers=830
    /// Take an element at `pos` and move it down the heap,
    /// while its children are larger.
    ///
    /// Returns the new position of the element.
    ///
    /// # Safety
    ///
    /// The caller must guarantee that `pos < end <= self.len()`.
    unsafe fn sift_down_range(&mut self, pos: usize, end: usize) -> usize {
        // SAFETY: The caller guarantees that pos < end <= self.len().
        let mut hole = unsafe { Hole::new(&mut self.data, pos) };
        let mut child = 2 * hole.pos() + 1;

        // Loop invariant: child == 2 * hole.pos() + 1.
        while child <= end.saturating_sub(2) {
            // compare with the greater of the two children
            // SAFETY: child < end - 1 < self.len() and
            //  child + 1 < end <= self.len(), so they're valid indexes.
            //  child == 2 * hole.pos() + 1 != hole.pos() and
            //  child + 1 == 2 * hole.pos() + 2 != hole.pos().
            // FIXME: 2 * hole.pos() + 1 or 2 * hole.pos() + 2 could overflow
            //  if T is a ZST
            child += unsafe { hole.get(child) <= hole.get(child + 1) } as usize;

            // if we are already in order, stop.
            // SAFETY: child is now either the old child or the old child+1
            //  We already proven that both are < self.len() and != hole.pos()
            if hole.element() >= unsafe { hole.get(child) } {
                return hole.pos();
            }

            // SAFETY: same as above.
            unsafe { hole.move_to(child) };
            child = 2 * hole.pos() + 1;
        }

        // SAFETY: && short circuit, which means that in the
        //  second condition it's already true that child == end - 1 < self.len().
        if child == end - 1 && hole.element() < unsafe { hole.get(child) } {
            // SAFETY: child is already proven to be a valid index and
            //  child == 2 * hole.pos() + 1 != hole.pos().
            unsafe { hole.move_to(child) };
        }

        hole.pos()
    }
```

## 前提知識

- **二分ヒープ**: 配列を木として見るデータ構造で、位置 `i` の子は `2i+1`（左）と `2i+2`（右）です。Rust の `BinaryHeap` は「親は子以上」の最大ヒープです。
- **`Hole`**: このファイルの補助型です。`Hole::new` で要素を取り出して「穴」を作り、`hole.move_to(i)` で位置 `i` の要素を穴にコピーして穴を `i` に移します。`Hole` が破棄されると、手元の要素が穴に書き戻されます。
- **`saturating_sub`**: 引き算の結果が 0 未満になるなら 0 で止めるメソッドです。`end` が 0 や 1 のときでもアンダーフローしません。
- **`bool as usize`**: `true` は 1、`false` は 0 になります。
- **`end` 引数**: ヒープとして扱う範囲の終わりです。`end` 以降の要素は無視されます。ヒープソートで「並べ終わった後ろの部分」を除外するのに使います。

## 何をしているか

ヒープ `[2, 9, 8, 7, 5, 6]` の先頭 `2` を沈める（`pos = 0`、`end = 6`）例で追います。

### 1. 子が 2 つある間のループ（844〜864 行目）

`child` は左の子の位置です。`child <= end - 2` は「右の子 `child + 1` も範囲内」という意味です。

```
穴=0: 子は 9 と 8。9 <= 8 は false → +0 で child=1（9）
      2 >= 9 ではないので 9 を位置 0 へ。穴=1
穴=1: 子は 7 と 5。7 <= 5 は false → child=3（7）
      2 >= 7 ではないので 7 を位置 1 へ。穴=3
穴=3: 左の子の位置は 2×3+1=7 で、end-2=4 を超えるのでループ終了
```

852 行目の `child += (左 <= 右) as usize` が、大きいほうの子を選ぶ部分です。右のほうが大きい（または等しい）なら 1 を足して右の子に、そうでなければそのまま左の子になります。

### 2. 子が 1 つだけの場合（868〜872 行目）

末尾に左の子だけがある場合（`child == end - 1`）は、その子とだけ比べます。

### 3. 書き戻す

関数を抜けるときに `Hole` が破棄され、`2` が位置 3 に書き込まれます。結果は `[9, 7, 8, 2, 5, 6]` です。

## ここがすごい

- **分岐なしで子を選ぶ**: 「左と右のどちらが大きいか」はデータ次第でランダムに変わるので、`if` にすると CPU の分岐予測がよく外れます。`bool` を整数として足すと、条件付きの加算命令になり、予測ミスが起きません。
- **ループ条件を工夫して境界チェックを減らす**: ループ内では「子が 2 つある」ことが保証されているので、右の子が範囲内かを毎回確認する必要がありません。子が 1 つだけになる可能性は末尾の 1 か所だけなので、ループの外で 1 回だけ処理しています。
- **穴を使ってコピーを減らす**: 交換ではなく穴を動かすので、1 段下がるごとのコピーは 1 回です。
- **範囲を指定できる**: `end` を受け取るので、ヒープソートのように配列の後ろから確定させていく処理にもそのまま使えます。

## まとめ

- 比較結果の `bool` を添字に足すと、分岐なしで 2 つのうち一方を選べる。
- 「子が 2 つある」場合と「1 つだけ」の場合を分けると、ループの中が単純になる。
- 範囲 `end` を引数にすると、同じ関数をヒープソートなどにも再利用できる。
