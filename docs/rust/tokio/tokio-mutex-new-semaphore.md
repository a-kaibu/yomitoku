---
title: Mutex の中身と許可証 1 枚を用意する
description: tokio の Mutex::new。値を UnsafeCell に入れ、許可証が 1 枚の Semaphore で排他を表す。トレースが有効なら、呼び出し元の場所も記録する。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/sync/mutex.rs
lines: [338, 375]
function: new
difficulty: 2
format: 2
tags: [並行処理, 非同期]
---

## ひとことで

`Mutex::new` は、tokio の非同期 `Mutex`（排他ロック）を作る関数です。この関数は、保護したい値を受け取って、その値を入れる箱と、ロックを管理する仕組みを一緒に用意します。

ロックの管理には、`Semaphore`（許可証を数える仕組み）を使います。許可証が 1 枚だけの `Semaphore` を作るので、同時に 1 つのタスクだけが値へ触れられます。

## コード

```rust:line-numbers=338
    pub fn new(t: T) -> Self
    where
        T: Sized,
    {
        #[cfg(all(tokio_unstable, feature = "tracing"))]
        let resource_span = {
            let location = std::panic::Location::caller();

            tracing::trace_span!(
                parent: None,
                "runtime.resource",
                concrete_type = "Mutex",
                kind = "Sync",
                loc.file = location.file(),
                loc.line = location.line(),
                loc.col = location.column(),
            )
        };

        #[cfg(all(tokio_unstable, feature = "tracing"))]
        let s = resource_span.in_scope(|| {
            tracing::trace!(
                target: "runtime::resource::state_update",
                locked = false,
            );
            semaphore::Semaphore::new(1)
        });

        #[cfg(any(not(tokio_unstable), not(feature = "tracing")))]
        let s = semaphore::Semaphore::new(1);

        Self {
            c: UnsafeCell::new(t),
            s,
            #[cfg(all(tokio_unstable, feature = "tracing"))]
            resource_span,
        }
    }
```

## 前提知識

- **`Mutex`（排他ロック）**: 複数のタスクが同じ値を同時に書き換えないようにする仕組みです。ロックを取った人だけが値を使えます。
- **非同期の `Mutex`**: tokio の `Mutex` は、ロックの待ちがスレッドを止めず、タスクを待たせる形で動きます。ロックを待つ間、ほかのタスクを進められます。
- **`Semaphore`**: 許可証（permit）の数だけ、同時に処理を進められる仕組みです。許可証が 1 枚なら、排他ロックと同じ意味になります。
- **`UnsafeCell<T>`**: 中の値を、借用のルールを外して書き換えられるようにする型です。排他の守りを `Semaphore` に任せるため、ここで使われています。
- **`#[track_caller]` と `Location::caller()`**: 関数を呼び出した場所を取り出す仕組みです。デバッグ用の情報として使えます。

## 何をしているか

### 1. 呼び出し元の場所を記録する

```rust:line-numbers=342
        #[cfg(all(tokio_unstable, feature = "tracing"))]
        let resource_span = {
            let location = std::panic::Location::caller();

            tracing::trace_span!(
                parent: None,
                "runtime.resource",
                concrete_type = "Mutex",
                kind = "Sync",
                loc.file = location.file(),
                loc.line = location.line(),
                loc.col = location.column(),
            )
        };
```

トレースが有効なときだけ、`Mutex::new` を呼んだ場所を取り出します。`new` には `#[track_caller]` が付いているので、`Location::caller()` は、この関数を呼んだ利用者のコードの場所を返します。その場所を、リソースのトレース情報に入れます。

### 2. 許可証 1 枚の Semaphore を作る

```rust:line-numbers=357
        #[cfg(all(tokio_unstable, feature = "tracing"))]
        let s = resource_span.in_scope(|| {
            tracing::trace!(
                target: "runtime::resource::state_update",
                locked = false,
            );
            semaphore::Semaphore::new(1)
        });

        #[cfg(any(not(tokio_unstable), not(feature = "tracing")))]
        let s = semaphore::Semaphore::new(1);
```

トレースが有効なら、作成時の状態をトレースに記録しながら `Semaphore::new(1)` を作ります。トレースが無効なら、同じ `Semaphore::new(1)` だけを作ります。`cfg` によって、どちらの版が使われるかが決まります。

### 3. 値と許可証をまとめて返す

```rust:line-numbers=369
        Self {
            c: UnsafeCell::new(t),
            s,
            #[cfg(all(tokio_unstable, feature = "tracing"))]
            resource_span,
        }
```

`UnsafeCell::new(t)` で値を箱に入れ、`s` と一緒に `Self` を作って返します。トレース用の `resource_span` は、トレースが有効なときだけ構造体に含まれます。

## ここがすごい

- **排他の管理を 1 つの仕組みに任せる**: 値を直接守るのではなく、「許可証は 1 枚」という単純な規則で排他を表しています。ロックの取得と解放のルールを、`Semaphore` に集約しています。
- **デバッグの情報を後から使える**: `#[track_caller]` によって、どこで作られた `Mutex` かが記録されるので、問題を追いかけやすくなります。
- **機能の有無で構造を変えない**: トレースの有無で、関数の戻り値の型は変わりません。`cfg` で中身だけを切り替えるので、利用する側は同じように書けます。
- **値の型の制約が最小**: `where T: Sized` の条件だけで作れるので、どんな型でも保護できます。

## まとめ

- 排他ロックは、「許可証の数」として表すと、規則が簡潔になります。
- 呼び出し元の場所を記録する `#[track_caller]` は、デバッグで役立つ仕組みです。
- 機能の有無は `cfg` で切り替えると、利用する側のコードを変えずに済みます。
