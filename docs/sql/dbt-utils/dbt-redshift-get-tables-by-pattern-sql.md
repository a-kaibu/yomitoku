---
title: "Redshift の外部表も含めて表を探す redshift__get_tables_by_pattern_sql"
description: "dbt-utils の redshift__get_tables_by_pattern_sql。通常の表の一覧と、外部表の一覧を union all でつなぎ、種類を external として一緒に返す。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/get_tables_by_pattern_sql.sql
lines: [19, 43]
function: "redshift__get_tables_by_pattern_sql"
difficulty: 3
tags: [データ構造, API設計]
format: 2
---

## ひとことで

`redshift__get_tables_by_pattern_sql` は、Redshift 向けの表の検索の SQL です。Redshift では、外部の表が通常の情報スキーマに入らないため、別のシステムの表を読んで、結果を一つにまとめています。

## コード

```sql:line-numbers=19
{% macro redshift__get_tables_by_pattern_sql(schema_pattern, table_pattern, exclude='', database=target.database) %}

    {% set sql %}
        select distinct
            table_schema as {{ adapter.quote('table_schema') }},
            table_name as {{ adapter.quote('table_name') }},
            {{ dbt_utils.get_table_types_sql() }}
        from "{{ database }}"."information_schema"."tables"
        where table_schema ilike '{{ schema_pattern }}'
        and table_name ilike '{{ table_pattern }}'
        and table_name not ilike '{{ exclude }}'
        union all
        select distinct
            schemaname as {{ adapter.quote('table_schema') }},
            tablename as {{ adapter.quote('table_name') }},
            'external' as {{ adapter.quote('table_type') }}
        from svv_external_tables
        where redshift_database_name = '{{ database }}'
        and schemaname ilike '{{ schema_pattern }}'
        and table_name ilike '{{ table_pattern }}'
        and table_name not ilike '{{ exclude }}'
    {% endset %}

    {{ return(sql) }}
{% endmacro %}
```

## 前提知識

- **Redshift の外部表**: 外部のストレージにあるデータを、表のように読むための仕組み。
- **`svv_external_tables`**: Redshift の外部表の一覧を持つシステムの表。
- **`union all`**: 二つの結果を、重複を消さずに縦につなぐ演算。
- **`{% set sql %}` ブロック**: Jinja で、複数行の文字列を変数にまとめる書き方。

## 何をしているか

### 1. 通常の表の一覧を作る

```sql:line-numbers=22
        select distinct
            table_schema as {{ adapter.quote('table_schema') }},
            table_name as {{ adapter.quote('table_name') }},
            {{ dbt_utils.get_table_types_sql() }}
        from "{{ database }}"."information_schema"."tables"
        where table_schema ilike '{{ schema_pattern }}'
        and table_name ilike '{{ table_pattern }}'
        and table_name not ilike '{{ exclude }}'
```

情報スキーマの表から、スキーマ名、表名、種類を取り出し、パターンで絞ります。

### 2. 外部表の一覧を作る

```sql:line-numbers=31
        select distinct
            schemaname as {{ adapter.quote('table_schema') }},
            tablename as {{ adapter.quote('table_name') }},
            'external' as {{ adapter.quote('table_type') }}
        from svv_external_tables
        where redshift_database_name = '{{ database }}'
        and schemaname ilike '{{ schema_pattern }}'
        and table_name ilike '{{ table_pattern }}'
        and table_name not ilike '{{ exclude }}'
```

外部表は `svv_external_tables` から読みます。種類は固定の文字列 `external` にして、通常の表と同じ列の形に合わせています。

### 3. 二つをつなぐ

```sql:line-numbers=30
        union all
```

`union all` で二つの結果を縦につなぎます。列の名前と型をそろえておくと、一つの表として読めます。

## ここがすごい

- **データベースの違いを列の形で吸収する**: 外部表も、同じ三つの列の形で返すので、呼び出し側は違いを意識しません。
- **種類を固定の値で表す**: 外部表には `external` という印を付けて、通常の表と区別できます。
- **`union all` で一度に集める**: 二つの検索を一つの問い合わせにまとめ、結果を一度に得られます。

## まとめ

- 別の情報源の結果は、列の形をそろえて `union all` でつなぐ。
- 種類の違いは、固定の値を一つの列に入れて区別する。
- データベースごとの版は、同じ形の結果を返すように揃えると使いやすい。
