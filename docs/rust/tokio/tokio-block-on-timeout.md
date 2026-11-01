---
title: 締切までの間、Future を同期的に待ち続ける
description: tokio の block_on_timeout。Future を poll し、完了すれば値を返し、まだなら締切までスレッドを眠らせて再び poll する。締切を過ぎたらエラーを返す。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/runtime/context/blocking.rs
lines: [73, 106]
function: block_on_timeout
difficulty: 3
format: 2
tags: [非同期, 並行処理, 状態機械]
---

## ひとことで

`block_on_timeout` は、非同期の処理（`Future`）を、**現在のスレッドで締切の時刻まで待ちながら完了させる** 関数です。非同期の世界から、同期的な関数の中で結果を取り出すための入り口の一つです。

仕組みは単純です。`Future` を `poll` して、完了していれば値を返します。完了していなければ、締切までの残り時間だけスレッドを眠らせ、起きたら再び `poll` します。締切を過ぎたら、`Err(())` を返します。

## コード

```rust:line-numbers=73
    pub(crate) fn block_on_timeout<F>(&mut self, f: F, timeout: Duration) -> Result<F::Output, ()>
    where
        F: std::future::Future,
    {
        use crate::runtime::park::CachedParkThread;
        use std::task::Context;
        use std::task::Poll::Ready;
        use std::time::Instant;

        let mut park = CachedParkThread::new();
        let waker = park.waker().map_err(|_| ())?;
        let mut cx = Context::from_waker(&waker);

        pin!(f);
        let when = Instant::now().checked_add(timeout);

        loop {
            if let Ready(v) = crate::task::coop::budget(|| f.as_mut().poll(&mut cx)) {
                return Ok(v);
            }

            let now = Instant::now();

            if let Some(when) = when {
                if now >= when {
                    return Err(());
                }

                park.park_timeout(when - now);
            } else {
                park.park();
            }
        }
    }
```

## 前提知識

- **`Future` と `poll`**: 非同期の処理を表す型と、その処理を少しずつ進める呼び出しです。終われば `Ready(値)`、まだなら `Pending` を返します。
- **`Context` と waker**: `Future` が「再び `poll` してほしい」と知らせるための道具です。`CachedParkThread` の waker を使うと、スレッドを起こせるようになります。
- **`CachedParkThread`**: 現在のスレッドを眠らせたり（park）、起こしたり（unpark）する仕組みを、tokio の内部で扱いやすくした型です。
- **`coop::budget`**: tokio が、1 回の `poll` で使ってよい作業量を制限する仕組みです。長く動きすぎる処理が、ほかの処理を止めないようにします。
- **`Instant::checked_add`**: 時刻に時間を足すときに、溢れなければ `Some`、溢れたら `None` を返す操作です。

## 何をしているか

### 1. 準備をする

```rust:line-numbers=82
        let mut park = CachedParkThread::new();
        let waker = park.waker().map_err(|_| ())?;
        let mut cx = Context::from_waker(&waker);

        pin!(f);
        let when = Instant::now().checked_add(timeout);
```

スレッドを眠らせる道具を作り、その waker から `Context` を作ります。`pin!` で `f` を固定します。締切の時刻は `checked_add` で求め、溢れたら `None` として「締切なし」にします。

### 2. 完了していれば結果を返す

```rust:line-numbers=89
        loop {
            if let Ready(v) = crate::task::coop::budget(|| f.as_mut().poll(&mut cx)) {
                return Ok(v);
            }
```

`budget` の中で `poll` を呼びます。結果が `Ready` なら、その値を `Ok` で包んで返します。

### 3. 締切を過ぎていたら失敗する

```rust:line-numbers=94
            let now = Instant::now();

            if let Some(when) = when {
                if now >= when {
                    return Err(());
                }
```

まだ完了していなければ、今の時刻を取り、締切を過ぎていれば `Err(())` を返します。

### 4. 残り時間だけ眠る

```rust:line-numbers=101
                park.park_timeout(when - now);
            } else {
                park.park();
            }
```

締切があれば、残り時間だけ `park_timeout` で眠ります。締切がなければ、`park` で起こされるまで眠ります。起きたら、ループの先頭に戻り、もう一度 `poll` します。

## ここがすごい

- **無駄に回さない**: 完了していない間は、眠ってから再び `poll` します。スレッドを使い続けて空回りすることがありません。
- **締切を一度だけ計算する**: 締切の時刻を最初に求めて、以降は残り時間だけを計算します。ループの中で時刻の計算がずれることを防げます。
- **溢れを `Option` で表す**: 巨大な時間が指定されても、`checked_add` で溢れを検出し、「締切なし」として扱います。
- **作業量の制限を通す**: `budget` の中で `poll` することで、長く続く処理もほかの作業に譲れるようになります。

## まとめ

- 待ち合わせの処理は、「確かめる、眠る、起きて確かめる」という一つのループで書けます。
- 締切は最初に一度だけ決めると、待ちの途中でずれません。
- 時間の計算は、溢れを `Option` で扱うと、極端な入力にも安全に対応できます。
