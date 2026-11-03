---
title: "NOT NULL 制約も CHECK として見せるビュー"
description: "information_schema.check_constraints。CHECK 制約と NOT NULL 制約を UNION ALL でつなぎ、NOT NULL は「列 IS NOT NULL」の条件文に書き換えて一覧する。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [431, 441]
function: "check_constraints"
difficulty: 2
tags: [型システム, API設計]
format: 2
---

## ひとことで

`check_constraints` は、テーブルやドメインに付いている CHECK 制約の一覧を返すビューです。PostgreSQL では NOT NULL も内部的には別の種類の制約ですが、このビューでは「列 IS NOT NULL」という CHECK の条件文に書き換えて、同じ一覧に並べています。

## コード

```sql:line-numbers=431
CREATE VIEW check_constraints AS
    SELECT CAST(current_database() AS sql_identifier) AS constraint_catalog,
           CAST(rs.nspname AS sql_identifier) AS constraint_schema,
           CAST(con.conname AS sql_identifier) AS constraint_name,
           CAST(pg_get_expr(con.conbin, coalesce(c.oid, 0)) AS character_data) AS check_clause
    FROM pg_constraint con
           LEFT OUTER JOIN pg_namespace rs ON (rs.oid = con.connamespace)
           LEFT OUTER JOIN pg_class c ON (c.oid = con.conrelid)
           LEFT OUTER JOIN pg_type t ON (t.oid = con.contypid)
    WHERE pg_has_role(coalesce(c.relowner, t.typowner), 'USAGE')
      AND con.contype = 'c'
```

## 前提知識

- **制約（constraint）**: 表の値が満たすべき条件。CHECK（条件式）、NOT NULL（空を許さない）、外部キーなどがある。
- **`pg_constraint`**: 制約の情報を持つ内部テーブル。`contype` が種類を表す（`'c'` は CHECK、`'n'` は NOT NULL）。
- **`UNION ALL`**: 2 つの問い合わせの結果を縦につなぐ。重複は取り除かない。
- **`LEFT OUTER JOIN`**: 左の表の行を残し、対応が無いときは右の列を `NULL` にする結合。
- **`pg_has_role()`**: 現在のユーザーが、指定したロールの権限を持つかを返す関数。

## 何をしているか

### 1. CHECK 制約の一覧を作る

まず、`contype` が `'c'` の制約を選び、条件式の文字列を `pg_get_expr()` で取り出します。

```sql:line-numbers=431
CREATE VIEW check_constraints AS
    SELECT CAST(current_database() AS sql_identifier) AS constraint_catalog,
           CAST(rs.nspname AS sql_identifier) AS constraint_schema,
           CAST(con.conname AS sql_identifier) AS constraint_name,
           CAST(pg_get_expr(con.conbin, coalesce(c.oid, 0)) AS character_data) AS check_clause
```

テーブルの持ち主か、ドメインの持ち主でないと見えないように、`pg_has_role()` で絞ります。

```sql:line-numbers=436
    FROM pg_constraint con
           LEFT OUTER JOIN pg_namespace rs ON (rs.oid = con.connamespace)
           LEFT OUTER JOIN pg_class c ON (c.oid = con.conrelid)
           LEFT OUTER JOIN pg_type t ON (t.oid = con.contypid)
    WHERE pg_has_role(coalesce(c.relowner, t.typowner), 'USAGE')
      AND con.contype = 'c'
```

`coalesce(c.relowner, t.typowner)` は、テーブルの制約なら所有者、ドメインの制約なら型の所有者を使うという意味です。

### 2. NOT NULL 制約を CHECK の形に書き換える

続く部分は、`contype = 'n'` の NOT NULL 制約を、条件文に変えて同じ列に並べます。

```sql:line-numbers=445
    SELECT current_database()::information_schema.sql_identifier AS constraint_catalog,
           rs.nspname::information_schema.sql_identifier AS constraint_schema,
           con.conname::information_schema.sql_identifier AS constraint_name,
           pg_catalog.format('%s IS NOT NULL', coalesce(at.attname, 'VALUE'))::information_schema.character_data AS check_clause
```

`format('%s IS NOT NULL', ...)` が、列名から `列名 IS NOT NULL` という文字列を作ります。ここでは、制約の対象の列を `con.conkey[1]` で取り出しています。

```sql:line-numbers=449
     FROM pg_constraint con
            LEFT JOIN pg_namespace rs ON rs.oid = con.connamespace
            LEFT JOIN pg_class c ON c.oid = con.conrelid
            LEFT JOIN pg_type t ON t.oid = con.contypid
            LEFT JOIN pg_attribute at ON (con.conrelid = at.attrelid AND con.conkey[1] = at.attnum)
     WHERE pg_has_role(coalesce(c.relowner, t.typowner), 'USAGE'::text)
       AND con.contype = 'n';
```

## ここがすごい

- **1 つのビューに、違う種類の制約をまとめている**: 利用者は NOT NULL と CHECK を区別せずに条件の一覧を読めます。
- **内部の表現を、利用者の言葉に変えている**: `'n'` という内部の記号を、SQL で普通に読める条件文に変換しています。
- **権限の判定を結合の後に行っている**: 見せてよい持ち主の制約だけが返るため、一覧が情報の漏えいにならないように設計されています。
- **トレードオフ**: NOT NULL を条件文にすると、もとの制約の種類は見えなくなります。種類が必要な場合は `pg_constraint` を直接読みます。

## まとめ

- 内部では別の種類でも、利用者の観点で揃えると一覧が使いやすくなる。
- `UNION ALL` は、違う種類の行を縦にまとめるときの基本の形。
- 権限の判定は、見せる行を決める最後の段階で行うと安全に作れる。
