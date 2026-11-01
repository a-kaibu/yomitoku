---
title: 大きな要素の配列を「usize の配列」とみなして回転を速くする
description: スライス回転の入口。要素が大きく usize で割り切れる型なら、配列を usize の並びとみなして回転することで、キャッシュに優しいアルゴリズムを使えるようにする。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/slice/rotate.rs
lines: [6, 44]
function: ptr_rotate
difficulty: 3
tags: [メモリ管理, 最適化, 低レイヤ, ジェネリクス]
---

## ひとことで

`ptr_rotate` は、スライスの回転（`rotate_left` / `rotate_right`）の入口となる関数です。境目 `mid` の左にある `left` 個と右にある `right` 個を入れ替え、`mid` の要素が先頭に来るようにします。

ふつうなら要素の型 `T` のまま回転アルゴリズムに渡すところを、**要素が大きいときは、メモリを `usize`（8 バイト）の並びとみなして回転する** という工夫をしています。回転は「バイトの並びを動かすだけ」なので、要素をどの単位で区切って動かしても結果は同じだからです。

## コード

```rust:line-numbers=6
/// Rotates the range `[mid-left, mid+right)` such that the element at `mid` becomes the first
/// element. Equivalently, rotates the range `left` elements to the left or `right` elements to the
/// right.
///
/// # Safety
///
/// The specified range must be valid for reading and writing.
#[inline]
pub(super) const unsafe fn ptr_rotate<T>(left: usize, mid: *mut T, right: usize) {
    if T::IS_ZST {
        return;
    }
    // abort early if the rotate is a no-op
    if (left == 0) || (right == 0) {
        return;
    }

    // For huge slices, GCD has poor locality because it jumps by large element-sized
    // strides and carries a large temporary. Since rotation only permutes raw storage,
    // a large element whose size/alignment permits it can instead be viewed as multiple
    // `MaybeUninit<usize>` words. This makes dispatch choose the contiguous swap algorithm,
    // which has much better cache/TLB locality.
    if !cfg!(feature = "optimize_for_size")
        && size_of::<T>() > size_of::<[usize; 4]>()
        && size_of::<T>() % size_of::<usize>() == 0
        && align_of::<T>() >= align_of::<usize>()
    {
        let ratio = size_of::<T>() / size_of::<usize>();

        // SAFETY: this covers exactly the same bytes as `[mid-left, mid+right)` because
        // `ratio * size_of::<usize>() == size_of::<T>()`. The check above guarantees
        // `mid` is aligned for `usize`, and preserving the total byte length introduces
        // no new overflow.
        unsafe { ptr_rotate_dispatch(left * ratio, mid as *mut MaybeUninit<usize>, right * ratio) }
    } else {
        // SAFETY: guaranteed by the caller
        unsafe { ptr_rotate_dispatch(left, mid, right) }
    }
}
```

## 前提知識

- **ジェネリクス `<T>`**: `T` は「任意の型」を表します。この関数はどんな型の配列にも使えます。
- **`T::IS_ZST`**: `T` が大きさ 0 の型（ZST、たとえば中身のない構造体）かどうかを表す定数です。大きさ 0 の要素はメモリを持たないので、回転しても何も変わりません。
- **`size_of::<T>()` と `align_of::<T>()`**: 型の大きさ（バイト数）と、置けるアドレスの倍数（アラインメント）です。`u64` ならどちらも 8 です。
- **`cfg!(feature = "optimize_for_size")`**: 「サイズ優先でビルドするか」という設定をコンパイル時に調べるマクロです。サイズ優先なら複雑な最適化を省きます。
- **`MaybeUninit<usize>`**: 「中身が有効な `usize` とは限らないメモリ」を表す型です。ただのバイトの入れ物として扱うために使っています。
- **`as *mut ...`**: ポインタの型を読み替えます。指しているアドレスは同じです。

## 何をしているか

### 1. 何もしなくてよい場合（15〜21 行目）

大きさ 0 の型なら何もせず終了します。`left` か `right` が 0 なら、回転しても順序は変わらないので終了します。

### 2. 大きな要素を `usize` の並びとみなす（28〜39 行目）

次の条件をすべて満たすとき、型を読み替えます。

- 要素が `usize` 4 個分（32 バイト）より大きい
- 要素の大きさが `usize` の倍数
- 要素のアラインメントが `usize` 以上

たとえば 48 バイトの構造体なら `ratio = 6` です。`left = 3`、`right = 5` の回転は、`usize` 単位で `left = 18`、`right = 30` の回転と同じになります。

### 3. アルゴリズムを選ぶ関数へ（39・42 行目）

読み替えた場合もそうでない場合も、`ptr_rotate_dispatch` に渡します。こちらは、短い側がバッファに収まればバッファでコピー、要素数が少ないか要素が大きければ GCD（最大公約数）を使う方法、それ以外はブロック入れ替えの方法、と 3 つのアルゴリズムを使い分けます。

## ここがすごい

- **「型」ではなく「バイト」を見る**: 回転はメモリの中身を並べ替えるだけで、要素の意味には関与しません。だから、48 バイトの要素 1 個を「8 バイトの `usize` 6 個」とみなしても、結果は完全に同じです。要素の型を忘れることで、より良いアルゴリズムが使えるようになります。
- **アルゴリズム選択を有利にする**: 23〜27 行目のコメントのとおり、GCD 法は要素を大きな歩幅で飛び飛びに動かすため、大きな要素ではキャッシュの効率が悪くなります。`usize` 単位にすると、ディスパッチ関数がキャッシュに優しいブロック入れ替え法を選びやすくなります。
- **安全性の条件を正確に書く**: 大きさが `usize` の倍数でないと端数が出ますし、アラインメントが足りないと `usize` として読めません。この 2 つを条件にしたうえで、35〜38 行目の `SAFETY` コメントで「同じバイト範囲を指している」「アラインメントは満たされる」と説明しています。
- **ゼロコストの判定**: 条件はすべてコンパイル時に決まる値なので、実際の型ごとに片方の枝だけが残ります。実行時の判定コストはありません。

## まとめ

- 回転のような「並べ替えるだけ」の処理は、要素の型を忘れてバイト（ワード）単位で行える。
- 同じ処理でも、扱う単位を変えると選べるアルゴリズムや性能が変わる。
- 型を読み替えるときは、大きさとアラインメントの条件を必ず確認する。
- 型の大きさに関する条件はコンパイル時に決まるので、実行時のコストにならない。
