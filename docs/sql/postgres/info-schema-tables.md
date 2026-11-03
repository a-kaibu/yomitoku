---
title: "テーブルの種類を CASE で分類する tables ビュー"
description: "information_schema.tables。内部の relkind の 1 文字を BASE TABLE や VIEW などの言葉に変え、自分の一時テーブルだけを LOCAL TEMPORARY として区別する。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [1948, 1966]
function: "tables"
difficulty: 1
tags: [イディオム, 可読性]
format: 2
---

## ひとことで

`tables` は、テーブル・ビュー・外部テーブルなどを一覧するビューです。内部では `relkind` という 1 文字の記号で種類を管理していますが、このビューはそれを `BASE TABLE` や `VIEW` などの言葉に変えて見せます。

## コード

```sql:line-numbers=1948
CREATE VIEW tables AS
    SELECT CAST(current_database() AS sql_identifier) AS table_catalog,
           CAST(nc.nspname AS sql_identifier) AS table_schema,
           CAST(c.relname AS sql_identifier) AS table_name,

           CAST(
             CASE WHEN nc.oid = pg_my_temp_schema() THEN 'LOCAL TEMPORARY'
                  WHEN c.relkind IN ('r', 'p') THEN 'BASE TABLE'
                  WHEN c.relkind = 'v' THEN 'VIEW'
                  WHEN c.relkind = 'f' THEN 'FOREIGN'
                  ELSE null END
             AS character_data) AS table_type,

           CAST(null AS sql_identifier) AS self_referencing_column_name,
           CAST(null AS character_data) AS reference_generation,

           CAST(CASE WHEN t.typname IS NOT NULL THEN current_database() ELSE null END AS sql_identifier) AS user_defined_type_catalog,
           CAST(nt.nspname AS sql_identifier) AS user_defined_type_schema,
           CAST(t.typname AS sql_identifier) AS user_defined_type_name,
```

## 前提知識

- **リレーション**: テーブル、ビュー、インデックスなど、名前を持つデータベースの対象の総称。`pg_class` という内部テーブルに入る。
- **`relkind`**: リレーションの種類を表す 1 文字の記号。`'r'` は通常のテーブル、`'v'` はビュー、`'f'` は外部テーブル、`'p'` はパーティションされたテーブル。
- **一時テーブル**: セッションの間だけ存在するテーブル。自分のセッション用の一時スキーマに作られる。
- **`CAST(... AS character_data)`**: 値を情報スキーマの型に変換する書き方。

## 何をしているか

### 1. 名前とスキーマを揃えて取り出す

まず、データベース名、スキーマ名、テーブル名を、情報スキーマ用の型に変換して並べます。

```sql:line-numbers=1949
    SELECT CAST(current_database() AS sql_identifier) AS table_catalog,
           CAST(nc.nspname AS sql_identifier) AS table_schema,
           CAST(c.relname AS sql_identifier) AS table_name,
```

`CAST(... AS sql_identifier)` で、標準の定義にある識別子の型に揃えています。

### 2. `relkind` の 1 文字を言葉に変える

種類の分類は、`CASE` の上から順番に判定します。

```sql:line-numbers=1953
           CAST(
             CASE WHEN nc.oid = pg_my_temp_schema() THEN 'LOCAL TEMPORARY'
                  WHEN c.relkind IN ('r', 'p') THEN 'BASE TABLE'
                  WHEN c.relkind = 'v' THEN 'VIEW'
                  WHEN c.relkind = 'f' THEN 'FOREIGN'
                  ELSE null END
             AS character_data) AS table_type,
```

最初の条件 `nc.oid = pg_my_temp_schema()` は、自分のセッションの一時スキーマかどうかを確かめます。他人の一時テーブルは、一覧に `LOCAL TEMPORARY` として出ません。その後に、`'r'` と `'p'` を `BASE TABLE`、`'v'` を `VIEW` のように言葉に変えています。

### 3. 対応しない種類は NULL にする

どの条件にも当たらなければ、`ELSE null` によって種類は空になります。想定外の種類を、間違った名前で表示しないための配慮です。

## ここがすごい

- **条件の順番に意味がある**: 一時スキーマの判定を先に行うことで、通常のテーブルの分類より優先されます。
- **記号を言葉に変える**: `'r'` や `'v'` を覚えなくても、利用者は `BASE TABLE` と読むだけで種類が分かります。
- **不明なものは `NULL` にする**: 新しい種類が増えても、誤った名前で表示されることがありません。
- **トレードオフ**: `CASE` の条件が多いので、新しい種類を加えるときは、順番まで含めて見直す必要があります。

## まとめ

- 内部の 1 文字の記号は、`CASE` で言葉に変換すると読みやすくなる。
- 判定の順番は、意味の優先度をそのまま表す。
- 知らない値を `ELSE null` で扱うと、誤った表示を防げる。
