---
title: 入れ替えずに「穴」を動かすヒープの浮き上がり
description: 優先度付きキュー BinaryHeap に要素を追加したあと、その要素を正しい位置まで持ち上げる関数。swap を使わず「穴」を動かすことで、コピーの回数を半分にしている。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/collections/binary_heap/mod.rs
lines: [802, 828]
function: BinaryHeap::sift_up
difficulty: 2
tags: [データ構造, アルゴリズム, 最適化]
---

## ひとことで

`sift_up` は、二分ヒープ（いちばん大きい値をすぐ取り出せるデータ構造）で、**ある要素を親より小さくなるまで上に持ち上げる** 関数です。`BinaryHeap::push` で末尾に追加した要素を、正しい位置に移動させるのに使われます。

教科書では「親と比べて大きければ交換」を繰り返しますが、この実装は交換をしません。**要素をいったん取り出して「穴」を作り、親を穴に下ろしながら穴を上へ動かし、最後に 1 回だけ要素を書き込みます**。

## コード

```rust:line-numbers=802
    /// # Safety
    ///
    /// The caller must guarantee that `pos < self.len()`.
    ///
    /// Returns the new position of the element.
    unsafe fn sift_up(&mut self, start: usize, pos: usize) -> usize {
        // Take out the value at `pos` and create a hole.
        // SAFETY: The caller guarantees that pos < self.len()
        let mut hole = unsafe { Hole::new(&mut self.data, pos) };

        while hole.pos() > start {
            let parent = (hole.pos() - 1) / 2;

            // SAFETY: hole.pos() > start >= 0, which means hole.pos() > 0
            //  and so hole.pos() - 1 can't underflow.
            //  This guarantees that parent < hole.pos() so
            //  it's a valid index and also != hole.pos().
            if hole.element() <= unsafe { hole.get(parent) } {
                break;
            }

            // SAFETY: Same as above
            unsafe { hole.move_to(parent) };
        }

        hole.pos()
    }
```

## 前提知識

- **二分ヒープ**: 配列を木として見るデータ構造です。位置 `i` の要素の子は `2i+1` と `2i+2`、親は `(i-1)/2` です。Rust の `BinaryHeap` は「親は子以上」という規則を守る **最大ヒープ** で、先頭がいちばん大きい値になります。
- **`unsafe fn`**: 呼び出す側が前提条件（ここでは `pos < self.len()`）を守る必要がある関数です。前提は `# Safety` の節に書かれます。
- **`Hole`**: このファイルで定義されている補助の型です。`Hole::new(&mut data, pos)` で位置 `pos` の要素を取り出して手元に持ち、そこを「穴」とみなします。`hole.element()` は手元の要素、`hole.get(i)` は位置 `i` の要素、`hole.move_to(i)` は「位置 `i` の要素を穴にコピーし、穴を `i` に移す」操作です。`Hole` が破棄されるとき、手元の要素が穴に書き戻されます。
- **`<=` による比較**: Rust では `Ord` トレイトを実装した型なら `<=` で比較できます。

## 何をしているか

ヒープ `[9, 7, 8, 3, 5]` に `10` を `push` した場合で追います。`10` は末尾の位置 5 に置かれ、`sift_up(0, 5)` が呼ばれます。

### 1. 穴を作る（810 行目）

位置 5 の `10` を取り出し、位置 5 を穴にします。

### 2. 親と比べて、親を下ろす（812〜825 行目）

```
穴=5: 親 (5-1)/2=2 の 8。10 > 8 なので 8 を位置 5 へ。穴=2
穴=2: 親 (2-1)/2=0 の 9。10 > 9 なので 9 を位置 2 へ。穴=0
穴=0: start に着いたので終了
```

手元の要素が親以下なら、そこで止まります（819〜821 行目）。

### 3. 書き戻す（827 行目のあと）

関数を抜けるときに `hole` が破棄され、手元の `10` が最後の穴（位置 0）に書き込まれます。結果は `[10, 7, 9, 3, 5, 8]` です。戻り値は最終位置の `0` です。

## ここがすごい

- **コピーが半分**: 交換（swap）は 1 回で 3 回のコピーが必要です（一時変数を使って 2 つを入れ替えるため）。穴を動かす方法なら、1 段上がるたびにコピーは 1 回で済み、最後に 1 回書き込むだけです。796〜800 行目のコメントにも「交換は 2 倍の移動を伴う」とあります。
- **パニックしても壊れない**: 比較 `<=` はユーザーが実装したコードなので、途中でパニックすることがあります。穴を残したまま関数を抜けると、配列に「抜け殻」が残ってしまいます。`Hole` は破棄時に必ず要素を書き戻すので、パニックで関数を抜けてもヒープは有効な状態に戻ります。
- **安全性の根拠が明示されている**: `hole.pos() > start` なので `hole.pos() - 1` はアンダーフローせず、親の位置は穴とは別の有効な位置になります。これが 815〜818 行目の `SAFETY` コメントです。
- **途中から始められる**: 引数 `start` より上には上がらないので、ヒープの一部だけを扱う処理（`sift_down_to_bottom` など）からも使えます。

## まとめ

- 二分ヒープは配列だけで表せる。親は `(i-1)/2`、子は `2i+1` と `2i+2`。
- 要素を何段も動かすときは、交換するより「穴」を動かすほうがコピーが少ない。
- 後片付けを `Drop` に任せると、パニックしてもデータ構造が壊れない。
