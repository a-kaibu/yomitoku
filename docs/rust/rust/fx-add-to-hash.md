---
title: 速さ重視のハッシュで、1 ワードずつ値を混ぜる
description: rustc の FxHasher の内部関数。現在のハッシュを左に 5 ビット回転させ、値と排他的論理和を取り、定数を掛ける。暗号ではなく速さを優先した混ぜ方。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/proc_macro/src/bridge/fxhash.rs
lines: [31, 39]
function: FxHasher::add_to_hash
difficulty: 2
format: 2
tags: [ハッシュ, ビット演算, 最適化]
---

## ひとことで

`add_to_hash` は、**現在のハッシュ値に 1 つの値を混ぜ込む** 関数です。`FxHasher` が入力を読むたびに、この関数が呼ばれて、ハッシュの状態が少しずつ変わっていきます。
混ぜ方は、回転、排他的論理和、掛け算の 3 つだけです。暗号のような強さは求めず、**とにかく速く** ハッシュ値を作ることを目的にしています。

この `FxHasher` は、Firefox で使われていた方法に由来し、rustc（コンパイラ）の中で `HashMap` を速くするために使われています。

## コード

::: code-group

```rust:line-numbers=31 [日本語訳]
    #[inline]
    fn add_to_hash(&mut self, i: usize) {
        const K: usize = cfg_select! {
            target_pointer_width = "64" => 0x517cc1b727220a95,
            target_pointer_width = "32" => 0x9e3779b9,
            _ => 0, // -Zbuild-std でビルドできるように、ダミーの値を入れる
        };
        self.hash = self.hash.rotate_left(5).bitxor(i).wrapping_mul(K);
    }
```

```rust:line-numbers=31 [原文]
    #[inline]
    fn add_to_hash(&mut self, i: usize) {
        const K: usize = cfg_select! {
            target_pointer_width = "64" => 0x517cc1b727220a95,
            target_pointer_width = "32" => 0x9e3779b9,
            _ => 0, // just make it compile for -Zbuild-std
        };
        self.hash = self.hash.rotate_left(5).bitxor(i).wrapping_mul(K);
    }
```

:::

`K` は、ハッシュを混ぜるときに掛ける定数です。32 ビット環境と 64 ビット環境で、別の値が使われます。

## 前提知識

- **ハッシュ値**: 任意の値から作られる、固定の大きさの数です。同じ値からは同じハッシュ値が出ます。
- **`rotate_left(5)`**: ビットを左に 5 個回転させます。左端から出たビットが右端に戻ってくるので、情報は失われません。
- **`bitxor`**: 排他的論理和の関数版です。`^` と同じ意味で、メソッドとして呼べます。
- **`wrapping_mul`**: 掛け算が型の範囲を超えても止まらず、余りを返す掛け算です。
- **`cfg_select!`**: 対象のポインタの幅（32 ビットか 64 ビットか）によって、値を切り替える仕組みです。

## 何をしているか

### 1. 現在のハッシュを左に回転させる

```rust:line-numbers=38
        self.hash = self.hash.rotate_left(5).bitxor(i).wrapping_mul(K);
```

（`add_to_hash` の本体の 1 行です。）まず `rotate_left(5)` で、今のハッシュのビットを 5 個分左へ回転させます。こうすると、前に混ぜた値の位置が少しずれます。

### 2. 新しい値と排他的論理和を取る

同じ行の `.bitxor(i)` で、回転したハッシュと新しい値 `i` の排他的論理和を取ります。2 つのビットが違うときだけ 1 になるので、新しい値の情報がハッシュに反映されます。

### 3. 定数を掛ける

同じ行の最後の `.wrapping_mul(K)` で、結果に定数 `K` を掛けます。掛け算は、下のビットの影響を上のビットへ広げるので、ハッシュ値の全体に変化が行き渡ります。

## ここがすごい

- **3 つの演算だけで済む**: 回転、排他的論理和、掛け算は、どれも CPU で 1 命令ずつです。関数の本体が 1 行で、ほとんど待ちなく計算されます。
- **用途に割り切っている**: `HashMap` の攻撃を防ぐ強さは持ちません。コンパイラの中では、入力が外部から来る危険が低いので、速さを選んでいます。コメントにも、その理由が書かれています。
- **64 ビット版の定数が大きい**: 掛ける定数は、ビットがよく散らばるように選ばれた大きな奇数です。32 ビット環境では別の定数を使い、ポインタの幅に合わせています。
- **ワードごとに混ぜる**: 1 つの値を、型の幅のまま混ぜます。バイトごとに混ぜるより、呼び出しの回数が大きく減ります。
- **`#[inline]` の指定**: 小さな関数なので、呼び出し元に展開させて、さらに速くしています。

## まとめ

- 現在のハッシュを回転させ、値と排他的論理和を取り、定数を掛けて混ぜる。
- 暗号的な強さよりも速さを優先した設計で、コンパイラの内部のような用途に向いている。
- 定数はポインタの幅に合わせて切り替える。
