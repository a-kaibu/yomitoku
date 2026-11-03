---
title: "二つの列の値の種類が同じかを比べる cardinality_equality"
description: "dbt-utils の cardinality_equality テスト。二つの列の値ごとの行数を数え、except と union all で、片方にしか無い値や行数の違いを集める。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright (c) 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/generic_tests/cardinality_equality.sql
lines: [10, 24]
function: "default__test_cardinality_equality"
difficulty: 3
tags: [テスト, データ構造]
format: 2
---

## ひとことで

`cardinality_equality` は、二つの列が同じ値の集まりを、同じ回数ずつ持っているかを確かめるテストです。外部キーの確認よりも厳しく、片方にしか無い値や、出現数の違いも見つけます。

## コード

```sql:line-numbers=10
with table_a as (
select
  {{ column_name }},
  count(*) as num_rows
from {{ model }}
group by {{ column_name }}
),

table_b as (
select
  {{ field }},
  count(*) as num_rows
from {{ to }}
group by {{ field }}
),
```

## 前提知識

- **カーディナリティ**: 列に含まれる、異なる値の数や、値の出現の仕方のこと。
- **`except`**: 左の結果から右の結果にある行を取り除く集合演算。
- **`union all`**: 二つの結果を、重複を消さずに縦に並べる演算。
- **`dbt.except()`**: 方言の違いを吸収するために dbt が用意した `except` の書き方。

## 何をしているか

### 1. 値ごとの行数を数える

```sql:line-numbers=10
with table_a as (
select
  {{ column_name }},
  count(*) as num_rows
from {{ model }}
group by {{ column_name }}
),

table_b as (
select
  {{ field }},
  count(*) as num_rows
from {{ to }}
group by {{ field }}
),
```

それぞれの列を `group by` し、値ごとの行数を数えます。`table_a` と `table_b` の二つの表を作ります。

### 2. 差を両方向から集める

```sql:line-numbers=26
except_a as (
  select *
  from table_a
  {{ dbt.except() }}
  select *
  from table_b
),

except_b as (
  select *
  from table_b
  {{ dbt.except() }}
  select *
  from table_a
),
```

`except_a` は、A にあって B に無い行を集めます。`except_b` はその逆です。どちらも行ごとの値と行数の組で比べます。

## ここがすごい

- **値と回数を一緒に比べる**: 値の有無だけでなく、出現の回数の違いも同じ仕組みで拾えます。
- **方向を分けて集める**: 片方向だけでは見落とす違いを、両方向の差で補っています。
- **方言の差を `dbt.except()` が吸収する**: 同じテストを、異なるデータベースで動かせます。

## まとめ

- 値ごとに行数を数えてから、集合の差を取る。
- 両方向の差を `union all` で合わせると、食い違いをまとめて見られる。
- 方言の差は、dbt の関数に任せると書き直しが少ない。
