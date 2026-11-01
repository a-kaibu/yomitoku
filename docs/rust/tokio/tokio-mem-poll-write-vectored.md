---
title: メモリ上のパイプへ、空きの分だけ書き込む
description: tokio の duplex のメモリ内バッファへの書き込み。閉じていれば壊れたパイプとして扱い、空きがなければ書き手を待たせ、空きの分だけ複数のバッファから書き込む。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/io/util/mem.rs
lines: [361, 393]
function: poll_write_vectored_internal
difficulty: 2
format: 2
tags: [非同期, 入出力, 並行処理]
---

## ひとことで

`poll_write_vectored_internal` は、tokio の `duplex`（メモリ上で向かい合った 2 つの端をつなぐ仕組み）の **書き込み側** の処理です。ファイルやネットワークを使わずに、メモリの中の小さなパイプへデータを書きます。

書き込みは、3 つの状態で扱いが変わります。相手が閉じていれば「壊れたパイプ」として失敗します。書く量がなければ 0 を返します。バッファに空きがなければ、書き手を待たせます。空きがあれば、その分だけ書き込みます。

## コード

```rust:line-numbers=361
    fn poll_write_vectored_internal(
        mut self: Pin<&mut Self>,
        cx: &mut task::Context<'_>,
        bufs: &[std::io::IoSlice<'_>],
        wakers: &mut Wakers,
    ) -> Poll<Result<usize, std::io::Error>> {
        if self.is_closed {
            return Poll::Ready(Err(std::io::ErrorKind::BrokenPipe.into()));
        }
        if bufs.iter().all(|buf| buf.is_empty()) {
            return Poll::Ready(Ok(0));
        }

        let avail = self.max_buf_size - self.buffer.len();
        if avail == 0 {
            wakers.replaced = self.write_waker.replace(cx.waker().clone());
            return Poll::Pending;
        }

        let mut rem = avail;
        for buf in bufs {
            if rem == 0 {
                break;
            }

            let len = buf.len().min(rem);
            self.buffer.extend_from_slice(&buf[..len]);
            rem -= len;
        }

        wakers.wake = self.read_waker.take();
        Poll::Ready(Ok(avail - rem))
    }
```

## 前提知識

- **`duplex`**: tokio がテスト用などに用意する、メモリ上の双方向のパイプです。片方に書いたデータが、もう片方から読めます。
- **`IoSlice`（分散書き込みの断片）**: 複数の小さなバッファを、まとめて書くために渡す型です。`vectored` は、その形で書くことを表します。
- **`BrokenPipe`**: 相手が既に閉じていることを表すエラーの種類です。
- **`Waker`**: 非同期の処理に「再度 poll してほしい」と伝えるための仕組みです。書き手や読み手が待つときに使います。
- **`Pending`**: まだ処理が終わらず、後で再度 `poll` される必要があることを表します。

## 何をしているか

### 1. 閉じていたら失敗する

```rust:line-numbers=367
        if self.is_closed {
            return Poll::Ready(Err(std::io::ErrorKind::BrokenPipe.into()));
        }
        if bufs.iter().all(|buf| buf.is_empty()) {
            return Poll::Ready(Ok(0));
        }
```

相手が閉じていれば、`BrokenPipe` のエラーを返します。書くべきデータがすべて空なら、0 バイト書いたことにして `Ready(Ok(0))` を返します。

### 2. 空きがなければ、書き手を待たせる

```rust:line-numbers=374
        let avail = self.max_buf_size - self.buffer.len();
        if avail == 0 {
            wakers.replaced = self.write_waker.replace(cx.waker().clone());
            return Poll::Pending;
        }
```

書き込める空き容量 `avail` を求めます。空きが 0 なら、書き手の `waker` を登録して `Pending` を返します。読み手がデータを読んで空きができたら、この `waker` で起こされます。

### 3. 空きの分だけ書き込む

```rust:line-numbers=380
        let mut rem = avail;
        for buf in bufs {
            if rem == 0 {
                break;
            }

            let len = buf.len().min(rem);
            self.buffer.extend_from_slice(&buf[..len]);
            rem -= len;
        }
```

残りの空き容量 `rem` を、バッファの前から順に使います。各バッファの長さと `rem` の小さいほうだけを、内部のバッファへ `extend_from_slice` でコピーします。空きがなくなったら、そこで止めます。

### 4. 読み手を起こす準備をして、書いた量を返す

```rust:line-numbers=391
        wakers.wake = self.read_waker.take();
        Poll::Ready(Ok(avail - rem))
```

読み手の `waker` を `wakers` に移しておき、呼び出し側があとでまとめて起こします。最後に、実際に書いた量 `avail - rem` を返します。

## ここがすごい

- **状態ごとに扱いを変える**: 閉じた・空の・空きがない・書ける、の 4 つの状態を、順番に確かめて扱います。どの状態かが、読めばすぐ分かります。
- **書ける分だけ書く**: 全部入らなくても、入る分だけ書いて量を返します。非同期の書き込みでは、この「部分的に書く」という約束が大事です。
- **`waker` の登録と通知**: 書き手が待つときに `waker` を登録し、読み手が空きを作ったときに通知します。待ちと再開の仕組みが一対になっています。
- **通知をまとめて行う**: `wakers` に通知の対象を移しておき、起こすのを後回しにします。ロックを持ったまま起こす処理を避けられます。

## まとめ

- 非同期の書き込みは、閉じた・空きがない・部分的に書けるの 3 つの場合を分けて考えると、整理しやすくなります。
- 待ちの処理は、登録と通知をセットで設計すると、起こし忘れを防げます。
- 通知は、状態を書き換えた後にまとめて行うと、競合を減らせます。
