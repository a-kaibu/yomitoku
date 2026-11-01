---
title: 条件を外れたら、以降の要素を読まずに終える
description: 標準ライブラリの TakeWhile の try_fold。条件が偽になった時点で flag を立て、以降の呼び出しは何も読まずに初期値を返す。途中の折り畳みは ControlFlow で早く抜ける。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/iter/adapters/take_while.rs
lines: [69, 97]
function: try_fold
difficulty: 3
format: 2
tags: [イテレータ, 状態機械, 型システム]
---

## ひとことで

`TakeWhile` は、イテレータの要素を、条件が真の間だけ取り出すアダプタです。この `try_fold` は、その上で **畳み込み（fold）を途中で止められる形** にするための実装です。条件が一度偽になったら、それ以降の要素は一切読まずに終えます。

`try_fold` は、`fold` と同じく、値を 1 つずつ累積していく操作です。ただし、途中で失敗（`Err` や `None`）が出たら、そこで止まります。この関数は、その仕組みに「条件を外れたら止まる」という判断を組み込んでいます。

## コード

```rust:line-numbers=69
    fn try_fold<Acc, Fold, R>(&mut self, init: Acc, fold: Fold) -> R
    where
        Self: Sized,
        Fold: FnMut(Acc, Self::Item) -> R,
        R: Try<Output = Acc>,
    {
        fn check<'a, T, Acc, R: Try<Output = Acc>>(
            flag: &'a mut bool,
            p: &'a mut impl FnMut(&T) -> bool,
            mut fold: impl FnMut(Acc, T) -> R + 'a,
        ) -> impl FnMut(Acc, T) -> ControlFlow<R, Acc> + 'a {
            move |acc, x| {
                if p(&x) {
                    ControlFlow::from_try(fold(acc, x))
                } else {
                    *flag = true;
                    ControlFlow::Break(try { acc })
                }
            }
        }

        if self.flag {
            try { init }
        } else {
            let flag = &mut self.flag;
            let p = &mut self.predicate;
            self.iter.try_fold(init, check(flag, p, fold)).into_try()
        }
    }
```

## 前提知識

- **イテレータのアダプタ**: 元のイテレータを包んで、要素を加工したり絞り込んだりする型です。`take_while` は、アダプタの 1 つです。
- **`fold` と `try_fold`**: 初期値から始めて、要素を 1 つずつ足し込んでいく操作です。`try_fold` は、途中で失敗を返すと、そこで止まります。
- **`Try` トレイト**: `Result` や `Option` のように、成功と失敗を表せる型の共通の性質です。
- **`ControlFlow`**: 処理を続けるか（`Continue`）、途中で抜けるか（`Break`）を表す型です。
- **`flag`**: 条件が一度偽になったことを覚えておく真偽値です。`TakeWhile` の中に保存されています。

## 何をしているか

### 1. 条件を確かめながら畳み込む補助関数を作る

```rust:line-numbers=75
        fn check<'a, T, Acc, R: Try<Output = Acc>>(
            flag: &'a mut bool,
            p: &'a mut impl FnMut(&T) -> bool,
            mut fold: impl FnMut(Acc, T) -> R + 'a,
        ) -> impl FnMut(Acc, T) -> ControlFlow<R, Acc> + 'a {
            move |acc, x| {
                if p(&x) {
                    ControlFlow::from_try(fold(acc, x))
                } else {
                    *flag = true;
                    ControlFlow::Break(try { acc })
                }
            }
        }
```

`check` は、元の畳み込みを包んだクロージャを返します。要素が条件を満たせば、元の畳み込みの結果を `ControlFlow::from_try` で変換して渡します。条件を満たさなければ、`flag` を真にし、`Break` で畳み込みを止めます。

### 2. 既に止まっていれば何もしない

```rust:line-numbers=90
        if self.flag {
            try { init }
```

`flag` がすでに真なら、以降の要素は読まずに、初期値をそのまま成功として返します。

### 3. 元のイテレータに畳み込みを任せる

```rust:line-numbers=93
            let flag = &mut self.flag;
            let p = &mut self.predicate;
            self.iter.try_fold(init, check(flag, p, fold)).into_try()
```

そうでなければ、`flag` と述語 `predicate` の参照を `check` に渡し、元のイテレータの `try_fold` を呼びます。結果は `into_try` で、元の `R` の形に戻します。

## ここがすごい

- **`flag` で一度だけ止める**: 条件が偽になったら、以降の呼び出しは元のイテレータに触れません。`take_while` の「止まったら戻らない」という性質を、この 1 つの真偽値で表しています。
- **`ControlFlow` で途中を抜ける**: 元の `try_fold` は、`Break` を受け取ると、そこで処理を止めます。余分な要素を読まずに済みます。
- **包んで渡す仕組み**: 元の畳み込みを `check` で包むことで、条件の判定と畳み込みを同時に行えます。`fold` の仕組みを変えずに、条件を足せます。
- **初期値の扱い**: 止まっている場合は、初期値をそのまま `try` の成功として返します。空のイテレータと同じ扱いになり、結果の形が揃います。

## まとめ

- 「条件を外れたら終わり」を表すには、状態を 1 つの真偽値で覚えておくと簡潔です。
- 途中で抜ける処理は、`ControlFlow` のような明示的な型で表すと、意図が伝わります。
- 既存の仕組みを包んで条件を足すと、元の仕組みを壊さずに機能を拡張できます。
