---
title: 測定値を、ログスケールのヒストグラムの区間番号にする
description: tokio のランタイム計測で、測定値をヒストグラムの区間番号へ変換する。線形とログの 2 種類があり、ログ側は先頭ゼロの個数から桁数を求める。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/runtime/metrics/histogram.rs
lines: [119, 143]
function: HistogramType::value_to_bucket
difficulty: 3
format: 2
tags: [数値計算, アルゴリズム, 型システム]
---

## ひとことで

`value_to_bucket` は、ランタイムの計測で得た **1 つの値（例えば待ち時間）が、ヒストグラムのどの区間に入るか** を求めるメソッドです。区間は「区間番号（バケツ番号）」で表します。

ヒストグラムには 2 種類の区間の切り方があります。一定の幅で区切る線形の方式と、桁数に応じて区切るログの方式です。この関数は、どちらの方式かを `match` で判断して、それぞれの計算をします。

## コード

```rust:line-numbers=119
    fn value_to_bucket(&self, value: u64) -> usize {
        match self {
            HistogramType::Linear(LinearHistogram {
                num_buckets,
                bucket_width,
            }) => {
                let max = num_buckets - 1;
                cmp::min(value / *bucket_width, max as u64) as usize
            }
            HistogramType::LogLegacy(LegacyLogHistogram {
                num_buckets,
                first_bucket_width,
            }) => {
                let max = num_buckets - 1;
                if value < *first_bucket_width {
                    0
                } else {
                    let significant_digits = 64 - value.leading_zeros();
                    let bucket_digits = 64 - (first_bucket_width - 1).leading_zeros();
                    cmp::min(significant_digits as usize - bucket_digits as usize, max)
                }
            }
            HistogramType::H2(log_histogram) => log_histogram.value_to_bucket(value),
        }
    }
```

`value_to_bucket` は、ヒストグラムを作るときに決めた区間の設定を使います。戻り値は、その設定で有効な番号の範囲の中に必ず収まるように作られています。

## 前提知識

- **ヒストグラム**: 値を区間ごとに分けて、件数を数える仕組みです。全体の分布が一目で分かります。
- **`match` と列挙型**: 値の種類ごとに処理を分けます。`HistogramType` は、線形とログなどの方式を表す列挙型です。
- **`leading_zeros`**: 2 進数の先頭にある 0 の個数を返します。値の桁数を求めるのに使えます。
- **`cmp::min`**: 最大の区間番号を超えないように抑えます。
- **`as usize`**: 数値の型を、配列の添字に使える型へ変えます。

## 何をしているか

### 1. 線形の方式では、幅で割る

```rust:line-numbers=121
            HistogramType::Linear(LinearHistogram {
                num_buckets,
                bucket_width,
            }) => {
                let max = num_buckets - 1;
                cmp::min(value / *bucket_width, max as u64) as usize
```

線形の方式では、値を区間の幅で割った商が区間番号になります。最後の区間より大きな値は、最後の区間に入れられます。

### 2. ログの方式では、桁数の差を取る

```rust:line-numbers=133
                if value < *first_bucket_width {
                    0
                } else {
                    let significant_digits = 64 - value.leading_zeros();
                    let bucket_digits = 64 - (first_bucket_width - 1).leading_zeros();
                    cmp::min(significant_digits as usize - bucket_digits as usize, max)
```

まず、値が最初の区間の幅より小さいなら、区間番号は 0 です。それ以外は、値の桁数（`64 - leading_zeros`）から、最初の区間の幅の桁数を引きます。その差が、何段目の区間かを表します。桁数が増えると、区間番号も 1 ずつ増えます。

### 3. 2 進数の桁を数える

ここでは、値の大きさを 2 進数の桁数で測っています。値を 2 倍すると桁数が 1 増えるので、区間は 2 倍ごとに切り替わります。

## ここがすごい

- **桁数で区切る**: ログの方式は、値が大きくなるほど区間が広くなります。待ち時間のように、少数の大きな値を含む分布でも、全体を粗く分けられます。
- **`leading_zeros` で桁数を求める**: 割り算や対数の計算をせずに、桁数が分かります。ビットの操作 1 つで済むので、計測のたびに呼んでも負担が小さいです。
- **上限で守る**: どんなに大きな値が来ても、区間番号が範囲を超えません。計測の処理が、配列の外へ書き込んでしまうことを防いでいます。

## まとめ

- 測定値を区間番号に変換するため、方式ごとに計算を分けている。
- ログの方式は、桁数の差で区間番号を決める。
- 桁数は `leading_zeros` で得られるので、割り算や対数が要らない。
