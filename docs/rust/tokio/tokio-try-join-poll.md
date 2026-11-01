---
title: 3 つの Future を同時に進め、エラーで早めに止める
description: tokio の try_join の poll。3 つの Future を毎回順に poll し、1 つでもエラーが出た時点で結果を返し、全部が成功したら値の組を返す。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/future/try_join.rs
lines: [49, 81]
function: poll
difficulty: 2
format: 2
tags: [非同期, エラー処理]
---

## ひとことで

この `poll` は、tokio の `try_join!` が作る 3 つの Future を、**同時に進めて、全部の結果をまとめて受け取る** ための処理です。`try_join!` は、いずれかの Future がエラーを返したら、残りを待たずに、そのエラーを返します。

Rust の Future は、`poll` が呼ばれるたびに少しずつ進みます。この関数は、3 つの Future をどれも止めないように、毎回すべてを `poll` します。終わったものの結果は取り出して保存し、全部が終わったときに、値の組としてまとめて返します。

## コード

```rust:line-numbers=49
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let mut all_done = true;

        let mut me = self.project();

        if me.future1.as_mut().poll(cx).is_pending() {
            all_done = false;
        } else if me.future1.as_mut().output_mut().unwrap().is_err() {
            return Poll::Ready(Err(me.future1.take_output().unwrap().err().unwrap()));
        }

        if me.future2.as_mut().poll(cx).is_pending() {
            all_done = false;
        } else if me.future2.as_mut().output_mut().unwrap().is_err() {
            return Poll::Ready(Err(me.future2.take_output().unwrap().err().unwrap()));
        }

        if me.future3.as_mut().poll(cx).is_pending() {
            all_done = false;
        } else if me.future3.as_mut().output_mut().unwrap().is_err() {
            return Poll::Ready(Err(me.future3.take_output().unwrap().err().unwrap()));
        }

        if all_done {
            Poll::Ready(Ok((
                me.future1.take_output().unwrap().ok().unwrap(),
                me.future2.take_output().unwrap().ok().unwrap(),
                me.future3.take_output().unwrap().ok().unwrap(),
            )))
        } else {
            Poll::Pending
        }
    }
```

## 前提知識

- **`Future`**: まだ終わっていない非同期の処理を表す型です。`poll` を呼ぶと、進められるところまで進み、終わっていれば `Ready`、終わっていなければ `Pending` を返します。
- **`Poll`**: `Ready(値)` か `Pending` のどちらかを表す型です。
- **`Pin` と `project()`**: 非同期の型を、メモリ上の位置を動かさない形で扱う仕組みです。`project()` で、各フィールドを安全に取り出します。
- **`MaybeDone`**: 「まだ進行中の Future」か「終わった結果」のどちらかを保持する型です。結果は一度だけ取り出せます。
- **`Context` と waker**: Future が「そろそろ再度 poll してほしい」と通知するための仕組みです。この関数は、`cx` を 3 つの Future にそのまま渡します。

## 何をしているか

### 1. 1 つ目の Future を進める

```rust:line-numbers=50
        let mut all_done = true;

        let mut me = self.project();

        if me.future1.as_mut().poll(cx).is_pending() {
            all_done = false;
        } else if me.future1.as_mut().output_mut().unwrap().is_err() {
            return Poll::Ready(Err(me.future1.take_output().unwrap().err().unwrap()));
        }
```

1 つ目を `poll` します。まだ `Pending` なら、全体も未完了として `all_done` を偽にします。終わっていてエラーなら、その結果を取り出して、すぐに `Ready(Err(...))` を返します。残りの Future は、もう待ちません。

### 2. 2 つ目の Future を進める

```rust:line-numbers=60
        if me.future2.as_mut().poll(cx).is_pending() {
            all_done = false;
        } else if me.future2.as_mut().output_mut().unwrap().is_err() {
            return Poll::Ready(Err(me.future2.take_output().unwrap().err().unwrap()));
        }
```

2 つ目も同じ手順です。1 つ目が成功していても、ここで続けて `poll` されます。

### 3. 3 つ目の Future を進める

```rust:line-numbers=66
        if me.future3.as_mut().poll(cx).is_pending() {
            all_done = false;
        } else if me.future3.as_mut().output_mut().unwrap().is_err() {
            return Poll::Ready(Err(me.future3.take_output().unwrap().err().unwrap()));
        }
```

3 つ目も同じです。同じ手順を繰り返すことで、どれか 1 つが後で失敗しても、早く気づけます。

### 4. 全部終わったら、まとめて返す

```rust:line-numbers=72
        if all_done {
            Poll::Ready(Ok((
                me.future1.take_output().unwrap().ok().unwrap(),
                me.future2.take_output().unwrap().ok().unwrap(),
                me.future3.take_output().unwrap().ok().unwrap(),
            )))
        } else {
            Poll::Pending
        }
```

`all_done` が真なら、3 つの結果をすべて取り出し、`Ok` の組にして返します。まだ 1 つでも未完了なら、`Pending` を返します。

## ここがすごい

- **止まらずに同時に進める**: 1 つが `Pending` でも、残りを `poll` し続けます。待ちの時間が重なり、全体の待ち時間を短くできます。
- **エラーで早く抜ける**: 失敗が分かった時点で、残りの結果を待たずに返します。無駄な処理を続けずに済みます。
- **結果を一度だけ取り出す**: `take_output` は、結果を取り出すと中身を空にします。同じ結果を二重に使う事故を、型と処理の組み合わせで防いでいます。
- **同じ形を並べる**: 3 つの Future に同じ手順を書いているので、読んだ人がどの部分も同じ仕組みだと理解できます。

## まとめ

- 複数の非同期処理を同時に進めるには、毎回すべてを `poll` して、終わった結果を保存する形が基本です。
- エラーがあれば早めに返すと、無駄な待ちを減らせます。
- 結果を一度だけ取り出す仕組みにすると、値の二重利用を防げます。
