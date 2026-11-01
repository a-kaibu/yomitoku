---
title: 1 バイトの状態と、アドレスを鍵にした待機
description: once_cell の parking_lot 版の初期化。状態を 1 バイトの原子変数で持ち、待つスレッドは変数のアドレスを鍵にして park する。compare_exchange で担当を 1 人に決める。
language: rust
project: once_cell
repo: https://github.com/matklad/once_cell
license: MIT OR Apache-2.0
copyright: Copyright (c) Aleksey Kladov (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "80fe900b21f6d76c1a2ed74d3343e8a3a88c46d0"
file: src/imp_pl.rs
lines: [141, 169]
function: initialize_inner
difficulty: 3
format: 2
tags: [並行処理, 状態機械, ロック不要]
---

## ひとことで

`initialize_inner` は、`OnceCell` の値を **1 回だけ** 初期化する処理の、parking_lot 版です。前に読んだ `imp_std` 版は、ポインタに状態と待機の列をまとめていました。こちらは、状態を **1 バイトの原子変数** だけで表し、待つ仕組みを parking_lot に任せます。

初期化を担当するのは 1 つのスレッドだけです。ほかのスレッドは、状態が `RUNNING` の間は眠り、状態が変わったら起こされるまで待ちます。

## コード

```rust:line-numbers=141
fn initialize_inner(state: &AtomicU8, init: &mut dyn FnMut() -> bool) {
    loop {
        let exchange =
            state.compare_exchange_weak(INCOMPLETE, RUNNING, Ordering::Acquire, Ordering::Acquire);
        match exchange {
            Ok(_) => {
                let mut guard = Guard { state, new_state: INCOMPLETE };
                if init() {
                    guard.new_state = COMPLETE;
                }
                return;
            }
            Err(COMPLETE) => return,
            Err(RUNNING) => unsafe {
                let key = state as *const AtomicU8 as usize;
                parking_lot_core::park(
                    key,
                    || state.load(Ordering::Relaxed) == RUNNING,
                    || (),
                    |_, _| (),
                    parking_lot_core::DEFAULT_PARK_TOKEN,
                    None,
                );
            },
            Err(INCOMPLETE) => (),
            Err(_) => debug_assert!(false),
        }
    }
}
```

この関数は、`state` という `AtomicU8` を見ながら、次の 4 つの場合に分かれます。未初期化なら自分が担当し、完了済みなら戻り、実行中なら待ち、再試行すべき状態なら繰り返します。

## 前提知識

- **`compare_exchange_weak`**: 値が期待どおりなら書き換える原子的な操作です。失敗しても、そのときの値を返します。「weak」は、偽の失敗が起きてもよい代わりに、ループの中で速く動く版です。
- **`park`**: スレッドを眠らせる関数です。キー（鍵）になるアドレスを指定し、同じキーの `unpark` で起こされます。
- **鍵（キー）**: 待っている相手を区別するための番号です。ここでは `state` のアドレスを使い、同じ `OnceCell` の待ちを 1 つにまとめます。
- **`Guard`**: 関数を抜けるときに状態を書き戻す後片付けの型です。初期化が失敗しても、状態を未初期化に戻します。
- **`Relaxed`**: 順序の保証を最小にした読み込みです。待つ条件の確認にだけ使われます。

## 何をしているか

### 1. 未初期化なら、自分が担当する

```rust:line-numbers=143
        let exchange =
            state.compare_exchange_weak(INCOMPLETE, RUNNING, Ordering::Acquire, Ordering::Acquire);
        match exchange {
            Ok(_) => {
                let mut guard = Guard { state, new_state: INCOMPLETE };
                if init() {
                    guard.new_state = COMPLETE;
                }
                return;
            }
```

`INCOMPLETE` から `RUNNING` への書き換えに成功したスレッドだけが、初期化の処理を行います。`Guard` を作り、`init` が成功すれば `COMPLETE` を設定します。失敗すれば、`Guard` の後片付けで未初期化に戻ります。

### 2. 完了していれば戻る

```rust:line-numbers=153
            Err(COMPLETE) => return,
```

すでに `COMPLETE` なら、何もせずに戻ります。

### 3. 実行中なら、眠って待つ

```rust:line-numbers=154
            Err(RUNNING) => unsafe {
                let key = state as *const AtomicU8 as usize;
                parking_lot_core::park(
                    key,
                    || state.load(Ordering::Relaxed) == RUNNING,
                    || (),
                    |_, _| (),
                    parking_lot_core::DEFAULT_PARK_TOKEN,
                    None,
                );
            },
```

`RUNNING` のとき、状態のアドレスを鍵にして `park` します。眠る直前に、状態がまだ `RUNNING` かどうかを確かめます。すでに変わっていれば、眠らずに戻ります。担当が終わると、待っているスレッドが起こされ、ループの先頭で状態を読み直します。

### 4. 残りの状態は再試行する

```rust:line-numbers=165
            Err(INCOMPLETE) => (),
            Err(_) => debug_assert!(false),
        }
```

`INCOMPLETE` に戻っていたなら、再びループして担当を取りに行きます。それ以外は起こりえないので、`debug_assert!` で確かめます。

## ここがすごい

- **状態が 1 バイト**: 初期化の状態を 1 バイトに収めているので、`OnceCell` が小さく済みます。待つための情報は、parking_lot の中の待ち行列が持ちます。
- **アドレスを鍵にする**: 同じ `OnceCell` を待つスレッドは、同じアドレスを鍵にします。待つ仕組みを、別々の変数を作らずに共有できます。
- **パニックにも戻れる**: `Guard` があるので、初期化処理が失敗しても、待っているスレッドが永遠に待たされることはありません。

## まとめ

- 初期化の状態は 1 バイトの原子変数で表し、担当は `compare_exchange` で 1 人に決める。
- 待つ仕組みは parking_lot に任せ、状態のアドレスを鍵にする。
- `Guard` で失敗時も状態を戻し、待ち続けるスレッドを残さない。
