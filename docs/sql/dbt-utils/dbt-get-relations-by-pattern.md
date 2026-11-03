---
title: "名前のパターンで表を探す get_relations_by_pattern"
description: "dbt-utils の get_relations_by_pattern。スキーマ名と表名のパターンで情報スキーマを検索し、見つかった表を dbt の Relation の一覧にして返す。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/get_relations_by_pattern.sql
lines: [5, 31]
function: "default__get_relations_by_pattern"
difficulty: 3
tags: [正規表現, データ構造]
format: 2
---

## ひとことで

`get_relations_by_pattern` は、名前の規則に合う表やビューを、データベースから探して一覧にするマクロです。たとえば「`raw_` で始まるすべての表」を、一度の呼び出しで集められます。

## コード

```sql:line-numbers=5
{% macro default__get_relations_by_pattern(schema_pattern, table_pattern, exclude='', database=target.database) %}

    {%- call statement('get_tables', fetch_result=True) %}

      {{ dbt_utils.get_tables_by_pattern_sql(schema_pattern, table_pattern, exclude, database) }}

    {%- endcall -%}

    {%- set table_list = load_result('get_tables') -%}

    {%- if table_list and table_list['table'] -%}
        {%- set tbl_relations = [] -%}
        {%- for row in table_list['table'] -%}
            {%- set tbl_relation = api.Relation.create(
                database=database,
                schema=row.table_schema,
                identifier=row.table_name,
                type=row.table_type
            ) -%}
            {%- do tbl_relations.append(tbl_relation) -%}
        {%- endfor -%}

        {{ return(tbl_relations) }}
    {%- else -%}
        {{ return([]) }}
    {%- endif -%}

```

## 前提知識

- **パターン（ILIKE）**: `%` を任意の文字列、`_` を一文字とみなす、大文字小文字を区別しない照合。
- **`information_schema.tables`**: 表とビューの情報を持つ、標準の情報スキーマの表。
- **`api.Relation.create`**: データベース、スキーマ、名前、種類から、dbt の Relation の値を作る関数。
- **`statement`**: 問い合わせを実行して、結果を後で読めるようにする仕組み。

## 何をしているか

### 1. 検索の問い合わせを実行する

```sql:line-numbers=7
    {%- call statement('get_tables', fetch_result=True) %}

      {{ dbt_utils.get_tables_by_pattern_sql(schema_pattern, table_pattern, exclude, database) }}

    {%- endcall -%}
```

スキーマ名と表名のパターンを使った問い合わせを、`get_tables` という名前で実行します。問い合わせの組み立ては、別のマクロに任せています。

### 2. 結果を Relation にする

```sql:line-numbers=13
    {%- set table_list = load_result('get_tables') -%}

    {%- if table_list and table_list['table'] -%}
        {%- set tbl_relations = [] -%}
        {%- for row in table_list['table'] -%}
            {%- set tbl_relation = api.Relation.create(
                database=database,
                schema=row.table_schema,
                identifier=row.table_name,
                type=row.table_type
            ) -%}
            {%- do tbl_relations.append(tbl_relation) -%}
        {%- endfor -%}
```

見つかった表の一行ずつに、データベース、スキーマ、名前、種類を渡して、Relation を作ります。作ったものは、一つの一覧に入れていきます。

### 3. 見つからないときは空の一覧を返す

```sql:line-numbers=27
        {{ return(tbl_relations) }}
    {%- else -%}
        {{ return([]) }}
```

結果が空なら、空の一覧を返します。これで、呼び出し側は結果の有無を気にせず使えます。

## ここがすごい

- **名前の規則で表をまとめて扱う**: 一つずつ名前を書かずに、対象の表をまとめて指定できます。
- **結果を型のある値にする**: Relation にするので、後の処理で名前や種類を安全に使えます。
- **空の場合も同じ型を返す**: 見つからなくても一覧が返るので、呼び出し側の分岐が減ります。

## まとめ

- 名前の規則は、パターンの照合で一度にまとめて検索できる。
- 検索結果は、型のある値に変えて返すと後で使いやすい。
- 空の結果も同じ型で返すと、呼び出し側が簡単になる。
