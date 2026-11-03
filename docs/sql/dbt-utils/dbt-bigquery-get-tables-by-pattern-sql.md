---
title: "BigQuery で複数のスキーマから表を探す bigquery__get_tables_by_pattern_sql"
description: "dbt-utils の bigquery__get_tables_by_pattern_sql。スキーマ名に % が含まれるときは一覧から該当するスキーマを選び、それぞれの INFORMATION_SCHEMA を union all でつなぐ。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/get_tables_by_pattern_sql.sql
lines: [46, 72]
function: "bigquery__get_tables_by_pattern_sql"
difficulty: 3
tags: [正規表現, データ構造]
format: 2
---

## ひとことで

`bigquery__get_tables_by_pattern_sql` は、BigQuery で表を探す SQL を作るマクロです。BigQuery では、スキーマが複数あることが多いので、名前のパターンに合うスキーマを先に探し、それぞれで表を検索して、結果をまとめます。

## コード

```sql:line-numbers=46
{% macro bigquery__get_tables_by_pattern_sql(schema_pattern, table_pattern, exclude='', database=target.database) %}

    {% if '%' in schema_pattern %}
        {% set schemata=dbt_utils._bigquery__get_matching_schemata(schema_pattern, database) %}
    {% else %}
        {% set schemata=[schema_pattern] %}
    {% endif %}

    {% set sql %}
        {% for schema in schemata %}
            select distinct
                table_schema,
                table_name,
                {{ dbt_utils.get_table_types_sql() }}

            from {{ adapter.quote(database) }}.{{ schema }}.INFORMATION_SCHEMA.TABLES
            where lower(table_name) like lower ('{{ table_pattern }}')
                and lower(table_name) not like lower ('{{ exclude }}')

            {% if not loop.last %} union all {% endif %}

        {% endfor %}
    {% endset %}

    {{ return(sql) }}

{% endmacro %}
```

## 前提知識

- **データセット（スキーマ）**: BigQuery で表をまとめる単位。PostgreSQL のスキーマに近い。
- **`INFORMATION_SCHEMA`**: データセットごとの表の情報を持つ、標準の情報スキーマ。
- **`run_query`**: Jinja から、問い合わせを実行して結果を返す dbt の関数。
- **`loop.last`**: 繰り返しの中で、今が最後の回かを表す変数。

## 何をしているか

### 1. スキーマの名前を決める

```sql:line-numbers=48
    {% if '%' in schema_pattern %}
        {% set schemata=dbt_utils._bigquery__get_matching_schemata(schema_pattern, database) %}
    {% else %}
        {% set schemata=[schema_pattern] %}
    {% endif %}
```

スキーマ名に `%` が含まれるときだけ、パターンに合うスキーマを探します。含まれないときは、名前をそのまま一つの一覧として使います。

### 2. スキーマごとに検索を作る

```sql:line-numbers=55
        {% for schema in schemata %}
            select distinct
                table_schema,
                table_name,
                {{ dbt_utils.get_table_types_sql() }}

            from {{ adapter.quote(database) }}.{{ schema }}.INFORMATION_SCHEMA.TABLES
            where lower(table_name) like lower ('{{ table_pattern }}')
                and lower(table_name) not like lower ('{{ exclude }}')
```

スキーマの一つずつに、表の情報を読む問い合わせを作ります。表の名前は `lower` で比べ、大文字小文字の違いを吸収しています。

### 3. 問い合わせを union all でつなぐ

```sql:line-numbers=65
            {% if not loop.last %} union all {% endif %}
```

最後の回以外には `union all` を付けて、つなぎます。最後の一つには付けないので、余計な `union all` が残りません。

## ここがすごい

- **スキーマを動的に探せる**: 名前のパターンで対象を決めるので、スキーマが増えても書き換えが要りません。
- **大文字小文字を揃える**: 名前の比べ方を統一して、判定の漏れを防いでいます。
- **繰り返しの区切りを最後だけ省く**: 前の記事の `group_by` と同じ、定番の書き方です。

## まとめ

- 複数の対象は、一覧にしてから繰り返し、`union all` でつなぐ。
- 比べる前に大文字小文字をそろえると、判定の漏れを防げる。
- 区切りを最後だけ省く書き方は、繰り返しの定番である。
