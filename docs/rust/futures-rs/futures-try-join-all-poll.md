---
title: 1 つでも失敗したら、残りの待ちを捨てて終わる
description: futures の try_join_all の poll。全部の Future を順に進め、エラーが出た時点で残りを捨てて結果を返す。小さい数は配列で、大きい数は別の仕組みで扱う。
language: rust
project: futures-rs
repo: https://github.com/rust-lang/futures-rs
license: MIT OR Apache-2.0
copyright: Copyright (c) 2016 Alex Crichton, Copyright (c) 2017 The Tokio Authors
commit: "5bb0eb2f9e408a20d31e204a15b73014fa203e2c"
file: futures-util/src/future/try_join_all.rs
lines: [156, 190]
function: TryJoinAll::poll
difficulty: 3
format: 2
tags: [非同期, エラー処理, アルゴリズム]
---

## ひとことで

`poll` は、`try_join_all` が返す Future を進める関数です。複数の非同期処理を同時に進め、**全部が成功したら結果を並べて返し、途中で 1 つでも失敗したら、その時点で残りを捨てて失敗を返します**。

処理の数が少ないときは、配列の中で全員を順に `poll` します。処理の数が多いときは、別の仕組み（`FuturesOrdered` を集める `TryCollect`）に任せます。どちらも、外からは同じ動きに見えます。

## コード

```rust:line-numbers=156
    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        match &mut self.kind {
            TryJoinAllKind::Small { elems } => {
                let mut state = FinalState::AllDone;

                for elem in join_all::iter_pin_mut(elems.as_mut()) {
                    match elem.try_poll(cx) {
                        Poll::Pending => state = FinalState::Pending,
                        Poll::Ready(Ok(())) => {}
                        Poll::Ready(Err(e)) => {
                            state = FinalState::Error(e);
                            break;
                        }
                    }
                }

                match state {
                    FinalState::Pending => Poll::Pending,
                    FinalState::AllDone => {
                        let mut elems = mem::replace(elems, Box::pin([]));
                        let results = join_all::iter_pin_mut(elems.as_mut())
                            .map(|e| e.take_output().unwrap())
                            .collect();
                        Poll::Ready(Ok(results))
                    }
                    FinalState::Error(e) => {
                        let _ = mem::replace(elems, Box::pin([]));
                        Poll::Ready(Err(e))
                    }
                }
            }
            #[cfg(target_has_atomic = "ptr")]
            TryJoinAllKind::Big { fut } => Pin::new(fut).poll(cx),
        }
    }
```

この関数は `TryJoinAll` の `Future` の実装です。`Pin` で固定された自分自身の中の `kind` によって、小さい場合と大きい場合で処理が分かれます。

## 前提知識

- **`Future` と `poll`**: 非同期の処理を表す型と、その進みを確かめる関数です。`Pending` は「まだ」、`Ready` は「終わった」を表します。
- **`try_` の意味**: 結果が `Result` で、失敗（`Err`）があり得るという意味です。失敗が 1 つでも出れば、全体の失敗になります。
- **`FinalState`**: 今回の `poll` が、全部完了・保留・エラーのどれで終わったかを表す内部の型です。
- **`mem::replace`**: 値を別の値に入れ替えて、古い値を返します。ここでは、終わった要素の箱を空にします。
- **`take_output`**: 完了した Future から結果を取り出します。

## 何をしているか

### 1. 全員を順に進める

```rust:line-numbers=158
            TryJoinAllKind::Small { elems } => {
                let mut state = FinalState::AllDone;

                for elem in join_all::iter_pin_mut(elems.as_mut()) {
                    match elem.try_poll(cx) {
                        Poll::Pending => state = FinalState::Pending,
                        Poll::Ready(Ok(())) => {}
                        Poll::Ready(Err(e)) => {
                            state = FinalState::Error(e);
                            break;
                        }
                    }
                }
```

配列の各要素を `try_poll` で進めます。保留があれば状態を `Pending` にして続けます。エラーが出たら、そのエラーを記録して、ループを抜けます。残りの要素は、ここでは進めません。

### 2. 結果に応じて分ける

```rust:line-numbers=172
                match state {
                    FinalState::Pending => Poll::Pending,
                    FinalState::AllDone => {
                        let mut elems = mem::replace(elems, Box::pin([]));
                        let results = join_all::iter_pin_mut(elems.as_mut())
                            .map(|e| e.take_output().unwrap())
                            .collect();
                        Poll::Ready(Ok(results))
                    }
```

保留なら `Pending` を返します。全部完了なら、各要素から結果を取り出して、並べたベクタを `Ready(Ok)` で返します。

### 3. エラーなら残りを捨てる

```rust:line-numbers=181
                    FinalState::Error(e) => {
                        let _ = mem::replace(elems, Box::pin([]));
                        Poll::Ready(Err(e))
                    }
```

エラーなら、配列を空に置き換えて、残りの要素を破棄します。そのうえで、最初のエラーを `Ready(Err)` で返します。

### 4. 大きい場合は別の仕組みに任せる

```rust:line-numbers=187
            #[cfg(target_has_atomic = "ptr")]
            TryJoinAllKind::Big { fut } => Pin::new(fut).poll(cx),
```

要素の数が多い場合は、`fut` に保たれた `TryCollect` を進めます。その中身は `FuturesOrdered` で、完了した順ではなく、元の順番で結果を集めます。エラーの扱いは、`Pin::new(fut).poll` の結果として、同じように外へ伝わります。

## ここがすごい

- **エラーで早く終わる**: 1 つでも失敗すれば、残りの待ちを続けません。無駄な処理を避けられます。
- **残りを確実に捨てる**: 失敗したときは配列を空にするので、捨てられる処理が後で進むことはありません。
- **数に応じた仕組み**: 少ない数では単純な配列、多い数では順序を保つ仕組み、と使い分けています。外からは同じに見えます。

## まとめ

- 全員を順に進め、途中で失敗したら残りを捨てて失敗を返す。
- 全部完了したら、結果を元の順序で並べて返す。
- 数が多い場合は、別の仕組みに任せて扱う。
