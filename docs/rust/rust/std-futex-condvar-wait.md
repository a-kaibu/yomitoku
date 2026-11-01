---
title: 通知を取りこぼさずに、ロックを外して眠る
description: 標準ライブラリの futex 版 Condvar の待ち処理。通知カウンタを読んでからロックを外し、カウンタが変わっていなければ眠る。通知がロックを外す隙間に来ても失われない。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/std/src/sys/sync/condvar/futex.rs
lines: [40, 55]
function: Condvar::wait_optional_timeout
difficulty: 3
format: 2
tags: [並行処理, 低レイヤ, 防御的プログラミング]
---

## ひとことで

`wait_optional_timeout` は、条件変数（Condvar）で **通知が来るまでスレッドを眠らせる** 関数です。眠る前にミューテックスを外し、起きたら取り直します。
ここでの工夫は、「ミューテックスを外してから眠る」までの短い隙間に、通知が届いても取りこぼさないことです。そのために、**通知のカウンタ** を使います。

## コード

::: code-group

```rust:line-numbers=40 [日本語訳]
    unsafe fn wait_optional_timeout(&self, mutex: &Mutex, timeout: Option<Duration>) -> bool {
        // ミューテックスを解除する前に、通知のカウンタを読んでおく。
        let futex_value = self.futex.load(Relaxed);

        // 眠る前にミューテックスを解除する。
        mutex.unlock();

        // 待つが、解除のあとに通知がなかった場合だけ。
        // （解除してから通知が来ていない場合のみ待つ）
        let r = futex_wait(&self.futex, futex_value, timeout);

        // ミューテックスをもう一度ロックする。
        mutex.lock();

        r
    }
```

```rust:line-numbers=40 [原文]
    unsafe fn wait_optional_timeout(&self, mutex: &Mutex, timeout: Option<Duration>) -> bool {
        // Examine the notification counter _before_ we unlock the mutex.
        let futex_value = self.futex.load(Relaxed);

        // Unlock the mutex before going to sleep.
        mutex.unlock();

        // Wait, but only if there hasn't been any
        // notification since we unlocked the mutex.
        let r = futex_wait(&self.futex, futex_value, timeout);

        // Lock the mutex again.
        mutex.lock();

        r
    }
```

:::

`wait_optional_timeout` は、タイムアウトの指定がある場合と、ない場合の両方を扱います。`wait` と `wait_timeout` は、どちらもこの関数を呼ぶだけです。

## 前提知識

- **条件変数（Condvar）**: 「ある条件が成り立つまで待つ」ための仕組みです。待つ側はミューテックスを持ったまま条件を確かめ、条件が満たされていなければ眠ります。
- **通知（notify）**: 眠っているスレッドを起こす操作です。`notify_one` は 1 人、`notify_all` は全員を起こします。
- **カウンタ**: 通知のたびに増える整数です。通知が起きたかどうかを、値の変化で確かめられます。
- **`futex_wait(&x, 値, timeout)`**: `x` の値が `値` のままなら眠り、違えばすぐに戻る OS の仕組みです。
- **`Relaxed`**: 順序の保証が一番弱い読み書きの指定です。ここでは、カウンタの値そのものだけが分かればよいので使われています。

## 何をしているか

### 1. 眠る前にカウンタを読む

```rust:line-numbers=41
        // Examine the notification counter _before_ we unlock the mutex.
        let futex_value = self.futex.load(Relaxed);
```

ミューテックスを外す前に、通知のカウンタの値を `futex_value` に保存します。この値が、後で「通知が来たかどうか」の基準になります。

### 2. ミューテックスを外し、カウンタが変わっていなければ眠る

```rust:line-numbers=44
        // Unlock the mutex before going to sleep.
        mutex.unlock();

        // Wait, but only if there hasn't been any
        // notification since we unlocked the mutex.
        let r = futex_wait(&self.futex, futex_value, timeout);
```

ミューテックスを外してから、`futex_wait` で眠ります。`futex_wait` は、カウンタが `futex_value` のままのときだけ眠るので、外してから通知が来ていたら、眠らずに戻ります。

### 3. ミューテックスを取り直して戻る

```rust:line-numbers=51
        // Lock the mutex again.
        mutex.lock();

        r
```

起きたら、ミューテックスを取り直します。呼び出し側は、条件を確かめ直してから、必要ならもう一度 `wait` を呼びます。

ちなみに、通知の側は `notify_one` で、カウンタを増やしてから `futex_wake` を呼びます。

```rust:line-numbers=23
        self.futex.fetch_add(1, Relaxed);
        futex_wake(&self.futex);
```

## ここがすごい

- **通知の取りこぼしを防ぐ**: ミューテックスを外してから眠るまでの隙間に通知が来ても、カウンタが変わっているので `futex_wait` は眠らずに戻ります。この隙間の問題を、カウンタだけで解いています。
- **通知の側は軽い**: 通知は、カウンタを増やして `futex_wake` を呼ぶだけです。待っている側の状態を直接見ないので、単純に書けています。
- **ロックを持ったまま眠らない**: 眠る前にミューテックスを外すことで、ほかのスレッドが条件を変えられるようにしています。これが条件変数の基本の約束です。
- **タイムアウトを同じ仕組みで扱う**: `Option<Duration>` を渡すだけで、タイムアウト付きの待ちと、そうでない待ちを 1 つの関数にまとめています。
- **偽の起床を前提にする**: 起きた後の条件の確認は、呼び出し側が行います。この関数は、待ちと戻りだけを正しく行う役割です。

## まとめ

- 条件変数の待ちは、カウンタを読む、ミューテックスを外す、カウンタが変わっていなければ眠る、の順で行う。
- カウンタを使うことで、ミューテックスを外す隙間の通知を取りこぼさない。
- 起きたらミューテックスを取り直し、条件は呼び出し側が確かめ直す。
