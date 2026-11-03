---
title: "名前のパターンで表を探す SQL を作る get_tables_by_pattern_sql"
description: "dbt-utils の get_tables_by_pattern_sql。スキーマ名、表名、除外のパターンを ILIKE で照合する問い合わせの文字列を作る。データベースごとに別の版を持つ。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/get_tables_by_pattern_sql.sql
lines: [6, 17]
function: "default__get_tables_by_pattern_sql"
difficulty: 2
tags: [正規表現, API設計]
format: 2
---

## ひとことで

`get_tables_by_pattern_sql` は、名前のパターンで表を探すための SQL の文字列を作るマクロです。実際に実行するのは別のマクロで、この関数は問い合わせの形を組み立てる役割だけを持ちます。

## コード

```sql:line-numbers=6
{% macro default__get_tables_by_pattern_sql(schema_pattern, table_pattern, exclude='', database=target.database) %}

        select distinct
            table_schema as {{ adapter.quote('table_schema') }},
            table_name as {{ adapter.quote('table_name') }},
            {{ dbt_utils.get_table_types_sql() }}
        from {{ database }}.information_schema.tables
        where table_schema ilike '{{ schema_pattern }}'
        and table_name ilike '{{ table_pattern }}'
        and table_name not ilike '{{ exclude }}'

{% endmacro %}
```

## 前提知識

- **`ILIKE`**: 大文字小文字を区別せずに、パターンで文字列を照合する演算子。PostgreSQL の拡張。
- **`information_schema.tables`**: 表とビューの一覧を持つ、標準の情報スキーマの表。
- **`adapter.quote`**: 列の名前を、そのデータベースの作法で引用符に囲む関数。
- **`not ilike`**: パターンに一致しないものを選ぶ条件。除外に使う。

## 何をしているか

### 1. 結果の列を引用して並べる

```sql:line-numbers=9
            table_schema as {{ adapter.quote('table_schema') }},
            table_name as {{ adapter.quote('table_name') }},
            {{ dbt_utils.get_table_types_sql() }}
```

`table_schema` と `table_name` を、データベースの作法で引用して並べます。種類の列は、別のマクロ `get_table_types_sql` から取ります。

### 2. パターンで絞り込む

```sql:line-numbers=12
        from {{ database }}.information_schema.tables
        where table_schema ilike '{{ schema_pattern }}'
        and table_name ilike '{{ table_pattern }}'
        and table_name not ilike '{{ exclude }}'
```

スキーマ名と表名は `ilike` で、除外する名前は `not ilike` で照合します。パターンはそのまま SQL の文字列に埋め込まれます。

## ここがすごい

- **データベースの違いを引用で吸収する**: 引用の作法をアダプタに任せているので、同じ書き方で複数の種類のデータベースに対応できます。
- **除外も同じ仕組みで書く**: 含める条件と除外の条件を、並べて読めます。
- **組み立てを一か所にまとめる**: 検索の SQL を一つのマクロに集めたので、別のマクロから再利用されます。

## まとめ

- 問い合わせの文字列を作る関数と、それを実行する関数は分けると再利用しやすい。
- データベースごとの違いは、引用などの部品に任せる。
- 除外の条件を同じ仕組みで書くと、読み手が条件を追いやすい。
