---
title: 解放するとき、待っている 1 人だけを起こす
description: 標準ライブラリの futex 版 Mutex の unlock。状態を UNLOCKED に戻し、以前が CONTENDED だったときだけ 1 人を起こす。起こされた人が、待ちの印を付け直すので、全員が起きる。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/std/src/sys/sync/mutex/futex.rs
lines: [89, 97]
function: Mutex::unlock
difficulty: 2
format: 2
tags: [並行処理, 防御的プログラミング, 最適化]
---

## ひとことで

`unlock` は、ロックを **解放する** 関数です。状態を `UNLOCKED`（空き）に戻し、そのとき前の状態が `CONTENDED`（待ちあり）だったら、待っているスレッドを **1 人だけ** 起こします。
待っている全員を一度に起こさないのが特徴です。起こされた 1 人がロックを取るときに、再び `CONTENDED` の印を付けるので、残りの待ちの人も順に起こされます。

## コード

::: code-group

```rust:line-numbers=89 [日本語訳]
    pub unsafe fn unlock(&self) {
        if self.futex.swap(UNLOCKED, Release) == CONTENDED {
            // 起こすのは 1 つのスレッドだけ。そのスレッドがロックを取るとき、
            // ロックに CONTENDED の印を付け直す（上の lock_contended を参照）。
            // そうすることで、待っている他のスレッドも
            // いずれ必ず起こされる。
            self.wake();
        }
    }
```

```rust:line-numbers=89 [原文]
    pub unsafe fn unlock(&self) {
        if self.futex.swap(UNLOCKED, Release) == CONTENDED {
            // We only wake up one thread. When that thread locks the mutex, it
            // will mark the mutex as CONTENDED (see lock_contended above),
            // which makes sure that any other waiting threads will also be
            // woken up eventually.
            self.wake();
        }
    }
```

:::

`wake` は、`futex_wake` を呼ぶだけの関数です。`#[cold]` で、普通の経路から外しています。

## 前提知識

- **`swap(UNLOCKED, Release)`**: 値を `UNLOCKED` に書き換え、以前の値を返す原子的な操作です。`Release` は、それまでにクリティカルセクションの中で書いた内容を、次にロックを取る人へ見せる約束です。
- **`Release` と `Acquire`**: 解放側が `Release` で書き込み、取得側が `Acquire` で読み込むと、その間の書き込みが見えることを保証する順序です。
- **`futex_wake`**: 眠っているスレッドを起こす OS の仕組みです。起こす数を指定でき、ここでは 1 人を指定しています。
- **`CONTENDED`**: 待っているスレッドがいることを表す状態です。
- **`lock_contended`**: 起こされたスレッドが、ロックを取るときに通る関数です。前に読んだ記事の部分です。

## 何をしているか

### 1. 状態を空きに戻し、以前の状態を見る

```rust:line-numbers=90
        if self.futex.swap(UNLOCKED, Release) == CONTENDED {
```

`swap(UNLOCKED, Release)` で状態を空きにし、以前の状態を受け取ります。以前が `CONTENDED` だったかどうかで、次の処理が決まります。

### 2. 待ちがあれば、1 人だけ起こす

```rust:line-numbers=91
            // We only wake up one thread. When that thread locks the mutex, it
            // will mark the mutex as CONTENDED (see lock_contended above),
            // which makes sure that any other waiting threads will also be
            // woken up eventually.
            self.wake();
```

以前が `CONTENDED` だったときだけ `wake` を呼びます。起こすのは 1 人で、その人がロックを取るとき、状態をもう一度 `CONTENDED` にします。そうすれば、残りの待ちの人も、いずれ起こされます。

## ここがすごい

- **全員を起こさない**: 全員を一斉に起こすと、ロックを取り合う競争が起きて、大半が無駄に眠り直します。1 人ずつ起こすと、競争を抑えられます。
- **連鎖で全員に届く**: 起こされた 1 人が、ロックを取るときに `CONTENDED` にするので、待ちが残っていれば次の解放のときにも起こされます。1 人の行動が連鎖して、全員に届きます。
- **待ちがなければ何もしない**: 以前が `UNLOCKED` や `LOCKED` だったなら、`wake` は呼ばれません。システムコールを避けるので、速く解放できます。
- **`Release` の順序**: 解放の `swap` に `Release` を使うことで、クリティカルセクションの中の書き込みが、次の取得者に見えることを保証します。
- **`#[cold]` の `wake`**: 起こす処理は、めったに通らない経路として扱われます。普通の解放は、ほとんど分岐なしで終わります。

## まとめ

- 解放は、状態を `UNLOCKED` に戻し、以前が `CONTENDED` だったときだけ 1 人を起こす。
- 起こされた人がロックを取るときに、`CONTENDED` を付け直すので、待ちの人が順に起こされる。
- 待ちがなければ、システムコールを使わずに解放できる。
