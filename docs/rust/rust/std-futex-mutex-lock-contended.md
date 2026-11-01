---
title: 取れなかったロックを、少し回ってから OS に待たせる
description: 標準ライブラリの futex 版 Mutex の lock_contended。ロックが取れないとき、短く spin してから、3 つの状態を使って futex で眠らせて起こす。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/std/src/sys/sync/mutex/futex.rs
lines: [38, 66]
function: Mutex::lock_contended
difficulty: 3
format: 2
tags: [並行処理, 低レイヤ, 最適化]
---

## ひとことで

`lock_contended` は、`Mutex::lock` で **すぐにはロックを取れなかったとき** に呼ばれる関数です。ロックを取るための最後の手段で、少し回って待ち（spin）、それでもだめなら OS の `futex` という仕組みで **眠って、起こされるのを待ち** ます。
ロックの状態は、「解放（UNLOCKED）」「ロック済み（LOCKED）」「ロック済みで、他にも待っている人がいる（CONTENDED）」の 3 つです。この 3 つを使い分けるのが、この関数の中心です。

## コード

::: code-group

```rust:line-numbers=38 [日本語訳]
    fn lock_contended(&self) {
        // 先に spin して、すぐに解放されれば速く取る。
        let mut state = self.spin();

        // 今解放されていれば、ロックを取ることを試みる
        // CONTENDED の印を付けずに。
        if state == UNLOCKED {
            match self.futex.compare_exchange(UNLOCKED, LOCKED, Acquire, Relaxed) {
                Ok(_) => return, // ロックを取れた！
                Err(s) => state = s,
            }
        }

        loop {
            // ロックを CONTENDED 状態にする。
            // すでに CONTENDED なら無駄な書き込みを避ける。
            // キャッシュに優しくするため。
            if state != CONTENDED && self.futex.swap(CONTENDED, Acquire) == UNLOCKED {
                // UNLOCKED から CONTENDED に変えたので、ロックを取れた。
                return;
            }

            // 状態が変わるまで futex で待つ（まだ CONTENDED のままと仮定する）。
            futex_wait(&self.futex, CONTENDED, None);

            // 起きたあと、もう一度 spin する。
            state = self.spin();
        }
    }
```

```rust:line-numbers=38 [原文]
    fn lock_contended(&self) {
        // Spin first to speed things up if the lock is released quickly.
        let mut state = self.spin();

        // If it's unlocked now, attempt to take the lock
        // without marking it as contended.
        if state == UNLOCKED {
            match self.futex.compare_exchange(UNLOCKED, LOCKED, Acquire, Relaxed) {
                Ok(_) => return, // Locked!
                Err(s) => state = s,
            }
        }

        loop {
            // Put the lock in contended state.
            // We avoid an unnecessary write if it as already set to CONTENDED,
            // to be friendlier for the caches.
            if state != CONTENDED && self.futex.swap(CONTENDED, Acquire) == UNLOCKED {
                // We changed it from UNLOCKED to CONTENDED, so we just successfully locked it.
                return;
            }

            // Wait for the futex to change state, assuming it is still CONTENDED.
            futex_wait(&self.futex, CONTENDED, None);

            // Spin again after waking up.
            state = self.spin();
        }
    }
```

:::

`lock_contended` は、`#[cold]` 属性が付いています。ロックが取れない状況はあまり起きない前提で、コンパイラに、この関数を通常の経路から外して置くよう指示しています。

## 前提知識

- **ミューテックス（Mutex）**: 同時に 1 つのスレッドだけが中に入れるようにする仕組みです。ロックを取って、使い終わったら解放します。
- **原子的な操作（atomic）**: 複数のスレッドが同時に読み書きしても、途中の状態が見えない操作です。`compare_exchange` は「値が期待どおりなら書き換える」を 1 回で行います。
- **`swap`**: 新しい値を書き込み、古い値を返す原子的な操作です。
- **futex**: Linux などの OS が提供する、待ちと起床の仕組みです。「値が `CONTENDED` のままなら眠る」と指定でき、起こすときは `futex_wake` を使います。
- **spin**: ロックが空くのを、眠らずに短い間ぐるぐる回って待つことです。

## 何をしているか

### 1. まず spin して、すぐ空くか待つ

```rust:line-numbers=39
        // Spin first to speed things up if the lock is released quickly.
        let mut state = self.spin();
```

`self.spin()` で、短い間ロックの状態を見続けます。すぐに解放されれば、眠らずに取れます。spin の結果は `state` に入り、その後の判断に使われます。

### 2. 解放されていれば、もう一度取る

```rust:line-numbers=42
        // If it's unlocked now, attempt to take the lock
        // without marking it as contended.
        if state == UNLOCKED {
            match self.futex.compare_exchange(UNLOCKED, LOCKED, Acquire, Relaxed) {
                Ok(_) => return, // Locked!
                Err(s) => state = s,
            }
```

`UNLOCKED` になっていたら、`compare_exchange` で `LOCKED` に変えてみます。成功すれば `return` で終わります。失敗したら、今の状態を `state` に入れ直します。

### 3. CONTENDED の印を付けて、眠る

```rust:line-numbers=51
        loop {
            // Put the lock in contended state.
            // We avoid an unnecessary write if it as already set to CONTENDED,
            // to be friendlier for the caches.
            if state != CONTENDED && self.futex.swap(CONTENDED, Acquire) == UNLOCKED {
                // We changed it from UNLOCKED to CONTENDED, so we just successfully locked it.
                return;
            }

            // Wait for the futex to change state, assuming it is still CONTENDED.
            futex_wait(&self.futex, CONTENDED, None);

            // Spin again after waking up.
            state = self.spin();
        }
```

ループの中で、まずロックの状態を `CONTENDED` にします。元が `UNLOCKED` だったなら、取れたことになるので `return` します。そうでなければ `futex_wait` で、状態が `CONTENDED` のまま眠ります。起きたら、もう一度 `spin` して、次の周回へ進みます。

## ここがすごい

- **3 つの状態で、無駄な起床を減らす**: `LOCKED` だけなら、解放するときに誰も起こす必要がありません。`CONTENDED` と印を付けるのは、待っている人がいる場合だけです。
- **spin と眠りを組み合わせる**: 短い待ちは spin で速く終わらせ、長い待ちは眠って CPU を使わずに待ちます。両方の良いところを取っています。
- **キャッシュへの配慮**: 状態がすでに `CONTENDED` なら、書き込みを省きます。書き込みはキャッシュの一致を壊すので、読むだけで済ませる工夫です。
- **`compare_exchange` と `swap` の使い分け**: 最初は「期待どおりなら変える」、眠る前は「必ず `CONTENDED` にして、前の値を見る」。目的に合わせて、原子的な操作を選んでいます。
- **起きた後も確かめる**: 眠りから起きたあとは、もう一度 spin してから判断します。ロックが空いていれば、待ちを続けずに取れます。

## まとめ

- ロックが取れないときは、spin で短く待ってから、`CONTENDED` の印を付けて futex で眠る。
- 3 つの状態を使い分けると、起床の回数と書き込みを減らせる。
- 原子的な操作を、目的に合わせて `compare_exchange` と `swap` で使い分ける。
