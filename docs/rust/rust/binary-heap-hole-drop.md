---
title: パニックしても穴をふさぐ「後片付け係」の型
description: BinaryHeap の内部で使う Hole 型の Drop 実装。取り出した要素を、関数の終わりやパニック時に必ず元の配列の穴へ書き戻す。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/collections/binary_heap/mod.rs
lines: [1597, 1607]
function: <Hole<T> as Drop>::drop
difficulty: 2
format: 2
tags: [メモリ管理, 防御的プログラミング, 設計パターン]
---

## ひとことで

`Hole` は、`BinaryHeap`（二分ヒープ）の内部で使われる小さな補助型です。配列から要素を 1 つ取り出して手元に持ち、その場所を「穴」として扱います。ヒープの要素を移動させるとき、交換を繰り返す代わりに、この穴を動かしていきます。

この `drop` は、`Hole` が破棄されるときに **手元の要素を、いま穴がある位置に書き戻す** 処理です。関数が正常に終わったときだけでなく、**途中でパニックしたときにも必ず実行される** のがポイントです。

## コード

::: code-group

```rust:line-numbers=1597 [日本語訳]
impl<T> Drop for Hole<'_, T> {
    #[inline]
    fn drop(&mut self) {
        // 穴を埋め直す
        let pos = self.pos;
        // ignore-tidy-undocumented-unsafe
        unsafe {
            ptr::copy_nonoverlapping(&*self.elt, self.data.get_unchecked_mut(pos), 1);
        }
    }
}
```

```rust:line-numbers=1597 [原文]
impl<T> Drop for Hole<'_, T> {
    #[inline]
    fn drop(&mut self) {
        // fill the hole again
        let pos = self.pos;
        // ignore-tidy-undocumented-unsafe
        unsafe {
            ptr::copy_nonoverlapping(&*self.elt, self.data.get_unchecked_mut(pos), 1);
        }
    }
}
```

:::

`Hole` 型の定義は次のとおりです。

```rust:line-numbers=1533
struct Hole<'a, T: 'a> {
    data: &'a mut [T],
    elt: ManuallyDrop<T>,
    pos: usize,
}
```

## 前提知識

- **`Drop` トレイト**: 値がスコープを抜けるときに自動で呼ばれる後片付けの処理です。パニック（実行時エラーによる巻き戻し）で関数を抜けるときにも呼ばれます。
- **パニック**: Rust の回復不能なエラーです。デフォルトでは関数呼び出しを巻き戻しながら、途中の値の `drop` を順に実行していきます。
- **`ManuallyDrop<T>`**: 中の値を自動では破棄しない入れ物です。`elt` は配列から取り出した要素ですが、最後に配列へ書き戻すので、ここで破棄されては困ります。
- **`ptr::copy_nonoverlapping(src, dst, 1)`**: メモリ上で `src` から `dst` へ 1 個分の値をビット単位でコピーします。
- **`get_unchecked_mut(pos)`**: 範囲チェックをせずに要素への可変参照を得ます。
- **`&'a mut [T]`**: 配列の一部への可変参照です。`'a` はその参照が有効な期間を表すライフタイムです。

## 何をしているか

### 1. 穴の位置を確認する

```rust:line-numbers=1601
        let pos = self.pos;
```


`self.pos` が、いま穴になっている位置です。ヒープの操作中に `move_to` で何度も動いています。

### 2. 手元の要素を書き戻す

```rust:line-numbers=1603
        unsafe {
            ptr::copy_nonoverlapping(&*self.elt, self.data.get_unchecked_mut(pos), 1);
        }
```


`elt` に持っている要素を、`data[pos]` にコピーします。これで配列に穴がなくなり、すべての位置が有効な要素で埋まります。

たとえば `sift_up` で `[9, 7, 8, 3, 5, 10]` の `10` を浮かせる場合、途中で `[9, 7, 8, 3, 5, 8]`（位置 2 が穴、`8` が 2 つあるように見える）という状態を通ります。もし比較中にパニックが起きても、この `drop` が `10` を位置 2 に書き戻すので、配列は `[9, 7, 10, 3, 5, 8]` という「要素の重複も欠落もない」状態になります。

## ここがすごい

- **RAII による後片付け**: 「後片付けを型の破棄処理に任せる」設計を RAII（Resource Acquisition Is Initialization）と呼びます。関数がどの経路で終わっても、書き戻しを忘れることがありません。
- **パニック安全性**: ヒープの比較は、ユーザーが書いた `Ord` の実装を呼び出します。そこでパニックが起きる可能性はゼロではありません。穴が残ったままになると、同じ値が 2 回破棄される（二重解放）などの深刻なバグにつながります。`Hole` はそれを型の仕組みで防いでいます。
- **`ManuallyDrop` との組み合わせ**: 取り出した要素を `ManuallyDrop` に入れておくことで、「`Hole` が破棄されたときに要素まで破棄される」ことを防ぎ、代わりにコピーで配列へ戻しています。所有権を手動で管理する箇所を、小さな型の中に閉じ込めています。
- **使う側はシンプルになる**: `sift_up` などの関数は、最後に書き戻す処理を書く必要がありません。関数の終わりで自動的に行われます。

## まとめ

- 「必ずやらなければならない後片付け」は、`Drop` を実装した型に任せると忘れない。
- `Drop` はパニック時にも実行されるので、データ構造を壊さないための守りになる。
- 一時的に壊れた状態（穴）を扱う処理は、小さな型に閉じ込めると安全に書ける。
