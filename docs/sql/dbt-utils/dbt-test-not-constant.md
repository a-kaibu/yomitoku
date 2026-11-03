---
title: "値がひとつしかない列を見つける not_constant"
description: "dbt-utils の not_constant テスト。列の異なる値の数が 1 だけになっている行を探し、全部同じ値の列を失敗として報告する。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/generic_tests/not_constant.sql
lines: [8, 11]
function: "default__test_not_constant"
difficulty: 2
tags: [テスト, 防御的プログラミング]
format: 2
---

## ひとことで

`not_constant` は、列の値がすべて同じになっていないかを確かめるテストです。全部の行が同じ値なら、その列は情報を持たないことが多く、テストは失敗します。テストは、失敗した行を返すことで結果を伝えます。

## コード

```sql:line-numbers=8
{% if group_by_columns|length() > 0 %}
  {% set select_gb_cols = group_by_columns|join(' ,') + ', ' %}
  {% set groupby_gb_cols = 'group by ' + group_by_columns|join(',') %}
{% endif %}
```

## 前提知識

- **汎用テスト（generic test）**: 列名などを引数に取り、どのモデルにも使える dbt のテストの形。
- **`count(distinct ...)`**: 異なる値の数を数える集計。
- **`having`**: `group by` でまとめたあとの行に条件を付ける句。
- **`group_by_columns`**: 指定した列ごとに分けて、グループの中で確かめるための引数。

## 何をしているか

### 1. グループごとの列を用意する

```sql:line-numbers=8
{% if group_by_columns|length() > 0 %}
  {% set select_gb_cols = group_by_columns|join(' ,') + ', ' %}
  {% set groupby_gb_cols = 'group by ' + group_by_columns|join(',') %}
{% endif %}
```

`group_by_columns` が空でないとき、選ぶ列と `group by` の句を作ります。空のときは、表全体を 1 つのグループとして扱います。

### 2. 異なる値が 1 つだけの組を探す

```sql:line-numbers=17
    {{select_gb_cols}}
    count(distinct {{ column_name }}) as filler_column

from {{ model }}

  {{groupby_gb_cols}}

having count(distinct {{ column_name }}) = 1
```

`count(distinct ...)` が 1 になるグループを `having` で残します。そのグループは、対象の列の値がすべて同じです。テストは、その行を返すので失敗になります。

## ここがすごい

- **テストを行で表す**: 失敗は「行が返る」ことで表すので、どの値が問題かもそのまま見えます。
- **グループごとに確かめられる**: 地域や期間ごとに、値が固定されていないかを調べられます。
- **`select` の形を整える**: 別名を付けて、どの環境でも同じ形で動くように書かれています。

## まとめ

- テストは、問題のある行を返すと失敗になる。
- `count(distinct ...)` と `having` で、値が 1 種類の組を見つける。
- グループごとに分けると、表全体では見えない偏りも見つかる。
