---
title: 同じ値を出さずに、少ない乱数で部分集合を選ぶ
description: rand の sample_floyd。0 から length-1 の中から重複なく amount 個を選ぶ Floyd の方法。すでに選ばれた値に当たったら、代わりに新しい位置を入れる。
language: rust
project: rand
repo: https://github.com/rust-random/rand
license: MIT OR Apache-2.0
copyright: Copyright 2018 Developers of the Rand project
commit: "9e7d328f60d6372ae22927f37d1a816fc980f25e"
file: src/seq/index.rs
lines: [451, 468]
function: sample_floyd
difficulty: 3
format: 2
tags: [乱数, アルゴリズム, データ構造]
---

## ひとことで

`sample_floyd` は、0 から `length - 1` までの中から、**重複なしで `amount` 個の値を選ぶ** 関数です。たとえば 100 個の中から 5 個を、同じものが出ないように選べます。
Robert Floyd が考えた方法で、乱数を `amount` 回だけ使います。全体の配列を用意する必要がなく、選ぶ数が少ないときに、メモリも時間も節約できます。

## コード

::: code-group

```rust:line-numbers=451 [日本語訳]
fn sample_floyd<R>(rng: &mut R, length: u32, amount: u32) -> IndexVec
where
    R: Rng + ?Sized,
{
    // `rng.random_range()` が返す値は、
    // 返されたベクタから、最後の要素を起点に逆にたどると推測できる。
    // この一対一対応によって、アルゴリズムが公平であることが示される。
    debug_assert!(amount <= length);
    let mut indices = Vec::with_capacity(amount as usize);
    for j in length - amount..length {
        let t = rng.random_range(..=j);
        if let Some(pos) = indices.iter().position(|&x| x == t) {
            indices[pos] = j;
        }
        indices.push(t);
    }
    IndexVec::from(indices)
}
```

```rust:line-numbers=451 [原文]
fn sample_floyd<R>(rng: &mut R, length: u32, amount: u32) -> IndexVec
where
    R: Rng + ?Sized,
{
    // Note that the values returned by `rng.random_range()` can be
    // inferred from the returned vector by working backwards from
    // the last entry. This bijection proves the algorithm fair.
    debug_assert!(amount <= length);
    let mut indices = Vec::with_capacity(amount as usize);
    for j in length - amount..length {
        let t = rng.random_range(..=j);
        if let Some(pos) = indices.iter().position(|&x| x == t) {
            indices[pos] = j;
        }
        indices.push(t);
    }
    IndexVec::from(indices)
}
```

:::

`debug_assert!` は、選ぶ数が全体の数を超えていないことを、デバッグ時に確かめます。`indices` には、結果の値を順に入れていきます。

## 前提知識

- **重複なしの抽出**: 同じ値を 2 回選ばないように選ぶことです。トランプから 5 枚引くのと同じ考え方です。
- **`random_range(..=j)`**: 0 以上 `j` 以下の乱数を 1 つ返します。範囲の両端を含むことに注意してください。
- **`position`**: イテレータの中で、条件に合う最初の要素の位置を返します。見つからなければ `None` です。
- **`Vec::with_capacity`**: 最初から必要な大きさを確保した `Vec` を作ります。途中で何度も領域を広げ直すのを防げます。
- **`IndexVec`**: rand が選んだ添字の集まりを表す型です。`Vec` の添字を、型で区別して扱えます。

## 何をしているか

### 1. 結果から乱数をたどれることを確かめる

CODE の上にあるコメントは、結果から乱数の値を逆にたどれることを述べています。その 1 対 1 の対応により、どの組み合わせも同じ確率で出ることが示されます。

### 2. 上の方の範囲から 1 つずつ選ぶ

```rust:line-numbers=459
    let mut indices = Vec::with_capacity(amount as usize);
    for j in length - amount..length {
        let t = rng.random_range(..=j);
```

選ぶ数は `amount` 個です。`length - amount` から `length - 1` までの `j` を順に見て、`0..=j` の範囲から乱数 `t` を 1 つ選びます。`j` は毎回大きくなるので、上の範囲から順に決まります。

### 3. 重複していたら、代わりに `j` を入れる

```rust:line-numbers=462
        if let Some(pos) = indices.iter().position(|&x| x == t) {
            indices[pos] = j;
        }
        indices.push(t);
    }
```

`t` がすでに `indices` にあれば、その位置の値を `j` で置き換え、`t` を末尾に追加します。`t` がなければ、そのまま末尾に追加します。どちらの場合も、結果は重複のない集合になります。

## ここがすごい

- **選ぶ数だけ乱数を使う**: 全体の大きさ `length` に比例する配列を作らず、`amount` 回だけ乱数を取り出します。大きな母集団から少数を選ぶときに、効率がとても良くなります。
- **重複の扱いが 1 行で済む**: 「当たったら `j` を入れる」だけで、重複のない抽出になります。Floyd の方法の鮮やかさが、コードの短さに表れています。
- **公平性の証明がコメントにある**: 乱数の列と結果の集合が 1 対 1 に対応することを、コメントが説明しています。読み手は、なぜ偏りがないかを追えます。
- **探索が線形になる**: `position` で既存の値を探すので、選ぶ数が多いと時間が増えます。rand では、選ぶ数や全体の大きさに応じて、別の方法（`sample_inplace` や `sample_rejection`）も使い分けています。
- **`debug_assert!` で前提を守る**: 選ぶ数が全体を超えると、`length - amount` が溢れます。デバッグのときに、この前提を確かめています。

## まとめ

- 0 から `length - 1` の中から重複なく `amount` 個を選ぶには、`j` ごとに乱数を選び、当たったら `j` を入れる。
- 乱数は選ぶ数だけ使い、大きな配列を作らずに済む。
- 選ぶ数が多いときは、rand が別の方法を使い分ける。
