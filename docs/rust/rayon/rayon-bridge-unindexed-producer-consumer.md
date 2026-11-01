---
title: 仕事を半分に割って、並列に畳み込む
description: rayon の並列イテレータの中心。生産者（データの源）を分割し、分割できなくなるまで再帰的に join して並列に処理する。左右の結果は reduce で 1 つにまとめる。
language: rust
project: Rayon
repo: https://github.com/rayon-rs/rayon
license: MIT OR Apache-2.0
copyright: Copyright (c) 2010 The Rust Project Developers
commit: "599425d4a4c64714632817f48496dbc53f656a90"
file: src/iter/plumbing/mod.rs
lines: [447, 476]
function: bridge_unindexed_producer_consumer
difficulty: 3
format: 2
tags: [並行処理, 再帰, アルゴリズム]
---

## ひとことで

`bridge_unindexed_producer_consumer` は、rayon の並列イテレータが **仕事を分割して、複数のスレッドに分け、その結果を合流させる** 中心の関数です。データの源を表す `producer` を、ほどよい大きさに分けながら、再帰的に処理を進めます。

この関数は、分割の判断（`splitter`）、分割できるかの判断、分割後の結果の合流（`reduce`）を組み合わせています。分割が続けられないときは、残りを 1 つずつ順番に処理します。

## コード

```rust:line-numbers=447
fn bridge_unindexed_producer_consumer<P, C>(
    migrated: bool,
    mut splitter: Splitter,
    producer: P,
    consumer: C,
) -> C::Result
where
    P: UnindexedProducer,
    C: UnindexedConsumer<P::Item>,
{
    if consumer.full() {
        consumer.into_folder().complete()
    } else if splitter.try_split(migrated) {
        match producer.split() {
            (left_producer, Some(right_producer)) => {
                let (reducer, left_consumer, right_consumer) =
                    (consumer.to_reducer(), consumer.split_off_left(), consumer);
                let bridge = bridge_unindexed_producer_consumer;
                let (left_result, right_result) = join_context(
                    |context| bridge(context.migrated(), splitter, left_producer, left_consumer),
                    |context| bridge(context.migrated(), splitter, right_producer, right_consumer),
                );
                reducer.reduce(left_result, right_result)
            }
            (producer, None) => producer.fold_with(consumer.into_folder()).complete(),
        }
    } else {
        producer.fold_with(consumer.into_folder()).complete()
    }
}
```

この関数は、`join_context` によって、左右の半分を並列に実行します。左の処理は、`bridge` を再び呼び出すことで、さらに分割されます。分割が止まったら、普通の逐次の畳み込みに切り替わります。

## 前提知識

- **並列イテレータ**: データの処理を、複数のスレッドに分けて同時に進める仕組みです。rayon の `par_iter` などで使われます。
- **生産者（`producer`）と消費者（`consumer`）**: 生産者はデータを分割して供給し、消費者は受け取った値を畳み込んで結果を作ります。
- **`join_context`**: 2 つの処理を並列に実行し、両方の結果を返す関数です。rayon の作業を分配する基本の仕組みです。
- **`reduce`**: 左右の結果を 1 つにまとめる操作です。分割された計算の結果を合流させます。
- **分割の判定（`splitter`）**: 分割を続けるか、ここで止めて逐次処理するかを決める仕組みです。

## 何をしているか

### 1. 満杯なら、すぐに結果を返す

```rust:line-numbers=457
    if consumer.full() {
        consumer.into_folder().complete()
```

消費者がもう受け取れない（満杯）なら、この区間の処理を終えて、結果を返します。

### 2. 分割できるなら、左右に分けて並列に処理する

```rust:line-numbers=459
    } else if splitter.try_split(migrated) {
        match producer.split() {
            (left_producer, Some(right_producer)) => {
                let (reducer, left_consumer, right_consumer) =
                    (consumer.to_reducer(), consumer.split_off_left(), consumer);
                let bridge = bridge_unindexed_producer_consumer;
                let (left_result, right_result) = join_context(
                    |context| bridge(context.migrated(), splitter, left_producer, left_consumer),
                    |context| bridge(context.migrated(), splitter, right_producer, right_consumer),
                );
                reducer.reduce(left_result, right_result)
```

分割してよいと `splitter` が判断したら、生産者を左右に割ります。消費者も、左側と右側に分けます。`join_context` で、左右を並列に `bridge` で処理し、結果を `reduce` で合流させます。

### 3. 分割できないなら、逐次に処理する

```rust:line-numbers=471
            (producer, None) => producer.fold_with(consumer.into_folder()).complete(),
        }
    } else {
        producer.fold_with(consumer.into_folder()).complete()
```

分割できない場合や、分割を続けない場合は、生産者の要素を順番に消費者へ渡します。畳み込みの結果を、そのまま返します。

## ここがすごい

- **再帰の深さを制御**: `splitter` が、分割の深さや作業の偏りを見て、いつ止めるかを決めます。細かすぎる分割で、かえって遅くなることを防ぎます。
- **結果の順序を保つ**: 左右の結果を、左を先に、右を後に合流させます。消費者が結果の順番を正しく扱えます。
- **同じ形の再帰**: 分割の有無にかかわらず、関数の形は同じです。並列と逐次の切り替えが、1 つの関数の中で自然に行われます。

## まとめ

- データの源を半分に割り、左右を並列に再帰処理する。
- 分割が止まったら、普通の逐次の畳み込みに切り替える。
- 左右の結果は、順序を保ったまま `reduce` で 1 つにまとめる。
