---
title: 一度だけ初期化する処理を、状態の切り替えで協調させる
description: once_cell の初期化関数。値が未設定なら 1 つのスレッドが初期化を行い、他のスレッドは待つ。状態をポインタの下位ビットに詰めて、ロックなしで切り替える。
language: rust
project: once_cell
repo: https://github.com/matklad/once_cell
license: MIT OR Apache-2.0
copyright: Copyright (c) Aleksey Kladov (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "80fe900b21f6d76c1a2ed74d3343e8a3a88c46d0"
file: src/imp_std.rs
lines: [177, 208]
function: initialize_or_wait
difficulty: 3
format: 2
tags: [並行処理, 状態機械, ロック不要]
---

## ひとことで

`initialize_or_wait` は、`OnceCell` の値を **1 回だけ** 作るための中心的な関数です。複数のスレッドが同時に初期化を試みても、実際に初期化を行うのは 1 つのスレッドだけにします。ほかのスレッドは、初期化が終わるまで待ちます。

ロック（ミューテックス）を使わず、`AtomicPtr` という 1 語の原子的なポインタに **状態** と **待機中の人の列** をまとめて入れています。状態は、ポインタの下位ビットにある 2 ビットで表されます。

## コード

```rust:line-numbers=177
fn initialize_or_wait(queue: &AtomicPtr<Waiter>, mut init: Option<&mut dyn FnMut() -> bool>) {
    let mut curr_queue = queue.load(Ordering::Acquire);

    loop {
        let curr_state = strict::addr(curr_queue) & STATE_MASK;
        match (curr_state, &mut init) {
            (COMPLETE, _) => return,
            (INCOMPLETE, Some(init)) => {
                let exchange = queue.compare_exchange(
                    curr_queue,
                    strict::map_addr(curr_queue, |q| (q & !STATE_MASK) | RUNNING),
                    Ordering::Acquire,
                    Ordering::Acquire,
                );
                if let Err(new_queue) = exchange {
                    curr_queue = new_queue;
                    continue;
                }
                let mut guard = Guard { queue, new_queue: INCOMPLETE_PTR };
                if init() {
                    guard.new_queue = COMPLETE_PTR;
                }
                return;
            }
            (INCOMPLETE, None) | (RUNNING, _) => {
                wait(queue, curr_queue);
                curr_queue = queue.load(Ordering::Acquire);
            }
            _ => debug_assert!(false),
        }
    }
}
```

この関数は、`OnceCell::initialize` や `OnceCell::wait` から呼ばれます。引数の `init` が `Some` のときは「自分が初期化を担当してよい」という意味で、`None` のときは「待つだけでよい」という意味になります。

## 前提知識

- **`OnceCell<T>`**: 一度だけ値を書き込める箱です。書き込み後は読み取り専用になるので、共有しても安全です。
- **原子的操作（アトミック）**: 複数のスレッドから同時に読んだり書いたりしても、途中の状態を見られない操作です。`AtomicPtr` は、ポインタを原子的に扱う型です。
- **`compare_exchange`**: 「今の値が期待どおりなら、新しい値に置き換える」という原子的な操作です。失敗したら、その時点の値が返ります。
- **ポインタの下位ビット**: メモリ上の値は、通常 2 の倍数や 4 の倍数の位置に置かれます。そのため、アドレスの下位ビットは空いていて、小さな情報を隠すのに使えます。
- **状態（`INCOMPLETE`・`RUNNING`・`COMPLETE`）**: 初期化の進み具合を表す 3 つの値です。`INCOMPLETE` は未初期化、`RUNNING` は初期化中、`COMPLETE` は完了を表します。

## 何をしているか

### 1. 現在の状態を読み取る

```rust:line-numbers=178
    let mut curr_queue = queue.load(Ordering::Acquire);

    loop {
        let curr_state = strict::addr(curr_queue) & STATE_MASK;
```

`queue` から現在のポインタを読み、下位ビットを取り出して状態を調べます。`strict::addr` は、ポインタを整数として安全に取り出すための補助関数です。

### 2. 完了していれば、すぐに返る

```rust:line-numbers=183
            (COMPLETE, _) => return,
```

すでに `COMPLETE` なら、初期化は済んでいます。何もせずに戻ります。

### 3. 未初期化なら、自分が初期化を担当する

```rust:line-numbers=184
            (INCOMPLETE, Some(init)) => {
                let exchange = queue.compare_exchange(
                    curr_queue,
                    strict::map_addr(curr_queue, |q| (q & !STATE_MASK) | RUNNING),
                    Ordering::Acquire,
                    Ordering::Acquire,
                );
                if let Err(new_queue) = exchange {
                    curr_queue = new_queue;
                    continue;
                }
```

`INCOMPLETE` かつ `init` が `Some` のときは、`compare_exchange` で状態を `RUNNING` に書き換えます。成功したスレッドだけが、この先の `init()` を呼べます。失敗したら、別のスレッドが先に動いた証拠なので、新しい値を読み直して最初からやり直します。

### 4. 初期化の結果を記録する

```rust:line-numbers=195
                let mut guard = Guard { queue, new_queue: INCOMPLETE_PTR };
                if init() {
                    guard.new_queue = COMPLETE_PTR;
                }
                return;
```

`Guard` は、関数を抜けるときに状態を書き戻すための後片付け係です。`init()` が成功すれば `COMPLETE`、失敗すれば `INCOMPLETE` に戻します。失敗時に `RUNNING` のまま残ると、他のスレッドが永久に待つことになるので、この仕組みが重要です。

### 5. 待つ

```rust:line-numbers=201
            (INCOMPLETE, None) | (RUNNING, _) => {
                wait(queue, curr_queue);
                curr_queue = queue.load(Ordering::Acquire);
            }
```

`RUNNING` のときや、`init` が `None` のときは `wait` で眠りにつきます。起きたら `queue` を読み直して、もう一度状態を確かめます。

## ここがすごい

- **ロックを使わない協調**: 1 つの原子的なポインタに、状態と待機者の列をまとめています。ミューテックスを取る必要がないので、初期化が済んだあとの読み取りはとても軽くなります。
- **パニックへの備え**: 初期化処理がパニックしても、`Guard` の `drop` が状態を `INCOMPLETE` に戻します。次に来たスレッドが、もう一度初期化を試せます。
- **失敗を値として扱える**: 初期化処理は `bool` を返し、失敗しても状態を戻すだけです。エラーの型は呼び出し側の `OnceCell::initialize` で扱われます。

## まとめ

- 複数のスレッドが同時に初期化を試みても、担当は 1 つだけに絞られる。
- 状態は原子的なポインタの下位ビットに隠し、ロックなしで切り替える。
- 後片付けを `Guard` の `drop` に任せると、パニックや失敗でも状態が壊れない。
