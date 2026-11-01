---
title: スリープの締切時刻を後から変える
description: tokio の Sleep::reset。締切時刻を書き換え、既存のタイマーがあれば再設定し、なければ新しく作って登録する。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/time/sleep.rs
lines: [336, 372]
function: reset
difficulty: 2
format: 2
tags: [非同期, 状態機械]
---

## ひとことで

`Sleep::reset` は、`tokio::time::sleep` で作ったスリープの **締切時刻（deadline）** を、後から別の時刻に変える関数です。待っている途中でも、新しい締切に合わせて待ち時間を組み直せます。

関数の中では、締切をタイマーが使う内部の単位（ティック）に変換します。そして、既存のタイマーがあればその締切を書き換え、なければ新しいタイマーを作って登録します。

## コード

```rust:line-numbers=336
    pub fn reset(self: Pin<&mut Self>, deadline: Instant) {
        let mut this = self.project();
        *this.deadline = deadline;

        let handle = this.driver;
        let time_source = handle.driver().time().time_source();
        let deadline = time_source.deadline_to_tick(deadline);

        #[cfg(all(tokio_unstable, feature = "tracing"))]
        {
            let _resource_enter = this.inner.ctx.resource_span.enter();
            this.inner.ctx.async_op_span =
                tracing::trace_span!("runtime.resource.async_op", source = "Sleep::reset");
            let _async_op_enter = this.inner.ctx.async_op_span.enter();

            this.inner.ctx.async_op_poll_span =
                tracing::trace_span!("runtime.resource.async_op.poll");

            let clock = handle.driver().clock();
            let now = time_source.now(clock);
            tracing::trace!(
                target: "runtime::resource::state_update",
                duration = deadline.saturating_sub(now),
                duration.unit = "ms",
                duration.op = "override",
            );
        }

        match this.timer.as_mut().as_pin_mut() {
            Some(timer) => timer.reset(handle.clone(), deadline),
            None => {
                let timer = Timer::new(handle.clone(), deadline);
                this.timer.set(Some(timer));
                this.timer.as_pin_mut().unwrap().init(deadline);
            }
        }
    }
```

## 前提知識

- **`Future`（将来の値）**: 非同期処理の「まだ終わっていない仕事」を表す型です。`Sleep` も `Future` の 1 つで、締切になると完了します。
- **`Pin<&mut Self>`**: 非同期の型を、メモリ上の場所を動かさない形で扱うための参照です。内部の値を書き換えるには、`project()` で各フィールドを取り出します。
- **`deadline`**: 締切の時刻です。`Instant`（単調に進む時刻）として扱われます。
- **ティック**: タイマーが内部で使う時間の単位です。`deadline_to_tick` で、時刻をティックの値に変換します。
- **`tracing`**: 処理の開始や終了を記録するための crate です。`tokio_unstable` と `tracing` の両方が有効なときだけ、トレースのコードが動きます。

## 何をしているか

### 1. 締切時刻を保存し直す

```rust:line-numbers=337
        let mut this = self.project();
        *this.deadline = deadline;

        let handle = this.driver;
        let time_source = handle.driver().time().time_source();
        let deadline = time_source.deadline_to_tick(deadline);
```

`this.deadline` に新しい締切を入れます。次に、時刻ドライバのハンドルとタイムソースを取り出し、締切をティックに変換します。以降の処理は、この変換後の値を使います。

### 2. トレースを記録する

```rust:line-numbers=344
        #[cfg(all(tokio_unstable, feature = "tracing"))]
        {
            let _resource_enter = this.inner.ctx.resource_span.enter();
            this.inner.ctx.async_op_span =
                tracing::trace_span!("runtime.resource.async_op", source = "Sleep::reset");
            let _async_op_enter = this.inner.ctx.async_op_span.enter();

            this.inner.ctx.async_op_poll_span =
                tracing::trace_span!("runtime.resource.async_op.poll");

            let clock = handle.driver().clock();
            let now = time_source.now(clock);
            tracing::trace!(
                target: "runtime::resource::state_update",
                duration = deadline.saturating_sub(now),
                duration.unit = "ms",
                duration.op = "override",
            );
        }
```

トレースが有効なときは、`reset` の操作を記録します。残りの待ち時間が `duration` として出力されるので、締切を変えた影響を後から追えます。このブロックは、トレースを使わないビルドでは丸ごと含まれません。

### 3. タイマーを再設定するか、作り直す

```rust:line-numbers=364
        match this.timer.as_mut().as_pin_mut() {
            Some(timer) => timer.reset(handle.clone(), deadline),
            None => {
                let timer = Timer::new(handle.clone(), deadline);
                this.timer.set(Some(timer));
                this.timer.as_pin_mut().unwrap().init(deadline);
            }
        }
```

`this.timer` に既存のタイマーがあれば、その締切だけを `reset` で書き換えます。まだタイマーがない場合は、`Timer::new` で作って `set` し、`init` で初期化します。`Option` の `None` の分岐が、この「まだない」を受け持っています。

## ここがすごい

- **同じ `Sleep` を使い回せる**: 締切を変えるたびに新しい `Sleep` を作る必要がありません。タイムアウトを延ばすような処理が、短く書けます。
- **両方の場合を明示する**: 既存のタイマーがある場合と、ない場合を `match` で並べているので、どちらの扱いも一目で分かります。
- **変換をタイムソースに任せる**: 時刻からティックへの変換を `time_source` が担当するので、この関数は時計の仕組みを知らなくても動きます。
- **観測用のコードを分ける**: トレースの処理は `cfg` で囲まれているので、本体の処理の読みやすさを損ないません。

## まとめ

- 待ち時間を後から変えるには、タイマーの締切だけを書き換えるのが効率的です。
- 「ある場合」と「ない場合」を `match` で分けると、分岐の抜けを防げます。
- 観測用のコードを `cfg` で分けると、本体の処理を読みやすく保てます。
