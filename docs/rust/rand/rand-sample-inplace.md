---
title: 並べ替えの途中で止めて、先頭の数個を取り出す
description: rand の sample_inplace。0 から length-1 の番号を並べ、先頭 amount 個の位置だけを Fisher–Yates で入れ替える。重複のない無作為な抽出を、途中で止めた並べ替えで行う。
language: rust
project: rand
repo: https://github.com/rust-random/rand
license: MIT OR Apache-2.0
copyright: Copyright 2018 Developers of the Rand project
commit: "9e7d328f60d6372ae22927f37d1a816fc980f25e"
file: src/seq/index.rs
lines: [482, 496]
function: sample_inplace
difficulty: 2
format: 2
tags: [乱数, アルゴリズム, データ構造]
---

## ひとことで

`sample_inplace` は、0 から `length - 1` までの番号の中から、**重複なしで `amount` 個を選ぶ** 関数です。方法は、番号を全部並べたうえで、**先頭から `amount` 個だけ** をランダムに入れ替えて、最後に切り詰めるというものです。
全部をシャッフルするのではなく、必要な分だけ途中で止めるので、並べ替えの作業が `amount` 回で済みます。`sample_floyd` と同じ目的の関数ですが、メモリと作業の量のつり合いが違います。

## コード

```rust:line-numbers=482
fn sample_inplace<R>(rng: &mut R, length: u32, amount: u32) -> IndexVec
where
    R: Rng + ?Sized,
{
    debug_assert!(amount <= length);
    let mut indices: Vec<u32> = Vec::with_capacity(length as usize);
    indices.extend(0..length);
    for i in 0..amount {
        let j: u32 = rng.random_range(i..length);
        indices.swap(i as usize, j as usize);
    }
    indices.truncate(amount as usize);
    debug_assert_eq!(indices.len(), amount as usize);
    IndexVec::from(indices)
}
```

この関数は、番号の配列を `length` 個分作ります。そのため、長さが大きいときは、多くのメモリを使うことに注意が必要です。

## 前提知識

- **Fisher–Yates のシャッフル**: 各位置に、その位置以降の要素から 1 つをランダムに選んで入れ替える方法です。すべての並び方が同じ確率になります。
- **部分的な Fisher–Yates**: 全体のシャッフルを途中で止める版です。先頭から `amount` 個の位置が決まった時点で止めれば、その部分は一様な無作為の並びになります。
- **`Vec::extend`**: 要素のイテレータを、末尾に追加します。ここでは `0..length` の番号を入れています。
- **`truncate`**: `Vec` の長さを、指定した長さまで切り詰めます。後ろの要素は捨てられます。
- **`random_range(i..length)`**: `i` 以上 `length` 未満の乱数を返します。範囲の上限は含まれません。

## 何をしているか

### 1. 番号を並べる

```rust:line-numbers=487
    let mut indices: Vec<u32> = Vec::with_capacity(length as usize);
    indices.extend(0..length);
```

`length` 個の番号 `0, 1, ..., length - 1` を、順に並べた配列を作ります。最初は、どの番号も元の位置にあります。

### 2. 先頭から `amount` 回だけ入れ替える

```rust:line-numbers=489
    for i in 0..amount {
        let j: u32 = rng.random_range(i..length);
        indices.swap(i as usize, j as usize);
    }
```

`i` を `0` から `amount - 1` まで進めます。各回で、`i` 以上の位置から乱数で 1 つ `j` を選び、`i` と `j` を入れ替えます。`i` より前は、すでに決まった結果です。
`amount` 回で止めるので、残りの位置は入れ替えられずに残ります。

### 3. 先頭の `amount` 個だけを残す

```rust:line-numbers=493
    indices.truncate(amount as usize);
    debug_assert_eq!(indices.len(), amount as usize);
    IndexVec::from(indices)
```

`truncate` で、先頭 `amount` 個以外を捨てます。残った配列が、選ばれた番号の並びになります。

## ここがすごい

- **必要な分だけ仕事をする**: 全部をシャッフルせず、`amount` 回の入れ替えで止めます。少ない数を選ぶときに、作業量が抑えられます。
- **結果が一様になる**: 各回で、残りの範囲から等しい確率で選ぶので、先頭 `amount` 個の並びは、すべて同じ確率で出ます。途中で止めても、偏りが出ません。
- **乱数を `amount` 回だけ使う**: 入れ替えの回数と、乱数の数が一致します。ループの形が、そのまま仕様の説明になっています。
- **メモリの使い方が明確**: 番号の配列を `length` 個分作るので、母集団が大きいとメモリを使います。そのため、rand は `sample_floyd` などの方法と使い分けています。
- **`debug_assert_eq!` で長さを確かめる**: 切り詰めのあとの長さが `amount` と一致することを、デバッグ時に確かめています。

## まとめ

- 番号を並べて、先頭 `amount` 個だけを Fisher–Yates で入れ替えると、重複のない無作為な抽出になる。
- 途中で止めるので、作業は `amount` 回で済む。
- 母集団の大きさに比例するメモリを使うので、大きい母集団では別の方法を選ぶ。
