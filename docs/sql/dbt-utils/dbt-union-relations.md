---
title: "列の違う表を、列の和集合にそろえて union する"
description: "dbt-utils の union_relations。複数の表の列を集めて和集合の列の並びを作り、無い列は null で埋めて、型をそろえた SELECT を union all でつなぐ。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/union.sql
lines: [112, 119]
function: "default__union_relations"
difficulty: 3
tags: [データ構造, 型システム]
format: 2
---

## ひとことで

`union_relations` は、列の構成が少しずつ違う複数の表を、1 つの表にまとめるマクロです。すべての表の列を集めて和集合を作り、ある表に無い列は `null` で埋めます。型も指定して揃えるので、`union all` でそのまま連結できます。

## コード

```sql:line-numbers=112
                {% for col_name in ordered_column_names -%}

                    {%- set col = column_superset[col_name] %}
                    {%- set col_type = column_override.get(col.column, col.data_type) %}
                    {%- set col_name = adapter.quote(col_name) if col_name in relation_columns[relation] else 'null' %}
                    cast({{ col_name }} as {{ col_type }}) as {{ col.quoted }} {% if not loop.last %},{% endif -%}

                {%- endfor %}
```

## 前提知識

- **`union all`**: 複数の `select` の結果を縦につなぐ。列の数と型が合っている必要がある。
- **和集合（列の superset）**: 全部の表の列を、重複なく並べたもの。
- **`cast(... as 型)`**: 値の型を指定して変換する式。
- **`adapter.quote()`**: 列名を、データベースの形式に合わせて引用符で囲む関数。
- **`null`**: 値が無いことを表す。列が無い表では、その列の値として使う。

## 何をしているか

### 1. 表の列を、和集合に追加していく

各表の列を調べ、まだ和集合に無い列は追加します。列の型は、後の段階で使うために保存しておきます。

```sql:line-numbers=35
    {%- for relation in relations -%}

        {%- do relation_columns.update({relation: []}) -%}

        {%- do dbt_utils._is_relation(relation, 'union_relations') -%}
        {%- do dbt_utils._is_ephemeral(relation, 'union_relations') -%}
        {%- set cols = adapter.get_columns_in_relation(relation) -%}
```

同じ名前の列があったときは、文字列の長さが長い方を残すような調整もしています。

```sql:line-numbers=56
            {%- if col.column in column_superset -%}

                {%- set stored = column_superset[col.column] -%}
                {%- if col.is_string() and stored.is_string() and col.string_size() > stored.string_size() -%}

                    {%- do column_superset.update({col.column: col}) -%}
```

### 2. 表ごとに、無い列を null で埋める

各表の `select` では、和集合の列を順に並べます。その表に列があれば名前を書き、無ければ `null` を書きます。

```sql:line-numbers=112
                {% for col_name in ordered_column_names -%}

                    {%- set col = column_superset[col_name] %}
                    {%- set col_type = column_override.get(col.column, col.data_type) %}
                    {%- set col_name = adapter.quote(col_name) if col_name in relation_columns[relation] else 'null' %}
                    cast({{ col_name }} as {{ col_type }}) as {{ col.quoted }} {% if not loop.last %},{% endif -%}

                {%- endfor %}
```

`cast(... as 型)` で、どの表でも同じ型にそろえます。これで、列の数と型が揃った `select` になります。

### 3. 表どうしを union all でつなぐ

最後に、それぞれの `select` を `union all` でつなぎます。

```sql:line-numbers=128
        {% if not loop.last -%}
            union all
        {% endif -%}
```

## ここがすごい

- **列の違いを吸収する**: 表ごとに列が違っていても、和集合の列を基準に、足りない分を `null` で埋めます。利用者は、列の一覧を手で書かずに済みます。
- **型を揃えてから連結する**: `cast` で型をそろえることで、データベースが型の違いで失敗するのを防いでいます。
- **同じ列の型を広く選ぶ**: 文字列の長さが違うときは、長い方を選ぶことで、どの値も切り捨てられません。
- **トレードオフ**: 列の和集合は、実行時の表の状態で決まります。表の列が変わると、結果の列の並びも変わります。

## まとめ

- 列の違う表をつなぐときは、和集合の列を基準に `null` で埋めると揃う。
- 型は `cast` で明示すると、データベースの違いによる失敗を防げる。
- 結果の形が実行時に変わることを意識して、下流の処理と合わせて確かめる。
