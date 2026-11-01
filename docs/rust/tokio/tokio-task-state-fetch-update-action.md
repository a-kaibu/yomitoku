---
title: 原子的な状態更新を、クロージャの判断で繰り返す
description: tokio のタスク状態を更新する汎用の関数。現在の状態を読み、クロージャが次の状態か「変えない」を決める。compare_exchange が失敗したら、最新の状態で判断し直す。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/runtime/task/state.rs
lines: [513, 533]
function: State::fetch_update_action
difficulty: 3
format: 2
tags: [並行処理, 状態機械, ロック不要]
---

## ひとことで

`fetch_update_action` は、タスクの **状態（ビットの組）を原子的に更新する** 汎用の関数です。どう変えるかは、呼び出し側が渡すクロージャが決めます。この関数は、その判断を、正しく原子的に適用する役を担います。

クロージャは、今の状態を受け取り、「次の状態」と「返す値」の組を返します。次の状態が `None` なら、変えずに返す値だけを返します。

## コード

```rust:line-numbers=513
    fn fetch_update_action<F, T>(&self, mut f: F) -> T
    where
        F: FnMut(Snapshot) -> (T, Option<Snapshot>),
    {
        let mut curr = self.load();

        loop {
            let (output, next) = f(curr);
            let next = match next {
                Some(next) => next,
                None => return output,
            };

            let res = self.val.compare_exchange(curr.0, next.0, AcqRel, Acquire);

            match res {
                Ok(_) => return output,
                Err(actual) => curr = Snapshot(actual),
            }
        }
    }
```

この関数は、`compare_exchange` で、読んだ値が変わっていないことを確かめながら書き換えます。失敗したら、その時点の値を受け取り、クロージャで判断し直します。

## 前提知識

- **`Snapshot`**: タスクの状態を、ビットの組として 1 つの整数にまとめた値です。複数のフラグを、1 回の原子操作で読み書きできます。
- **`compare_exchange`**: 値が期待どおりなら、新しい値に置き換えます。失敗したら、その時点の値を返します。
- **`AcqRel` と `Acquire`**: 成功時と失敗時の、メモリの順序の指定です。
- **クロージャ（`FnMut`）**: 周りの変数を使える関数です。何度か呼ばれても構いません。ここでは、競合で判断し直すたびに呼ばれます。
- **CAS ループ**: 比べて交換する操作を、成功するまで繰り返す書き方です。

## 何をしているか

### 1. 現在の状態を読む

```rust:line-numbers=517
        let mut curr = self.load();
```

最初の状態を読みます。以降のループは、この値を元にして判断します。

### 2. クロージャに判断させる

```rust:line-numbers=520
            let (output, next) = f(curr);
            let next = match next {
                Some(next) => next,
                None => return output,
            };
```

クロージャに今の状態を渡し、返す値と次の状態の組を受け取ります。次の状態が `None` なら、書き換えは不要なので、返す値だけを返して終わります。

### 3. 書き換えを試みる

```rust:line-numbers=526
            let res = self.val.compare_exchange(curr.0, next.0, AcqRel, Acquire);

            match res {
                Ok(_) => return output,
                Err(actual) => curr = Snapshot(actual),
            }
```

`compare_exchange` で、読んだ値のまま次の状態に置き換えられるかを試します。成功したら、返す値を返して終わります。失敗したら、その時点の値を `curr` にして、判断をやり直します。

## ここがすごい

- **判断と更新を分ける**: 更新の仕組みはこの関数が、判断の中身はクロージャが持ちます。同じ仕組みで、いろいろな状態遷移を書けます。
- **変えないときは書かない**: `None` を返せば、書き換えの命令を発行しません。不要な競合を避けられます。
- **競合の後で必ず読み直す**: 失敗したら、最新の状態で判断し直します。古い値に基づいた誤った遷移が起きることを防ぎます。

## まとめ

- 状態の遷移は、クロージャが決め、この関数が原子的に適用する。
- 変える必要がなければ、書き換えの命令を出さない。
- 競合で失敗したら、最新の状態で判断し直す。
