---
title: 部分のスライスが、元のスライスのどこにあるかを求める
description: 標準ライブラリの subslice_range。渡された部分のスライスの先頭アドレスと、元のスライスの先頭アドレスの差から、添字の範囲を求める。要素の大きさで割り切れず、範囲外なら None を返す。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/slice/mod.rs
lines: [5358, 5380]
function: subslice_range
difficulty: 3
format: 2
tags: [型システム, 防御的プログラミング, 探索]
---

## ひとことで

`subslice_range` は、あるスライスの **一部として切り出された別のスライスが、元のスライスのどの範囲にあるか** を求める関数です。たとえば `&v[2..5]` を渡すと、`2..5` という添字の範囲を返します。

添字を直接知らなくても、メモリの **アドレス** の差から範囲を求めます。ただし、渡された部分が本当にその元のスライスの中にあるかを、必ず確かめます。

## コード

```rust:line-numbers=5358
    pub fn subslice_range(&self, subslice: &[T]) -> Option<core::range::Range<usize>> {
        if T::IS_ZST {
            panic!("elements are zero-sized");
        }

        let self_start = self.as_ptr().addr();
        let subslice_start = subslice.as_ptr().addr();

        let byte_start = subslice_start.wrapping_sub(self_start);

        if !byte_start.is_multiple_of(size_of::<T>()) {
            return None;
        }

        let start = byte_start / size_of::<T>();
        let end = start.wrapping_add(subslice.len());

        if start <= self.len() && end <= self.len() {
            Some(core::range::Range { start, end })
        } else {
            None
        }
    }
```

この関数は、`self` と `subslice` の先頭のアドレスを数値として取り出します。両者の差が、元のスライスの中での **バイト単位の位置** になります。それを要素の大きさで割ると、添字になります。

## 前提知識

- **スライス**: 連続した要素の列への参照です。先頭のアドレスと長さの組で表されます。
- **アドレス**: メモリ上の位置を表す数です。`addr()` で、ポインタを数値として取り出せます。
- **`wrapping_sub`**: 引き算が負になっても、折り返して計算します。部分が元より前にある場合でも、パニックせずに差が得られます。
- **`is_multiple_of`**: 数が、ある値の倍数かを調べます。要素の大きさで割り切れない位置は、要素の境目ではありません。
- **ZST**: 大きさが 0 の型です。アドレスでは位置が区別できないので、この関数では扱えません。

## 何をしているか

### 1. ゼロ幅の型を除外する

```rust:line-numbers=5359
        if T::IS_ZST {
            panic!("elements are zero-sized");
        }
```

要素の大きさが 0 の型では、アドレスの差で位置を求められません。そのため、パニックさせます。

### 2. アドレスの差を求める

```rust:line-numbers=5363
        let self_start = self.as_ptr().addr();
        let subslice_start = subslice.as_ptr().addr();

        let byte_start = subslice_start.wrapping_sub(self_start);
```

元のスライスと部分のスライスの先頭のアドレスを取り、その差を `wrapping_sub` で求めます。部分が元より前にあると、差は大きな数になりますが、後の範囲確認で弾かれます。

### 3. 要素の境目に揃っているかを確かめる

```rust:line-numbers=5368
        if !byte_start.is_multiple_of(size_of::<T>()) {
            return None;
        }

        let start = byte_start / size_of::<T>();
```

バイト単位の差が、要素の大きさの倍数でなければ、要素の境目ではありません。`None` を返します。境目なら、その差を要素の大きさで割って添字にします。

### 4. 範囲の中にあるかを確かめる

```rust:line-numbers=5373
        let end = start.wrapping_add(subslice.len());

        if start <= self.len() && end <= self.len() {
            Some(core::range::Range { start, end })
        } else {
            None
        }
```

終わりの位置を求め、開始と終わりがどちらも元のスライスの長さ以下なら、`Some` で範囲を返します。そうでなければ、元のスライスの外にあるので `None` です。

## ここがすごい

- **添字を持たなくてよい**: 切り出された部分が、どの位置から来たかを、アドレスだけで知ることができます。
- **二重の確認**: 要素の境目の確認と、範囲の確認の 2 つで、誤った部分を拒否します。外からの値を信じすぎません。
- **折り返しで安全に計算**: 差が負になっても、`wrapping_sub` で数値として扱い、次の確認で弾きます。計算の途中でパニックしません。

## まとめ

- 部分のスライスの位置は、先頭のアドレスの差を要素の大きさで割って求める。
- 要素の境目と、元の範囲の中にあるかの 2 つを確かめる。
- ゼロ幅の型は、位置の区別ができないので扱わない。
