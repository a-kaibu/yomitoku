---
title: 初期化が途中で失敗しても、待っている人を必ず起こす
description: 標準ライブラリの futex 版 Once の CompletionGuard の drop。初期化の関数が正常に終わってもパニックしても、必ず状態を書き込み、待っているスレッドを起こす。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/std/src/sys/sync/once/futex.rs
lines: [57, 66]
function: CompletionGuard::drop
difficulty: 3
format: 2
tags: [並行処理, 防御的プログラミング, 低レイヤ]
---

## ひとことで

`CompletionGuard` は、`Once`（一度だけ初期化する仕組み）の中で、初期化の処理が **終わったときに状態を書き換え、待っているスレッドを起こす** ための番人（ガード）です。その本体は `drop` にあり、値が捨てられるとき（スコープを抜けるとき）に必ず実行されます。
初期化の関数が正常に終わったときだけでなく、**パニックで途中から抜けたときにも** 実行されるのがポイントです。

## コード

::: code-group

```rust:line-numbers=57 [日本語訳]
impl<'a> Drop for CompletionGuard<'a> {
    fn drop(&mut self) {
        // Release の順序を使い、Once を確かめるすべてのスレッドに変更を伝える。
        // `futex_wake_all` は独自に同期を行うため、
        // AcqRel は要らない。
        if self.state_and_queued.swap(self.set_state_on_drop_to, Release) & QUEUED != 0 {
            futex_wake_all(self.state_and_queued);
        }
    }
}
```

```rust:line-numbers=57 [原文]
impl<'a> Drop for CompletionGuard<'a> {
    fn drop(&mut self) {
        // Use release ordering to propagate changes to all threads checking
        // up on the Once. `futex_wake_all` does its own synchronization, hence
        // we do not need `AcqRel`.
        if self.state_and_queued.swap(self.set_state_on_drop_to, Release) & QUEUED != 0 {
            futex_wake_all(self.state_and_queued);
        }
    }
}
```

:::

`drop` は、Rust が値を片付けるときに自動で呼ぶ関数です。ガードを作った関数の出口が、正常か異常かに関係なく動きます。

## 前提知識

- **RAII と `Drop`**: 値の後片付けを、その値の `drop` に任せる仕組みです。スコープを抜けると、`drop` が自動で呼ばれます。
- **パニック**: 実行時のエラーで、関数を途中で抜ける仕組みです。パニックの途中でも、スコープの中の値の `drop` は呼ばれます。
- **`Once` の状態**: 初期化の状態（完了、実行中、失敗など）を、1 つの整数に持っています。
- **`QUEUED` の印**: 待っているスレッドがいることを表す印です。状態の整数の 1 つのビットとして入っています。
- **`futex_wake_all`**: 眠っているすべてのスレッドを起こす操作です。

## 何をしているか

### 1. 設定しておいた状態を書き込む

```rust:line-numbers=62
        if self.state_and_queued.swap(self.set_state_on_drop_to, Release) & QUEUED != 0 {
```

`swap(self.set_state_on_drop_to, Release)` で、状態を、ガードに設定された値に書き換えます。同時に、以前の値を受け取ります。
`Release` の順序は、初期化の中で書いたデータを、後から `Once` を確かめるスレッドに見せるためのものです。

### 2. 待ちの印があれば、全員を起こす

```rust:line-numbers=63
            futex_wake_all(self.state_and_queued);
        }
```

以前の状態に `QUEUED` の印が立っていれば、待っているスレッドがいることになります。そのときだけ `futex_wake_all` で全員を起こします。待ちがなければ、何もしません。

## ここがすごい

- **パニックでも後片付けが走る**: 初期化の途中でパニックしても、`drop` は必ず実行されます。`Once` が「実行中」のまま固まることがなく、待っている人も必ず起きます。
- **状態の書き換えと起床が 1 か所に集まる**: 完了時と失敗時の両方の後片付けが、この `drop` で行われます。書き忘れがおきません。
- **`swap` で状態を変えつつ前の値を見る**: 1 回の原子的な操作で、新しい状態を書き、待ちの印があったかを確かめられます。
- **`Release` の意味を絞る**: コメントにあるように、`futex_wake_all` が独自の同期を行うので、`AcqRel` ではなく `Release` で十分です。必要な順序だけを選んでいます。
- **ガードの型で責任を表す**: 「この期間は初期化の責任を持つ」という範囲を、値のスコープで表しています。

## まとめ

- ガードの `drop` は、正常終了でもパニックでも、必ず状態を書き換えて待ちのスレッドを起こす。
- 待ちの印があるときだけ、`futex_wake_all` を呼ぶ。
- 後片付けを `drop` に任せることで、失敗時の書き忘れを防ぐ。
