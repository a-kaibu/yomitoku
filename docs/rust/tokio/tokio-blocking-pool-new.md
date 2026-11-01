---
title: 設定に応じて、ブロッキング用のプールを組み立てる
description: tokio の BlockingPool::new。builder の設定を見て、キューの方式を選び、スレッドの共有状態と停止用の経路をまとめて作る。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/runtime/blocking/pool.rs
lines: [270, 308]
function: new
difficulty: 2
format: 2
tags: [並行処理, 設計パターン]
---

## ひとことで

`BlockingPool::new` は、tokio の `spawn_blocking` が使う **ブロッキング用スレッドプール** を作る関数です。プールは、時間のかかる同期処理を、非同期のワーカーとは別のスレッドで実行するための仕組みです。

この関数は、利用者が `Builder` で指定した設定を読み、キューの作り方、スレッド名、スタックの大きさ、停止の経路などを組み立てます。作られたプールは、`spawner`（仕事を頼む口）と `shutdown_rx`（停止を待つ口）の 2 つを持ちます。

## コード

```rust:line-numbers=270
    pub(crate) fn new(
        builder: &Builder,
        thread_cap: usize,
        scheduler_threads: usize,
    ) -> BlockingPool {
        let (shutdown_tx, shutdown_rx) = shutdown::channel();
        let keep_alive = builder.keep_alive.unwrap_or(KEEP_ALIVE);

        let thread_mgmt_state = ThreadManagementState {
            shutdown: false,
            shutdown_tx: Some(shutdown_tx),
            last_exiting_thread: None,
            worker_threads: HashMap::new(),
            worker_thread_index: 0,
        };

        let inner_impl = if builder.sharded_blocking_queue {
            InnerImpl::Sharded(ShardedImpl::new(thread_mgmt_state))
        } else {
            InnerImpl::Locked(LockedImpl::new(thread_mgmt_state))
        };

        BlockingPool {
            spawner: Spawner {
                inner: Arc::new(Inner {
                    inner_impl,
                    thread_name: builder.thread_name.clone(),
                    stack_size: builder.thread_stack_size,
                    after_start: builder.after_start.clone(),
                    before_stop: builder.before_stop.clone(),
                    thread_cap,
                    scheduler_threads,
                    keep_alive,
                    metrics: SpawnerMetrics::default(),
                }),
            },
            shutdown_rx,
        }
    }
```

## 前提知識

- **ブロッキング処理**: スレッドを止めて結果を待つ処理です。ファイルの読み書きや計算など、非同期の仕組みで待てない処理がこれに当たります。
- **`Builder`**: 設定をひとつずつ指定してから、最後にまとめて作るための型です。ここでは、キューの種類、スレッド名、待ち時間などを持ちます。
- **`Arc`**: 参照カウントで共有する値を作る型です。複数のスレッドから同じ `Inner` を持てるようにします。
- **チャネル**: スレッドどうしで値を送受信する通り道です。`shutdown::channel` は、停止の合図を送る通り道を作ります。
- **`HashMap::new()`**: 空のハッシュマップを作ります。ここでは、起動中のワーカースレッドを名前や番号で管理するために使われます。

## 何をしているか

### 1. 停止の通り道と、設定値を用意する

```rust:line-numbers=275
        let (shutdown_tx, shutdown_rx) = shutdown::channel();
        let keep_alive = builder.keep_alive.unwrap_or(KEEP_ALIVE);
```

停止の合図を送る口（`shutdown_tx`）と受け取る口（`shutdown_rx`）を作ります。`keep_alive` は、使われなくなったスレッドが待つ時間です。指定がなければ既定の値を使います。

### 2. 共有する管理状態を作る

```rust:line-numbers=278
        let thread_mgmt_state = ThreadManagementState {
            shutdown: false,
            shutdown_tx: Some(shutdown_tx),
            last_exiting_thread: None,
            worker_threads: HashMap::new(),
            worker_thread_index: 0,
        };
```

`ThreadManagementState` は、停止したかどうか、最後に終了したスレッド、起動中のワーカーの一覧などを持ちます。ワーカーの番号は 0 から始めます。

### 3. 設定に応じて、キューの方式を選ぶ

```rust:line-numbers=286
        let inner_impl = if builder.sharded_blocking_queue {
            InnerImpl::Sharded(ShardedImpl::new(thread_mgmt_state))
        } else {
            InnerImpl::Locked(LockedImpl::new(thread_mgmt_state))
        };
```

`sharded_blocking_queue` が真なら、キューを分割する方式（`Sharded`）を使います。偽なら、キューを 1 つにまとめて、ロックで守る方式（`Locked`）を使います。どちらも、同じ管理状態を最初に渡します。

### 4. プールの本体を組み立てる

```rust:line-numbers=292
        BlockingPool {
            spawner: Spawner {
                inner: Arc::new(Inner {
                    inner_impl,
                    thread_name: builder.thread_name.clone(),
                    stack_size: builder.thread_stack_size,
                    after_start: builder.after_start.clone(),
                    before_stop: builder.before_stop.clone(),
                    thread_cap,
                    scheduler_threads,
                    keep_alive,
                    metrics: SpawnerMetrics::default(),
                }),
            },
            shutdown_rx,
        }
```

設定値、スレッド名、スタックの大きさ、開始時と停止時のフックなどを `Inner` にまとめ、`Arc` で包みます。これを `Spawner` に入れて、`BlockingPool` の `spawner` とします。停止用の `shutdown_rx` と一緒に返します。

## ここがすごい

- **設定から実装を選ぶ**: キューの方式は、利用者の指定によって決まります。呼び出す側は同じ `spawn_blocking` を使えるので、内部の方式を気にせずに済みます。
- **共有の範囲を絞る**: 共有が必要な部分だけを `Arc<Inner>` にまとめ、所有権を分けています。`Spawner` のコピーは、参照カウントを増やすだけで済みます。
- **停止の経路を最初から作る**: 停止の通り道を、プールを作るときに一緒に作るので、後から経路を足す必要がありません。
- **指標を最初から用意する**: `SpawnerMetrics::default()` によって、仕事の数などを記録する仕組みも、最初から組み込まれます。

## まとめ

- 設定値から実装を選ぶと、利用者は同じ書き方で、性能の特性を切り替えられます。
- 共有する状態は `Arc` にまとめ、所有権を分けておくと、複数のスレッドから安全に扱えます。
- 停止の経路は、作成時に一緒に用意すると、後で漏れることがありません。
