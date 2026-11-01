---
title: 通知の札を置き、眠っていれば起こす
description: 標準ライブラリの futex 版 Parker の unpark。状態を NOTIFIED に変え、以前が PARKED だったときだけ futex で起こす。通知が先に来ても失われない。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/std/src/sys/sync/thread_parking/futex.rs
lines: [89, 99]
function: Parker::unpark
difficulty: 3
format: 2
tags: [並行処理, 低レイヤ, 防御的プログラミング]
---

## ひとことで

`unpark` は、眠っているスレッドを **起こす** 関数です。同時に、そのスレッドが次に `park` したときに眠らずに戻れるよう、**通知の札（NOTIFIED）** を置きます。
眠っているスレッドがいるときだけ、OS の `futex_wake` を呼びます。眠っていないときは、状態を書き換えるだけで済みます。

## コード

::: code-group

```rust:line-numbers=89 [日本語訳]
    pub fn unpark(self: Pin<&Self>) {
        // PARKED=>NOTIFIED、EMPTY=>NOTIFIED、NOTIFIED=>NOTIFIED のいずれかに変え、
        // 最初の場合（PARKED だった場合）はスレッドを起こす。
        //
        // NOTIFIED=>NOTIFIED でも書き込みが起きる。これは
        // 意図的なもので、すべての unpark() が
        // park() と release-acquire の順序を持つようにするため。
        if self.state.swap(NOTIFIED, Release) == PARKED {
            futex_wake(&self.state);
        }
    }
```

```rust:line-numbers=89 [原文]
    pub fn unpark(self: Pin<&Self>) {
        // Change PARKED=>NOTIFIED, EMPTY=>NOTIFIED, or NOTIFIED=>NOTIFIED, and
        // wake the thread in the first case.
        //
        // Note that even NOTIFIED=>NOTIFIED results in a write. This is on
        // purpose, to make sure every unpark() has a release-acquire ordering
        // with park().
        if self.state.swap(NOTIFIED, Release) == PARKED {
            futex_wake(&self.state);
        }
    }
```

:::

関数の上にある `#[inline]` は、小さな関数を呼び出し元に展開させる指示です。状態の書き換えと、1 回の判定だけの短い処理です。

## 前提知識

- **`park` と `unpark`**: `park` はスレッドを眠らせ、`unpark` は起こします。両者は組み合わせて使う対の関数です。
- **状態の 3 つ**: `EMPTY`、`NOTIFIED`（札がある）、`PARKED`（眠っている）です。
- **`swap`**: 新しい値を書き込んで、以前の値を返す原子的な操作です。`unpark` ではこの以前の値で、起こすかどうかを決めます。
- **`Release`**: 書き込みの順序の指定です。`park` の `Acquire` と組み合わさって、`unpark` より前に書いた内容が、起きたスレッドから見えるようにします。
- **`futex_wake`**: 眠っているスレッドを起こす OS の操作です。

## 何をしているか

### 1. 状態を NOTIFIED に書き換え、以前の値を見る

```rust:line-numbers=96
        if self.state.swap(NOTIFIED, Release) == PARKED {
```

`swap(NOTIFIED, Release)` で、状態を通知済みにし、以前の値を受け取ります。以前が `PARKED` なら、眠っているスレッドがいたことになります。

### 2. 眠っていたときだけ、起こす

```rust:line-numbers=97
            futex_wake(&self.state);
        }
```

以前が `PARKED` だったときだけ `futex_wake` を呼び、眠っているスレッドを起こします。`EMPTY` や `NOTIFIED` だったときは、誰も眠っていないので、起こす必要がありません。

## ここがすごい

- **眠っていないときはシステムコールがない**: 起こす必要がないときは、状態の書き換え 1 回だけで終わります。OS を呼ばないので、速く返せます。
- **通知が失われない**: 相手が眠る前に `unpark` が来ても、状態が `NOTIFIED` として残ります。次の `park` がそれを使って、眠らずに戻ります。
- **同じ状態への書き込みも行う**: 以前が `NOTIFIED` でも書き込みます。コメントにあるように、すべての `unpark` が `park` と順序を持つようにするためです。読み込みだけでは、その順序が保証されません。
- **書き換えと起床を分けて考える**: 「札を置く」は必ず行い、「起こす」は眠っている場合だけ行います。役割を分けたので、条件が単純になります。
- **`Release` の意味**: `unpark` より前に書いた内容が、`park` から戻ったスレッドに見えます。通知と一緒にデータを渡せる、という保証です。

## まとめ

- `unpark` は、状態を `NOTIFIED` に書き換え、以前が `PARKED` のときだけ `futex_wake` を呼ぶ。
- 通知は札として残るので、先に来ても失われない。
- 書き込みは毎回行い、`park` との順序を保証する。
