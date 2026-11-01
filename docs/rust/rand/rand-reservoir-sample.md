---
title: 長さが分からない列から、一様に標本を取り出す
description: rand の sample。全体の長さを知らなくても、先頭から amount 個を取り、以降の要素を一定の確率で入れ替える。リザーバー法と呼ばれる 1 回走査のアルゴリズム。
language: rust
project: rand
repo: https://github.com/rust-random/rand
license: MIT OR Apache-2.0
copyright: Copyright 2018 Developers of the Rand project
commit: "9e7d328f60d6372ae22927f37d1a816fc980f25e"
file: src/seq/iterator.rs
lines: [244, 263]
function: IteratorRandom::sample
difficulty: 3
format: 2
tags: [乱数, アルゴリズム, イテレータ]
---

## ひとことで

`sample` は、イテレータ（順に取り出せる列）から **`amount` 個の要素を、どれも同じ確率で** 選ぶ関数です。列の長さが分からなくても使え、列を 1 回だけ先頭から順に読みます。

このアルゴリズムは **リザーバー法（reservoir sampling）** と呼ばれます。「貯水池（リザーバー）」に、最初の `amount` 個を入れ、その後に来る要素を、確率を調整しながら貯水池の中の要素と入れ替えていきます。

## コード

::: code-group

```rust:line-numbers=244 [日本語訳]
    fn sample<R>(mut self, rng: &mut R, amount: usize) -> Vec<Self::Item>
    where
        R: Rng + ?Sized,
    {
        let mut reservoir = Vec::from_iter(self.by_ref().take(amount));

        // 列が途中で終わっていなければ続ける
        //
        // 「やり直し」を行うイテレータで問題が起きないようにするための注記です。
        // イテレータが一度止まったら、こちらも止めます。
        if reservoir.len() == amount {
            for (i, elem) in self.enumerate() {
                let k = rng.random_range(..i + 1 + amount);
                if let Some(slot) = reservoir.get_mut(k) {
                    *slot = elem;
                }
            }
        }
        reservoir
    }
```

```rust:line-numbers=244 [原文]
    fn sample<R>(mut self, rng: &mut R, amount: usize) -> Vec<Self::Item>
    where
        R: Rng + ?Sized,
    {
        let mut reservoir = Vec::from_iter(self.by_ref().take(amount));

        // Continue unless the iterator was exhausted
        //
        // note: this prevents iterators that "restart" from causing problems.
        // If the iterator stops once, then so do we.
        if reservoir.len() == amount {
            for (i, elem) in self.enumerate() {
                let k = rng.random_range(..i + 1 + amount);
                if let Some(slot) = reservoir.get_mut(k) {
                    *slot = elem;
                }
            }
        }
        reservoir
    }
```

:::

`sample` は、`IteratorRandom` というトレイトのメソッドです。`self` を消費するので、呼んだ後にイテレータは使えません。`amount` 個より少ない要素しかない場合は、その分だけ返します。

## 前提知識

- **イテレータ**: 要素を 1 つずつ取り出せる列です。`next` で次の要素を返します。
- **`by_ref`**: イテレータを消費せずに借りる仕組みです。`take` で一部だけ取り出した後も、残りを読み続けられます。
- **`enumerate`**: 要素と、その何番目かを表す添字を組にして返すアダプタです。
- **`random_range`**: 範囲の中から一様な乱数を 1 つ作る関数です。`..n` は、0 以上 `n` 未満の範囲を表します。
- **一様な標本**: どの要素も同じ確率で選ばれる、という意味です。偏りがないことが大切です。

## 何をしているか

### 1. 最初の `amount` 個を貯水池に入れる

```rust:line-numbers=248
        let mut reservoir = Vec::from_iter(self.by_ref().take(amount));
```

`by_ref().take(amount)` で、先頭から `amount` 個を取り出し、`reservoir` に入れます。`by_ref` を使うので、イテレータの残りはまだ読めます。

### 2. 列が足りているか確かめる

```rust:line-numbers=254
        if reservoir.len() == amount {
```

取り出した数が `amount` に届いていなければ、列はそこで終わっています。その場合は、何もせずに貯水池をそのまま返します。

### 3. 残りの要素を、確率的に入れ替える

```rust:line-numbers=255
            for (i, elem) in self.enumerate() {
                let k = rng.random_range(..i + 1 + amount);
```

`enumerate` で、残りの要素と添字 `i` を組にして読みます。`i` は、貯水池に入った後で何番目の要素かを表します。`random_range(..i + 1 + amount)` は、0 から `i + amount` の間の乱数を作ります。

```rust:line-numbers=257
                if let Some(slot) = reservoir.get_mut(k) {
                    *slot = elem;
                }
```

乱数 `k` が貯水池の範囲内（`amount` 未満）に入ったときだけ、その位置の要素を新しい要素で置き換えます。範囲外のときは、新しい要素は捨てられます。

## ここがすごい

- **長さが不要**: 多くのサンプリングは、全体の長さを先に知る必要があります。この方法は、読みながら判断するので、どんな長さの列でも使えます。
- **確率が自然に揃う**: `i` 番目の要素が貯水池に入る確率は `amount / (i + 1 + amount)` になります。後ろに来る要素ほど入りにくくなりますが、各要素が最後まで残る確率は全体で同じになります。
- **メモリは `amount` だけ**: 列全体を保存しないので、大きな列でも使う量は `amount` 個分で済みます。

## まとめ

- 長さが分からない列からも、一様な標本を 1 回の走査で取り出せる。
- 最初の `amount` 個を入れておき、後の要素を確率的に入れ替えるのが要点。
- 使うメモリは `amount` 個分だけで、列全体を持つ必要はない。
