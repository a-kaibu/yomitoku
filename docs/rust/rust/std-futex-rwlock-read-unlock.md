---
title: 最後の読み手が、待っている書き手を起こす
description: 標準ライブラリの futex 版 RwLock の read_unlock。読み取りの数を 1 減らし、最後の読み手で、書き手が待っていれば起こす。書き手が優先される順番を守る。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/std/src/sys/sync/rwlock/futex.rs
lines: [109, 121]
function: RwLock::read_unlock
difficulty: 3
format: 2
tags: [並行処理, 防御的プログラミング, 最適化]
---

## ひとことで

`read_unlock` は、読み取りロックを **1 人分解放する** 関数です。読み手の数を 1 減らし、その結果、**最後の読み手** になって、かつ書き手が待っていれば、その書き手を起こします。
読み手が何人残っているかは、状態の数で分かります。そのため、途中の読み手は何もせずに戻れます。

## コード

::: code-group

```rust:line-numbers=109 [日本語訳]
    #[inline]
    pub unsafe fn read_unlock(&self) {
        let state = self.state.fetch_sub(READ_LOCKED, Release) - READ_LOCKED;

        // 読み取りロック中の RwLock で、読み手が待っていることはありえない。
        // 書き手も待っている場合を除いて。
        debug_assert!(!has_readers_waiting(state) || has_writers_waiting(state));

        // 最後の読み手だったとき、書き手が待っていれば書き手を起こす。
        if is_unlocked(state) && has_writers_waiting(state) {
            self.wake_writer_or_readers(state);
        }
    }
```

```rust:line-numbers=109 [原文]
    #[inline]
    pub unsafe fn read_unlock(&self) {
        let state = self.state.fetch_sub(READ_LOCKED, Release) - READ_LOCKED;

        // It's impossible for a reader to be waiting on a read-locked RwLock,
        // except if there is also a writer waiting.
        debug_assert!(!has_readers_waiting(state) || has_writers_waiting(state));

        // Wake up a writer if we were the last reader and there's a writer waiting.
        if is_unlocked(state) && has_writers_waiting(state) {
            self.wake_writer_or_readers(state);
        }
    }
```

:::

`read_unlock` は、`unsafe` 関数です。読み取りロックを持っているスレッドだけが呼ぶ前提です。

## 前提知識

- **読み取りロックの数**: 状態の下位ビットに、読み取り中の人数が入っています。読み取りロックを取るたびに 1 増え、解放するたびに 1 減ります。
- **`READ_LOCKED`**: 読み取り 1 人分を表す値（1）です。
- **`fetch_sub` の戻り値**: 引く前の値を返す `fetch_sub` の結果から、`- READ_LOCKED` で引いたあとの値を計算しています。ここでは、引いたあとの状態を直接使うために、戻り値を調整しています。
- **`is_unlocked`**: 状態の下位ビットが 0、つまり読み手も書き手もいない状態かを調べる関数です。
- **`debug_assert!`**: 読み手が待っているのは、書き手も待っているときだけ、という前提を確かめます。

## 何をしているか

### 1. 読み手の数を 1 減らす

```rust:line-numbers=111
        let state = self.state.fetch_sub(READ_LOCKED, Release) - READ_LOCKED;
```

`fetch_sub(READ_LOCKED, Release)` で読み手を 1 人分減らします。`- READ_LOCKED` を付けて、引いたあとの値を `state` に入れます。

### 2. 前提を確かめる

```rust:line-numbers=115
        debug_assert!(!has_readers_waiting(state) || has_writers_waiting(state));
```

読み取りロック中に読み手が待っていることは、書き手も待っている場合を除いてありえません。デバッグビルドで、この前提を確かめます。

### 3. 最後の読み手なら、書き手を起こす

```rust:line-numbers=118
        if is_unlocked(state) && has_writers_waiting(state) {
            self.wake_writer_or_readers(state);
        }
```

解放のあとで、ロックが空いていて（最後の読み手だった）、書き手が待っていれば、`wake_writer_or_readers` を呼びます。そうでなければ何もせずに戻ります。

## ここがすごい

- **大多数の読み手は何もしない**: 読み手が複数いるとき、途中の解放は、最後の 1 人以外には何もしません。読み手の解放の多くが、速く終わります。
- **書き手に順番を回す**: 読み手が全員いなくなったときに、待っていた書き手へ順番を回します。書き手が飢えないように、順番を守る仕組みです。
- **前提の確認が読みやすい**: 「読み手が待っているのは、書き手も待っているときだけ」という約束が、`debug_assert!` で表されています。
- **状態の値から判断する**: 読み手の数や待ちの印を、同じ整数から読み取ります。別々の変数で管理しないので、判断が一貫します。
- **`Release` の順序**: 読み手の解放にも `Release` を付けて、次に書き込む人が、その前の読み取りを終えていることを保証します。

## まとめ

- 読み取りロックの解放は、読み手の数を 1 減らし、最後の読み手で書き手が待っていれば起こす。
- 途中の読み手は、何もせずに戻る。
- 書き手に順番を回すことで、書き手が飢えないようにする。
