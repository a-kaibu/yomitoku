---
title: 書き込みロックを、読み取りロックに降格させる
description: 標準ライブラリの futex 版 RwLock の downgrade。書き込みの印を消して読み取り 1 つに変え、待っていた読み手を全員起こす。書き手が手放さずに読み手と共有できる。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/std/src/sys/sync/rwlock/futex.rs
lines: [195, 206]
function: RwLock::downgrade
difficulty: 3
format: 2
tags: [並行処理, 防御的プログラミング, ビット演算]
---

## ひとことで

`downgrade` は、**書き込みロックを読み取りロックに変える** 関数です。書き込み中のスレッドは、ロックを手放さずに、読み取りの権利だけを残します。待っていた読み手は、この時点で一緒に読めるようになります。
たとえば、データを書き換えたあと、そのデータを他のスレッドと共有して読ませたいときに使われます。

## コード

::: code-group

```rust:line-numbers=195 [日本語訳]
    #[inline]
    pub unsafe fn downgrade(&self) {
        // 書き込みのビットをすべて消し、読み取りを 1 つ加える。
        let state = self.state.fetch_add(DOWNGRADE, Release);
        debug_assert!(is_write_locked(state), "RwLock must be write locked to call `downgrade`");

        if has_readers_waiting(state) {
            // 排他ロックを持っていたので、ほかの誰もこの印を消せない。
            self.state.fetch_sub(READERS_WAITING, Relaxed);
            futex_wake_all(&self.state);
        }
    }
```

```rust:line-numbers=195 [原文]
    #[inline]
    pub unsafe fn downgrade(&self) {
        // Removes all write bits and adds a single read bit.
        let state = self.state.fetch_add(DOWNGRADE, Release);
        debug_assert!(is_write_locked(state), "RwLock must be write locked to call `downgrade`");

        if has_readers_waiting(state) {
            // Since we had the exclusive lock, nobody else can unset this bit.
            self.state.fetch_sub(READERS_WAITING, Relaxed);
            futex_wake_all(&self.state);
        }
    }
```

:::

`downgrade` も `unsafe` 関数です。書き込みロックを持つスレッドだけが呼ぶことが、約束になっています。ドキュメントコメントで、その旨が書かれています。

## 前提知識

- **降格（downgrade）**: 強い権利（書き込み）を、弱い権利（読み取り）に変えることです。手放すのではなく、権利の種類を変えます。
- **`DOWNGRADE` 定数**: `READ_LOCKED - WRITE_LOCKED` を 2^32 の法で計算した値です。これを足すと、書き込みの値が消えて、読み取り 1 人の値になります。
- **`fetch_add`**: 値を足し、以前の値を返す原子的な操作です。
- **`READERS_WAITING`**: 読み手が待っている印です。降格で読み手を起こすとき、この印を消します。
- **`futex_wake_all`**: 眠っているすべてのスレッドを起こす OS の操作です。

## 何をしているか

### 1. 書き込みの印を消して、読み取り 1 つにする

```rust:line-numbers=198
        let state = self.state.fetch_add(DOWNGRADE, Release);
```

`DOWNGRADE` を足すと、書き込みを表す値が消え、読み取り 1 人分の値が残ります。待ちの印などは、そのまま残ります。以前の値を `state` に入れておきます。

### 2. 書き込みロックを持っていたことを確かめる

```rust:line-numbers=199
        debug_assert!(is_write_locked(state), "RwLock must be write locked to call `downgrade`");
```

降格の前は、書き込みロックを持っていたはずです。デバッグビルドでは、以前の状態が書き込み中だったことを確かめます。

### 3. 待っていた読み手を全員起こす

```rust:line-numbers=201
        if has_readers_waiting(state) {
            // Since we had the exclusive lock, nobody else can unset this bit.
            self.state.fetch_sub(READERS_WAITING, Relaxed);
            futex_wake_all(&self.state);
        }
```

読み手が待っていれば、待ちの印を消し、`futex_wake_all` で全員を起こします。待ちの印を消すのは、ほかに誰も変えないと分かっている（排他ロックを持っていた）からです。

## ここがすごい

- **手放さずに共有へ移れる**: 書き込みから読み取りへ変えるとき、いったんロックを解放して取り直す必要がありません。他のスレッドが割り込むおそれがないまま、読める状態へ移れます。
- **1 回の加算で書き換えが済む**: 書き込みの印の消去と、読み取り 1 人分の追加が、1 つの `fetch_add` で行われます。
- **待ちの読み手を一斉に起こす**: 書き手が読み取りに降格すると、待っていた読み手は全員読めます。そのため `wake_all` を使っています。
- **排他ロックの前提を活かす**: 待ちの印を消す `fetch_sub` は `Relaxed` で行われます。排他ロックを持っているので、ほかの誰も同時に印を変えられないからです。
- **前提の確認と `unsafe` の組み合わせ**: ドキュメントに書かれた約束と、デバッグ時の確認で、誤った呼び出しを防いでいます。

## まとめ

- 降格は、書き込みの印を消して読み取り 1 人分に変える、1 回の加算で行う。
- 待っていた読み手は、全員を起こして一緒に読めるようにする。
- 排他ロックを持っているので、待ちの印の消去は安全に行える。
