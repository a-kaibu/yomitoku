---
title: "表の全列に NULL の確認を付ける nullcheck_table"
description: "dbt-utils の nullcheck_table。モデルの全列の名前を取り出し、nullcheck マクロに渡して、各列の NULL の扱いを揃えた select 文を作る。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/nullcheck_table.sql
lines: [5, 13]
function: "default__nullcheck_table"
difficulty: 1
tags: [イディオム, API設計]
format: 2
---

## ひとことで

`nullcheck_table` は、表のすべての列に対して、NULL の扱いをそろえた `select` 文を作るマクロです。列を一つずつ書かずに、モデル全体を対象にできます。

## コード

```sql:line-numbers=5
{% macro default__nullcheck_table(relation) %}

  {%- do dbt_utils._is_relation(relation, 'nullcheck_table') -%}
  {%- do dbt_utils._is_ephemeral(relation, 'nullcheck_table') -%}
  {% set cols = adapter.get_columns_in_relation(relation) %}

  select {{ dbt_utils.nullcheck(cols) }}
  from {{relation}}

```

## 前提知識

- **`nullcheck`**: 一つの列の NULL を、別の値に置き換える式を作る dbt のマクロ。
- **`_is_relation`、`_is_ephemeral`**: 渡されたものが表やビューか、一時的なモデルでないかを確かめる内部のマクロ。
- **`adapter.get_columns_in_relation`**: 表の列の情報を、データベースから取り出す関数。

## 何をしているか

### 1. 対象が表かを確かめる

```sql:line-numbers=7
  {%- do dbt_utils._is_relation(relation, 'nullcheck_table') -%}
  {%- do dbt_utils._is_ephemeral(relation, 'nullcheck_table') -%}
```

渡されたものが、表やビューとして実体があるかを確かめます。一時的なモデルの場合は、ここで止まります。

### 2. 列の一覧を取り、select を作る

```sql:line-numbers=9
  {% set cols = adapter.get_columns_in_relation(relation) %}

  select {{ dbt_utils.nullcheck(cols) }}
  from {{relation}}
```

列の一覧を取り出し、`nullcheck` に渡して、列ごとの式を並べます。その式を `select` の後ろに書き、対象のモデルから読みます。

## ここがすごい

- **列を一つずつ書かずに済む**: 列が増えても、マクロの呼び出しは変わりません。
- **確かめる段階を分ける**: 対象が表でない場合は、誤った SQL を作る前に止まります。
- **既存のマクロを組み合わせる**: 列ごとの処理は `nullcheck` に任せ、この関数は列の一覧だけを担当します。

## まとめ

- 表全体の処理は、列の一覧を取り出して、一列ずつの処理に渡すと書ける。
- 対象の種類を先に確かめると、誤った SQL を防げる。
- 既存の部品を組み合わせると、一つの関数の役割が小さくなる。
