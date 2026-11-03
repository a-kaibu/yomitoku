---
title: "2 つの表の差を EXCEPT の両方向で探すテスト"
description: "dbt-utils の equality テスト。EXCEPT で a から b を引いた行と b から a を引いた行を集め、どちらにしか無い行を which_diff の印付きで返す。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/generic_tests/equality.sql
lines: [128, 146]
function: "default__test_equality"
difficulty: 3
tags: [標準ライブラリ, アルゴリズム]
format: 2
---

## ひとことで

`equality` は、2 つのモデル（表）の中身が同じかどうかを確かめるテストです。片方にだけある行を、両方向の差として集めます。どちら側にしか無いかは、`which_diff` という列の印で分かります。

## コード

```sql:line-numbers=128
with a as (

    select * from {{ model }}

),

b as (

    select * from {{ compare_model }}

),

a_minus_b as (

    select {{compare_cols_csv}} from a
    {{ dbt.except() }}
    select {{compare_cols_csv}} from b

),
```

## 前提知識

- **`EXCEPT`**: 左の `SELECT` の結果から、右にある行を取り除く集合の演算。重複も取り除く。
- **CTE（`with` 句）**: 途中の結果に名前を付けて、次の段階で使う書き方。
- **集合の差**: A から B を引くと、A にしか無い要素だけが残る。
- **`dbt.except()`**: `EXCEPT` の書き方をデータベースごとに変換する dbt のマクロ。
- **`union all`**: 2 つの結果を縦につなぐ。重複は取り除かない。

## 何をしているか

### 1. a から b を引いた行を集める

`a` と `b` という 2 つの CTE に、比べる表の中身を入れます。`a_minus_b` は、`a` にあって `b` に無い行です。

```sql:line-numbers=140
a_minus_b as (

    select {{compare_cols_csv}} from a
    {{ dbt.except() }}
    select {{compare_cols_csv}} from b

),
```

ここで使う `dbt.except()` は、データベースに合わせて `except` か `minus` のような書き方に変換されます。

### 2. 反対向きの差も集める

同じ形で、`b` にあって `a` に無い行を集めます。

```sql:line-numbers=148
b_minus_a as (

    select {{compare_cols_csv}} from b
    {{ dbt.except() }}
    select {{compare_cols_csv}} from a
```

### 3. 印を付けて 1 つにまとめる

両方の差を `union all` でつなぎ、どちら向きの差かを `which_diff` の文字で表します。

```sql:line-numbers=156
unioned as (

    select 'a_minus_b' as which_diff, a_minus_b.* from a_minus_b
    union all
    select 'b_minus_a' as which_diff, b_minus_a.* from b_minus_a

)
```

テストは、この結果が空なら合格、行があれば失敗です。行の中の `which_diff` を見れば、どちらの表にだけある行かが分かります。

## ここがすごい

- **集合の演算で、全部の列を一度に比べる**: 列ごとに比較の式を書かずに、行全体が同じかを判定できます。
- **両方向を調べる**: 片方向だけでは、もう一方にしか無い行を見落とします。両方向に分けることで、欠けも余分な行も見つけられます。
- **印で向きを残す**: 結果を 1 つの表にしても、どちら側の行かが分かります。
- **トレードオフ**: `EXCEPT` は重複を取り除くので、同じ行が何回あるかの違いは検出できません。件数の違いは、別のテストで確かめる必要があります。

## まとめ

- 2 つの表が同じかは、`EXCEPT` を両方向に使うと確かめられる。
- 差の向きを印として残すと、結果の読み方が分かりやすくなる。
- 集合の演算は、列を 1 つずつ比べるより簡潔に書ける。
