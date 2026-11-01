---
title: 重みに比例した確率で、重複なく標本を選ぶ
description: rand の重み付き抽出。各要素にキーを付け、キーの大きい順に残す。A-ExpJ 法では、重みを使って次に入れ替える位置を一気に飛ばし、乱数の回数を減らす。
language: rust
project: rand
repo: https://github.com/rust-random/rand
license: MIT OR Apache-2.0
copyright: Copyright 2018 Developers of the Rand project
commit: "9e7d328f60d6372ae22927f37d1a816fc980f25e"
file: src/seq/index.rs
lines: [398, 412]
function: sample_efraimidis_spirakis
difficulty: 3
format: 2
tags: [乱数, アルゴリズム, データ構造]
---

## ひとことで

この関数は、**重みに比例した確率で、重複なく `amount` 個の添字を選ぶ** 処理の中心部分です。重みが大きい要素ほど選ばれやすく、同じ要素は 2 回選ばれません。

アルゴリズムは **Efraimidis と Spirakis の方法（A-ExpJ）** です。各要素に乱数から作ったキーを付け、キーが大きい順に上位 `amount` 件を残します。さらに、残りの要素を 1 つずつ調べる代わりに、重みを使って次に入れ替わる位置を一気に飛ばします。

## コード

::: code-group

```rust:line-numbers=398 [日本語訳]
    let mut candidates = BinaryHeap::with_capacity(amount.as_usize());
    let mut index = N::zero();
    while index < length && candidates.len() < amount.as_usize() {
        let weight = weight(index.as_usize()).into();
        if weight > 0.0 {
            // 精度を保つため、A-ExpJ で使うキーの対数を使います
            // 小さい重みのために：
            let key = rng.random::<f64>().ln() / weight;
            candidates.push(Element { index, key });
        } else if !(weight >= 0.0) {
            return Err(WeightError::InvalidWeight);
        }

        index += N::one();
    }
```

```rust:line-numbers=398 [原文]
    let mut candidates = BinaryHeap::with_capacity(amount.as_usize());
    let mut index = N::zero();
    while index < length && candidates.len() < amount.as_usize() {
        let weight = weight(index.as_usize()).into();
        if weight > 0.0 {
            // We use the log of the key used in A-ExpJ to improve precision
            // for small weights:
            let key = rng.random::<f64>().ln() / weight;
            candidates.push(Element { index, key });
        } else if !(weight >= 0.0) {
            return Err(WeightError::InvalidWeight);
        }

        index += N::one();
    }
```

:::

この部分は、まず最初の `amount` 個（または列の終わりまで）を、キーつきで **二分ヒープ** に入れます。ヒープには、今残っている候補のうち最小のキーが、いつでも取り出せる位置にあります。

## 前提知識

- **重み付き抽出**: 要素ごとに重みがあり、重みが大きいほど選ばれやすい抽出です。
- **キー**: 乱数 `u`（0 から 1 の一様な値）から、`u^(1/w)` という値を作ります。重みが大きいほど、キーは 1 に近くなりやすくなります。
- **対数のキー**: キーの対数 `ln(u) / w` を使うと、非常に小さい重みでも、数値の精度が保たれます。大小の順番は変わりません。
- **二分ヒープ（`BinaryHeap`）**: 最大（または最小）の要素を素早く取り出せるデータ構造です。ここでは、順序を逆にして、最小のキーを先頭に置いています。
- **`peek` と `pop`**: `peek` は先頭を見るだけ、`pop` は先頭を取り除きます。

## 何をしているか

### 1. 最初の候補を集める

```rust:line-numbers=399
    let mut index = N::zero();
    while index < length && candidates.len() < amount.as_usize() {
        let weight = weight(index.as_usize()).into();
        if weight > 0.0 {
            // We use the log of the key used in A-ExpJ to improve precision
            // for small weights:
            let key = rng.random::<f64>().ln() / weight;
            candidates.push(Element { index, key });
        } else if !(weight >= 0.0) {
            return Err(WeightError::InvalidWeight);
        }

        index += N::one();
    }
```

添字を先頭から順に見て、重みが正の要素にキーを付けてヒープに入れます。重みが負や NaN なら、エラーにします。候補が `amount` 個になるか、列が終わるまで続けます。

### 2. 残りは、重みで飛ばしながら調べる

```rust:line-numbers=414
    if index < length {
        let mut x = rng.random::<f64>().ln() / candidates.peek().unwrap().key;
        while index < length {
            if !x.is_finite() {
                return Err(WeightError::InvalidWeight);
            }
```

列がまだ残っていれば、`x` を作ります。`x` は、次に候補が入れ替わるまでの「重みの残り」です。`x` の初期値は、乱数の対数を、ヒープの最小キーで割った値です。有限でなければ、エラーにします。

```rust:line-numbers=421
            let weight = weight(index.as_usize()).into();
            if weight > 0.0 {
                x -= weight;
                if x <= 0.0 {
                    let min_candidate = candidates.pop().unwrap();
                    let t = (min_candidate.key * weight).exp();
                    let key = rng.random_range(t..1.0).ln() / weight;
                    candidates.push(Element { index, key });

                    x = rng.random::<f64>().ln() / candidates.peek().unwrap().key;
```

各要素の重みを `x` から引いていきます。`x` が 0 以下になったら、その要素が新しく入る番です。最小のキーの候補を取り除き、その要素を、条件付きの乱数で新しいキーにしてヒープに入れます。そのあと `x` を作り直します。

## ここがすごい

- **乱数の回数が少ない**: 採用されない要素のために、乱数を毎回作らずに済みます。`x` が 0 になるまで、重みを引くだけです。
- **偏りのない抽出**: 各要素が選ばれる確率は、重みに比例します。キーを使う方法なので、順番に依存した偏りも出にくくなっています。
- **メモリは候補の数だけ**: ヒープに入るのは最大 `amount` 個です。列全体を保存する必要がありません。

## まとめ

- 各要素にキーを付け、上位 `amount` 件を残すと、重みに比例した非復元抽出になる。
- A-ExpJ は、重みを引いていく `x` で、入れ替わる位置を一気に飛ばす。
- 候補はヒープで管理し、メモリは `amount` 個分で済む。
