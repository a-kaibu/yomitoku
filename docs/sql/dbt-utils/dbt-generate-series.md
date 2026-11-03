---
title: "2 のべき乗の掛け算で連番を作る generate_series"
description: "dbt-utils の generate_series。0 と 1 だけの行を cross join で重ね、各桁の値を 2 のべき乗で足して、上限までの連番を作る。桁数は上限から Jinja で計算する。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/generate_series.sql
lines: [26, 37]
function: "default__generate_series"
difficulty: 3
tags: [数値計算, アルゴリズム]
format: 2
---

## ひとことで

`generate_series` は、1 から上限までの連続した整数の表を作るマクロです。データベースによっては、連番を作る関数がありません。このマクロは、0 と 1 だけの行を組み合わせ、2 進数の桁のように足し合わせて、連番を作ります。

## コード

```sql:line-numbers=26
    with p as (
        select 0 as generated_number union all select 1
    ), unioned as (

    select

    {% for i in range(n) %}
    p{{i}}.generated_number * power(2, {{i}})
    {% if not loop.last %} + {% endif %}
    {% endfor %}
    + 1
    as generated_number
```

## 前提知識

- **2 進数**: 0 と 1 だけで数を表す方法。桁ごとに 2 のべき乗（1, 2, 4, 8...）の重みがある。
- **`cross join`**: 2 つの表のすべての組み合わせを作る結合。行数は掛け算になる。
- **`union all`**: 2 つの `select` を縦につなぐ。ここでは 0 と 1 の 2 行を作る。
- **`power(2, i)`**: 2 の `i` 乗を返す関数。
- **`row` の番号**: 行の組み合わせが、桁の値の並びとして一意になる。

## 何をしているか

### 1. 0 と 1 の 2 行の表を作る

`p` という CTE は、0 と 1 の 2 行だけの表です。これを、桁の数だけ重ねます。

```sql:line-numbers=27
        select 0 as generated_number union all select 1
```

### 2. 桁の組み合わせで数を作る

桁の数（`n`）だけ `p` を `cross join` すると、全部で `2^n` 行の組み合わせができます。各桁の値に `2^i` を掛けて足し、最後に 1 を足すと、1 から `2^n` までの連番になります。

```sql:line-numbers=30
    select

    {% for i in range(n) %}
    p{{i}}.generated_number * power(2, {{i}})
    {% if not loop.last %} + {% endif %}
    {% endfor %}
    + 1
    as generated_number
```

`{% for i in range(n) %}` の Jinja の繰り返しで、桁の数だけ式が書き出されます。

### 3. 上限より大きい数を外す

作った連番のうち、上限より大きいものを `where` で外し、小さい順に並べます。

```sql:line-numbers=48
    select *
    from unioned
    where generated_number <= {{upper_bound}}
    order by generated_number
```

桁の数 `n` は、上限から計算します。`get_powers_of_two` は、`2 ** i` が上限以上になる最初の `i` を、繰り返しで探しています。

```sql:line-numbers=11
    {% for _ in range(1, 100) %}
       {% if upper_bound <= 2 ** loop.index %}{{ return(loop.index) }}{% endif %}
    {% endfor %}
```

## ここがすごい

- **連番を集合の組み合わせで作る**: 連番を生成する関数が無くても、0 と 1 の組み合わせだけで必要な数を作れます。
- **桁数が対数で少なく済む**: 1000 までの連番でも、桁は 10 個ほどの `cross join` で済みます。行数は多くても、作る式は少なくて済みます。
- **Jinja で式を自動生成**: 桁の数に応じた SQL を、繰り返しで書き出しています。利用者は上限だけを指定すれば済みます。
- **トレードオフ**: 行数は `2^n` で、上限より少し多く作ってから絞るため、上限が大きいときは無駄な行が増えます。

## まとめ

- 連番は、0 と 1 の組み合わせを 2 進数の桁として足すと作れる。
- `cross join` の行数は掛け算になるので、桁の数を少なく抑えられる。
- 桁の数を上限から求めると、利用者は上限だけを指定すればよくなる。
