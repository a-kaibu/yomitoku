---
title: 通知の札を 1 枚使って、眠りから戻る
description: 標準ライブラリの futex 版 Parker の park。状態を 1 減らす操作で、通知済みなら眠らずに戻り、そうでなければ futex で眠る。偽の起床にも対応する。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/std/src/sys/sync/thread_parking/futex.rs
lines: [47, 63]
function: Parker::park
difficulty: 3
format: 2
tags: [並行処理, 低レイヤ, 最適化]
---

## ひとことで

`park` は、そのスレッドを **眠らせて、ほかのスレッドから起こされるまで待つ** 関数です。ただし、すでに「通知（NOTIFIED）」が届いていれば、眠らずにすぐ戻ります。
通知は、1 回分の「札（トークン）」のような役割を持ちます。札がある間は眠らずに通り、札がなければ眠ります。

## コード

::: code-group

```rust:line-numbers=47 [日本語訳]
    pub unsafe fn park(self: Pin<&Self>) {
        // NOTIFIED=>EMPTY または EMPTY=>PARKED に変える。
        // 最初の場合（NOTIFIED だった場合）はすぐに戻る。
        if self.state.fetch_sub(1, Acquire) == NOTIFIED {
            return;
        }
        loop {
            // 何かが起きるまで待つ。まだ PARKED のままだと仮定する。
            futex_wait(&self.state, PARKED, None);
            // NOTIFIED なら EMPTY に変えて、そこで戻る。
            if self.state.compare_exchange(NOTIFIED, EMPTY, Acquire, Acquire).is_ok() {
                return;
            } else {
                // 偽の起床。もう一度ループして試す。
            }
        }
    }
```

```rust:line-numbers=47 [原文]
    pub unsafe fn park(self: Pin<&Self>) {
        // Change NOTIFIED=>EMPTY or EMPTY=>PARKED, and directly return in the
        // first case.
        if self.state.fetch_sub(1, Acquire) == NOTIFIED {
            return;
        }
        loop {
            // Wait for something to happen, assuming it's still set to PARKED.
            futex_wait(&self.state, PARKED, None);
            // Change NOTIFIED=>EMPTY and return in that case.
            if self.state.compare_exchange(NOTIFIED, EMPTY, Acquire, Acquire).is_ok() {
                return;
            } else {
                // Spurious wake up. We loop to try again.
            }
        }
    }
```

:::

`park` は、このパーカーを持つスレッドだけが呼ぶ前提です。そのため、状態が `PARKED`（眠り中）になっていないことを、コメントで約束しています。

## 前提知識

- **Parker**: スレッドを眠らせたり、起こしたりする仕組みです。`park` で眠り、ほかのスレッドが `unpark` で起こします。
- **状態の 3 つ**: `EMPTY`（何もない）、`NOTIFIED`（通知の札がある）、`PARKED`（眠っている）の 3 つです。`EMPTY` は 0、`NOTIFIED` は 1、`PARKED` は最大値で表されます。
- **`fetch_sub`**: 値を引き、以前の値を返す原子的な操作です。
- **偽の起床（spurious wake up）**: `futex_wait` は、条件が変わっていなくても戻ることがあります。そのため、起きたら状態を確かめ直す必要があります。
- **`Acquire`**: 読み込みの順序の指定です。`unpark` の `Release` と組み合わせて、前に書かれた内容を見えるようにします。

## 何をしているか

### 1. 札があるかを、1 減らして確かめる

```rust:line-numbers=50
        if self.state.fetch_sub(1, Acquire) == NOTIFIED {
            return;
        }
```

`fetch_sub(1)` で状態を 1 減らします。元が `NOTIFIED` だったなら、結果は `EMPTY` になり、通知の札を使ったことになるので、すぐ `return` します。
元が `EMPTY` のときは、0 から 1 を引くと最大値に折り返され、`PARKED` になります。このとき眠る準備ができます。

### 2. 眠って起こされるのを待つ

```rust:line-numbers=54
            // Wait for something to happen, assuming it's still set to PARKED.
            futex_wait(&self.state, PARKED, None);
```

`futex_wait` で、状態が `PARKED` のままの間は眠ります。`unpark` が状態を変えると、眠りから戻ります。

### 3. 起きたら、札を確かめる

```rust:line-numbers=56
            // Change NOTIFIED=>EMPTY and return in that case.
            if self.state.compare_exchange(NOTIFIED, EMPTY, Acquire, Acquire).is_ok() {
                return;
            } else {
                // Spurious wake up. We loop to try again.
            }
        }
```

起きたら、状態が `NOTIFIED` なら `EMPTY` に変えて戻ります。そうでなければ偽の起床なので、ループの先頭に戻って、もう一度眠ります。

## ここがすごい

- **1 つの整数で、札と眠りを表す**: 状態を 1 つの原子的な変数にまとめているので、「札があるか」と「眠るか」を 1 回の操作で同時に決められます。
- **引き算で状態を移す**: `EMPTY` を 1 減らすと `PARKED` になり、`NOTIFIED` を 1 減らすと `EMPTY` になります。別々の比較や分岐を書かずに、状態の移り変わりが表せます。
- **通知が先に届いても失わない**: `unpark` が先に来ていれば、`park` が眠らずに戻れます。起こす側と眠る側の順番が入れ替わっても、通知は札として残るので、取りこぼしがありません。
- **偽の起床への備え**: 起きた後の状態確認で、本当に通知があったかを確かめます。違えば再び眠るので、誤って先に進むことがありません。
- **順序の保証**: 札を取るときの `Acquire` と、`unpark` の `Release` が組み合わさって、起こす側が書いた内容が、起きた側から見えるようになります。

## まとめ

- `park` は、通知の札があれば眠らずに戻り、なければ `PARKED` にして futex で眠る。
- 状態の移り変わりは、1 を引く操作と比較だけで表せる。
- 偽の起床を考えて、起きたあとに状態を確かめ直す。
