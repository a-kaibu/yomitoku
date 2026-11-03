---
title: "列を行に変える unpivot マクロ"
description: "dbt-utils の unpivot。横に並んだ複数の列を、列名と値の組の縦に変える。対象の列を取り除きながら、結果の型をそろえる。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/unpivot.sql
lines: [19, 36]
function: "default__unpivot"
difficulty: 3
tags: [データ構造, イディオム]
format: 2
---

## ひとことで

`unpivot` は、表の横に並んだ列を、「列名」と「値」の 2 列を持つ縦長の表に変えるマクロです。`pandas` の `melt()` と同じ考え方です。列が増えても、マクロの呼び出しを変えるだけで済みます。

## コード

```sql:line-numbers=19
{% macro default__unpivot(relation=none, cast_to='varchar', exclude=none, remove=none, field_name='field_name', value_name='value', quote_identifiers=False) -%}

    {% if not relation %}
        {{ exceptions.raise_compiler_error("Error: argument `relation` is required for `unpivot` macro.") }}
    {% endif %}

  {%- set exclude = exclude if exclude is not none else [] %}
  {%- set remove = remove if remove is not none else [] %}

  {%- set include_cols = [] %}

  {%- set table_columns = {} %}

  {%- do table_columns.update({relation: []}) %}

  {%- do dbt_utils._is_relation(relation, 'unpivot') -%}
  {%- do dbt_utils._is_ephemeral(relation, 'unpivot') -%}
  {%- set cols = adapter.get_columns_in_relation(relation) %}
```

## 前提知識

- **ピボット（pivot）と逆のピボット（unpivot）**: 縦の表を横に広げるのがピボット、横の表を縦に変えるのが unpivot。
- **`exclude` と `remove`**: 変換の対象から外すキー列と、結果から消す列の指定。
- **`cast`**: 値の型を変換する式。すべての値の型をそろえるために使う。
- **`adapter.get_columns_in_relation`**: 表の列の一覧を、データベースから取得する dbt の関数。

## 何をしているか

### 1. 引数を確かめて、既定値を決める

まず、`relation`（対象の表）が無ければエラーで止めます。`exclude` と `remove` は、指定がなければ空の一覧として扱います。

```sql:line-numbers=21
    {% if not relation %}
        {{ exceptions.raise_compiler_error("Error: argument `relation` is required for `unpivot` macro.") }}
    {% endif %}

  {%- set exclude = exclude if exclude is not none else [] %}
  {%- set remove = remove if remove is not none else [] %}
```

### 2. 表の列を調べて、対象を決める

`adapter.get_columns_in_relation()` で、表の列の一覧を取ります。その後、対象から外す列を取り除いて、変換する列を決めます。

```sql:line-numbers=28
  {%- set include_cols = [] %}

  {%- set table_columns = {} %}

  {%- do table_columns.update({relation: []}) %}

  {%- do dbt_utils._is_relation(relation, 'unpivot') -%}
  {%- do dbt_utils._is_ephemeral(relation, 'unpivot') -%}
  {%- set cols = adapter.get_columns_in_relation(relation) %}
```

ここで決まった列の名前が、縦に変えるときの「列名」の候補になります。値の型は `cast_to` で、すべて同じ型にそろえます。

## ここがすごい

- **列の一覧を実行時に取得している**: 列名を利用者が毎回書かなくても、表の構造から変換の対象を決められます。
- **既定値で呼び出しを短くしている**: `exclude` や `remove` を省けるので、単純な場合は引数 1 つで使えます。
- **型をそろえる**: 列ごとに型が違うと縦に並べられないので、`cast_to` で共通の型にします。
- **トレードオフ**: 列の一覧は実行時に決まるので、列が増えたときに結果の形も変わります。下流の処理がそれに耐えられるかを確かめる必要があります。

## まとめ

- 横の列を縦に変えるときは、列名と値の組を作るのが基本の形。
- 列の一覧を実行時に読むと、構造の変化に強いマクロになる。
- 型をそろえる指定は、縦の列を 1 つの型で持つために必要。
