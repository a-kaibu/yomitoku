---
title: 一番下まで沈めてから浮かせると、比較が減る
description: BinaryHeap::pop で使われる沈み込み。末尾から持ってきた小さい要素は底まで行くことが多いので、途中で比べずに底まで沈めてから少し浮かせる。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/collections/binary_heap/mod.rs
lines: [887, 930]
function: BinaryHeap::sift_down_to_bottom
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 最適化]
---

## ひとことで

`sift_down_to_bottom` は、二分ヒープ（いちばん大きい値をすぐ取り出せるデータ構造）で、要素を **途中で止まらずに一番下まで沈め、そのあと必要な分だけ上に戻す** 関数です。`BinaryHeap::pop`（最大値の取り出し）で使われます。

ふつうの沈み込みは、各段で「大きいほうの子を選ぶ比較」と「自分と子を比べる比較」の 2 回を行います。この関数は **各段で 1 回の比較** だけで底まで進みます。これは Floyd（フロイド）の改良として知られる手法です。

## コード

::: code-group

```rust:line-numbers=887 [日本語訳]
    /// `pos` の要素を、ヒープの一番下まで移動させる。
    /// そのあと、正しい位置まで浮かせる。
    ///
    /// 注: 要素が大きい、または底の近くに置くべきだとわかっているときに速い。
    ///
    ///
    /// # 安全性
    ///
    /// 呼び出し側は `pos < self.len()` を保証すること。
    unsafe fn sift_down_to_bottom(&mut self, mut pos: usize) {
        let end = self.len();
        let start = pos;

        // SAFETY: 呼び出し側が pos < self.len() を保証する。
        let mut hole = unsafe { Hole::new(&mut self.data, pos) };
        let mut child = 2 * hole.pos() + 1;

        // ループの不変条件: child == 2 * hole.pos() + 1。
        while child <= end.saturating_sub(2) {
            // SAFETY: child < end - 1 < self.len() かつ
            //  child + 1 < end <= self.len() なので、どちらも有効な添字。
            //  child == 2 * hole.pos() + 1 != hole.pos() かつ
            //  child + 1 == 2 * hole.pos() + 2 != hole.pos()。
            // FIXME: 2 * hole.pos() + 1 や 2 * hole.pos() + 2 は ZST だとオーバーフローしうる
            //  （T が ZST の場合）
            child += unsafe { hole.get(child) <= hole.get(child + 1) } as usize;

            // SAFETY: 上と同じ
            unsafe { hole.move_to(child) };
            child = 2 * hole.pos() + 1;
        }

        if child == end - 1 {
            // SAFETY: child == end - 1 < self.len() なので、有効な添字
            //  かつ child == 2 * hole.pos() + 1 != hole.pos() である。
            unsafe { hole.move_to(child) };
        }
        pos = hole.pos();
        drop(hole);

        // SAFETY: pos は穴の位置で、有効な添字だと証明済み
        //
        unsafe { self.sift_up(start, pos) };
    }
```

```rust:line-numbers=887 [原文]
    /// Take an element at `pos` and move it all the way down the heap,
    /// then sift it up to its position.
    ///
    /// Note: This is faster when the element is known to be large / should
    /// be closer to the bottom.
    ///
    /// # Safety
    ///
    /// The caller must guarantee that `pos < self.len()`.
    unsafe fn sift_down_to_bottom(&mut self, mut pos: usize) {
        let end = self.len();
        let start = pos;

        // SAFETY: The caller guarantees that pos < self.len().
        let mut hole = unsafe { Hole::new(&mut self.data, pos) };
        let mut child = 2 * hole.pos() + 1;

        // Loop invariant: child == 2 * hole.pos() + 1.
        while child <= end.saturating_sub(2) {
            // SAFETY: child < end - 1 < self.len() and
            //  child + 1 < end <= self.len(), so they're valid indexes.
            //  child == 2 * hole.pos() + 1 != hole.pos() and
            //  child + 1 == 2 * hole.pos() + 2 != hole.pos().
            // FIXME: 2 * hole.pos() + 1 or 2 * hole.pos() + 2 could overflow
            //  if T is a ZST
            child += unsafe { hole.get(child) <= hole.get(child + 1) } as usize;

            // SAFETY: Same as above
            unsafe { hole.move_to(child) };
            child = 2 * hole.pos() + 1;
        }

        if child == end - 1 {
            // SAFETY: child == end - 1 < self.len(), so it's a valid index
            //  and child == 2 * hole.pos() + 1 != hole.pos().
            unsafe { hole.move_to(child) };
        }
        pos = hole.pos();
        drop(hole);

        // SAFETY: pos is the position in the hole and was already proven
        //  to be a valid index.
        unsafe { self.sift_up(start, pos) };
    }
```

:::

## 前提知識

- **二分ヒープ**: 配列を木として見るデータ構造で、位置 `i` の子は `2i+1` と `2i+2` です。`BinaryHeap` は「親は子以上」の最大ヒープです。
- **`pop` の流れ**: 最大値は先頭にあります。`pop` は末尾の要素を先頭に移し、先頭にあった最大値を返します。そのあと、先頭に来た要素を正しい位置まで沈める必要があります。
- **`Hole`**: 要素を取り出して「穴」を作る補助型です。`move_to(i)` で位置 `i` の要素を穴にコピーし、穴を `i` に移します。破棄されると、手元の要素を穴に書き戻します。
- **`drop(hole)`**: 値を明示的に破棄する関数です。ここで `Hole` の後片付けが実行され、要素が書き戻されます。
- **`sift_up(start, pos)`**: 要素を親より小さくなるまで上に持ち上げる関数です。`start` より上には行きません。

## 何をしているか

### 1. 大きいほうの子をたどって底まで沈める

```rust:line-numbers=905
        while child <= end.saturating_sub(2) {
            // SAFETY: child < end - 1 < self.len() and
            //  child + 1 < end <= self.len(), so they're valid indexes.
            //  child == 2 * hole.pos() + 1 != hole.pos() and
            //  child + 1 == 2 * hole.pos() + 2 != hole.pos().
            // FIXME: 2 * hole.pos() + 1 or 2 * hole.pos() + 2 could overflow
            //  if T is a ZST
            child += unsafe { hole.get(child) <= hole.get(child + 1) } as usize;

            // SAFETY: Same as above
            unsafe { hole.move_to(child) };
            child = 2 * hole.pos() + 1;
        }
```


自分と子を比べずに、とにかく大きいほうの子を穴に引き上げて穴を下へ進めます。`child += (左 <= 右) as usize` で大きいほうの子を選ぶ比較 1 回だけです。

### 2. 子が 1 つだけなら、それも引き上げる

```rust:line-numbers=919
        if child == end - 1 {
            // SAFETY: child == end - 1 < self.len(), so it's a valid index
            //  and child == 2 * hole.pos() + 1 != hole.pos().
            unsafe { hole.move_to(child) };
        }
```


### 3. 書き戻して、少し浮かせる

```rust:line-numbers=924
        pos = hole.pos();
        drop(hole);

        // SAFETY: pos is the position in the hole and was already proven
        //  to be a valid index.
        unsafe { self.sift_up(start, pos) };
```


穴の位置を記録し、`drop(hole)` で要素を底に書き戻します。そのあと `sift_up` で、親より大きければ上へ戻します。

`[10, 9, 8, 7, 6, 5, 1]` から `pop` する例です。末尾の `1` が先頭に来ます（`[1, 9, 8, 7, 6, 5]`）。

```
穴=0: 子 9, 8 → 9 を上へ。穴=1
穴=1: 子 7, 6 → 7 を上へ。穴=3
穴=3: 子なし → 底。1 を位置 3 に書く → [9, 7, 8, 1, 6, 5]
sift_up: 親の 7 より小さいので動かない
```

## ここがすごい

- **「どうせ底まで行く」という観察**: `pop` で先頭に来るのは末尾の要素、つまりヒープの中で小さい部類の値です。だから、ほとんどの場合は底近くまで沈みます。途中で毎回「もう止まるか」を確かめても、ほぼ無駄になるのです。
- **比較の回数がほぼ半分**: ふつうの方法は 1 段につき 2 回比べます。この方法は 1 段につき 1 回で底まで行き、浮かせる段階でも数回比べるだけです。比較がユーザー定義の重い処理（文字列の比較など）のとき、とくに効果があります。
- **既存の部品の組み合わせ**: 浮かせる処理は `push` で使う `sift_up` をそのまま使っています。`start` を指定できるようにしてあるので、沈め始めた位置より上には行きません。
- **使い分け**: コメントのとおり、これは「要素が小さく底に近いと分かっている」ときに速い方法です。そうでない場面では通常の `sift_down_range` が使われます。

## まとめ

- 二分ヒープの `pop` では、先頭に来た要素は底まで沈むことが多い。
- それなら、途中で止まるかを調べずに底まで沈めて、あとで少し浮かせるほうが比較が少ない。
- 入力の性質（どこに落ち着きやすいか）を利用すると、アルゴリズムの定数倍を改善できる。
