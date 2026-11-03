---
title: "値が空でない割合を計算して範囲で確かめる"
description: "dbt-utils の not_null_proportion テスト。sum(case) を count(*) で割って、NULL でない行の割合を求め、指定した範囲から外れたグループを失敗にする。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/generic_tests/not_null_proportion.sql
lines: [16, 22]
function: "default__test_not_null_proportion"
difficulty: 2
tags: [数値計算, 防御的プログラミング]
format: 2
---

## ひとことで

`not_null_proportion` は、ある列の値がどれくらい埋まっているかを割合で確かめるテストです。「90% 以上は値がある」といった決まりを、テストとして書けます。グループごとに割合を求めることもできます。

## コード

```sql:line-numbers=16
with validation as (
  select
    {{select_gb_cols}}
    sum(case when {{ column_name }} is null then 0 else 1 end) / cast(count(*) as {{ dbt.type_numeric() }}) as not_null_proportion
  from {{ model }}
  {{groupby_gb_cols}}
),
```

## 前提知識

- **割合**: 全体の中で、条件に当てはまるものの比率。
- **`sum(case when ... then 0 else 1 end)`**: 条件に当たらない行を 1 として数える書き方。ここでは `NULL` でない行の数になる。
- **`count(*)`**: グループの行の総数。
- **整数の割り算**: 整数どうしを割ると、小数が切り捨てられることがある。`cast` で小数の型にそろえて防ぐ。
- **`group by`**: グループごとに集計する指定。

## 何をしているか

### 1. 埋まっている行の割合を求める

`case when 列 is null then 0 else 1 end` で、値がある行を 1 として足し、全体の行数で割ります。

```sql:line-numbers=17
  select
    {{select_gb_cols}}
    sum(case when {{ column_name }} is null then 0 else 1 end) / cast(count(*) as {{ dbt.type_numeric() }}) as not_null_proportion
```

`cast(count(*) as numeric)` は、分母を小数の型にします。これを忘れると、整数の割り算で割合が 0 か 1 になってしまいます。

### 2. グループごとの集計にする

グループの指定があれば、`group by` で割合を別々に求めます。

```sql:line-numbers=20
  from {{ model }}
  {{groupby_gb_cols}}
```

### 3. 範囲から外れたグループを返す

割合が、指定の下限より低いか、上限より高いものを返します。

```sql:line-numbers=23
validation_errors as (
  select
    {{select_gb_cols}}
    not_null_proportion
  from validation
  where not_null_proportion < {{ at_least }} or not_null_proportion > {{ at_most }}
)
```

`at_least` と `at_most` の既定値は、`at_most` が `1` なので、上限を気にせず下限だけを指定することもできます。

## ここがすごい

- **1 つの式で割合を表す**: 値のある行を数える処理を、`case` と `sum` の組み合わせで書けます。
- **型を明示して割り算の誤りを防ぐ**: 整数どうしの割り算で結果が変わる、という典型的な落とし穴を、`cast` で避けています。
- **同じ形を集計とテストの両方に使う**: グループの有無で `select` の列だけが変わり、全体の形は同じです。
- **トレードオフ**: 割合は全体を平均しているので、一部だけ極端に空の値があっても、全体の割合では目立たないことがあります。

## まとめ

- 埋まっている割合は、`sum(case)` を行数で割ると求められる。
- 割り算では、整数の割り算に注意して、小数の型に変換する。
- 割合の範囲をテストにすると、データの品質の決まりを書いて守れる。
