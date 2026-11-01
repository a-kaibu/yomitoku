---
title: 先読みの 1 個で、区切りを挟むタイミングを決める
description: 標準ライブラリの intersperse。要素の間に区切りを入れるイテレータ。次の要素を 1 つ先読みして、要素が本当にあるときだけ区切りを返す。最初の要素の前には入れない。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/iter/adapters/intersperse.rs
lines: [37, 55]
function: Intersperse::next
difficulty: 3
format: 2
tags: [イテレータ, 状態機械, 設計パターン]
---

## ひとことで

`next` は、イテレータの **要素と要素の間に、区切りの値を挟んで返す** アダプタ（`intersperse`）の処理です。たとえば `1, 2, 3` に区切り `0` を挟むと、`1, 0, 2, 0, 3` が得られます。

区切りは、次に要素があるときだけ入れます。最後の要素の後には入りません。そのために、次の要素を 1 つだけ先読みして、保存しておきます。

## コード

```rust:line-numbers=37
    fn next(&mut self) -> Option<Self::Item> {
        if self.started {
            if let Some(v) = self.next_item.take() {
                Some(v)
            } else {
                let next_item = self.iter.next();
                if next_item.is_some() {
                    self.next_item = next_item;
                    Some(self.separator.clone())
                } else {
                    None
                }
            }
        } else {
            let item = self.iter.next();
            self.started = item.is_some();
            item
        }
    }
```

この関数は、`started`（最初の要素を返したかどうか）と、`next_item`（先読みした要素）の 2 つの状態を使います。`separator` は、挟む区切りの値です。

## 前提知識

- **アダプタ**: 別のイテレータを包んで、値を変換したり加工したりするイテレータです。
- **`Option::take`**: 中の値を取り出し、元を `None` にします。先読みした要素を、1 度だけ返すのに使われます。
- **先読み（ルックアヘッド）**: 次の要素を、まだ返さずに取っておくことです。要素が本当にあるかを、区切りを返す前に確かめられます。
- **`clone`**: 区切りの値を複製します。区切りは、何度も返されるので、複製が必要です。
- **状態機械**: 状態の組み合わせで、次に返す値を決める仕組みです。

## 何をしているか

### 1. 最初の要素は、区切りなしで返す

```rust:line-numbers=50
        } else {
            let item = self.iter.next();
            self.started = item.is_some();
            item
        }
```

まだ開始していなければ、元のイテレータから次の要素を取り、そのまま返します。要素があれば、以降は「開始済み」として扱います。

### 2. 先読みがあれば、それを返す

```rust:line-numbers=39
            if let Some(v) = self.next_item.take() {
                Some(v)
```

開始済みで、先読みした要素があるなら、それを返します。区切りは、この時点ではまだ入れません。

### 3. 先読みが無ければ、次を読んで区切りを返す

```rust:line-numbers=42
                let next_item = self.iter.next();
                if next_item.is_some() {
                    self.next_item = next_item;
                    Some(self.separator.clone())
                } else {
                    None
                }
```

先読みが無いなら、元のイテレータから次の要素を読みます。あれば、それを先読みとして保存し、区切りを返します。区切りの後に、保存した要素が続きます。無ければ、そこで終わりです。

## ここがすごい

- **末尾に区切りが付かない**: 区切りは、次の要素があると確かめてから返すので、最後の後ろに余計な区切りが付きません。
- **先読みは 1 個だけ**: 保存するのは次の要素 1 つだけです。要素を全部保持しないので、メモリの使い方が小さく済みます。
- **状態が小さい**: `started` と `next_item` の 2 つだけで、すべての場合を分けています。読みやすく、間違えにくい形です。

## まとめ

- 区切りは、次の要素が本当にあるときだけ返す。
- 次の要素を 1 つ先読みして保存し、区切りの後に返す。
- 最初の要素の前と、最後の要素の後には、区切りを入れない。
