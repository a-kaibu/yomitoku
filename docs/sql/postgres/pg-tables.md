---
title: "テーブルの一覧を作る pg_tables"
description: "PostgreSQL の pg_tables ビュー。pg_class に pg_namespace と pg_tablespace を LEFT JOIN し、テーブルの所有者や索引の有無を 1 行で読めるようにしたビュー。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [132, 144]
function: "pg_tables"
difficulty: 2
tags: [API設計, データ構造]
format: 2
---

## ひとことで

`pg_tables` は、データベース内のテーブルを一覧できるビューです。テーブルの本体は `pg_class` という内部の表にありますが、そのままでは番号（OID）が並ぶだけです。このビューは、名前・所有者・表領域などを読める形にまとめています。

## コード

```sql:line-numbers=132
CREATE VIEW pg_tables AS
    SELECT
        N.nspname AS schemaname,
        C.relname AS tablename,
        pg_get_userbyid(C.relowner) AS tableowner,
        T.spcname AS tablespace,
        C.relhasindex AS hasindexes,
        C.relhasrules AS hasrules,
        C.relhastriggers AS hastriggers,
        C.relrowsecurity AS rowsecurity
    FROM pg_class C LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
         LEFT JOIN pg_tablespace T ON (T.oid = C.reltablespace)
    WHERE C.relkind IN ('r', 'p');
```

## 前提知識

- **`pg_class`**: テーブル、索引、ビューなど、関係（リレーション）を 1 つずつ記録したシステムの表。
- **`relkind`**: 関係の種類を 1 文字で表す列。`'r'` は通常のテーブル、`'p'` はパーティションの親テーブル。
- **`LEFT JOIN`**: 左側の行を、右側に対応する行がなくても残す結合。
- **OID**: PostgreSQL が内部で使う数値の識別子。

## 何をしているか

### 1. テーブルだけを選ぶ

```sql:line-numbers=144
    WHERE C.relkind IN ('r', 'p');
```

`WHERE C.relkind IN ('r', 'p')` で、通常のテーブルとパーティションの親テーブルだけを残します。索引やシーケンスは、この段階で除かれます。

### 2. 名前を結合で引く

```sql:line-numbers=142
    FROM pg_class C LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
         LEFT JOIN pg_tablespace T ON (T.oid = C.reltablespace)
```

スキーマ名は `pg_namespace`、表領域名は `pg_tablespace` から取ります。どちらも `LEFT JOIN` なので、表領域の指定が無いテーブルでも行は消えません。その場合 `tablespace` は `NULL` になります。

### 3. 所有者と状態を読める形にする

```sql:line-numbers=136
        pg_get_userbyid(C.relowner) AS tableowner,
```

`pg_get_userbyid(C.relowner)` は所有者の番号を名前に変えます。`hasindexes` や `rowsecurity` などの `bool` の列は、そのまま真偽値として読めます。

## ここがすごい

- **内部の表を、利用者向けの名前に変える**: 利用者は `pg_class` の仕組みを知らなくても、`SELECT * FROM pg_tables` で一覧を得られます。
- **`LEFT JOIN` で欠けた情報を残す**: 表領域が既定のときに行が消えないよう、外部結合を使っています。
- **種類の絞り込みを 1 行で書く**: `relkind` の条件を `IN` で並べるだけで、テーブルの種類を明確に定義しています。

## まとめ

- 内部の表は番号で結ばれているため、ビューで名前に変換して読みやすくしている。
- 存在しないかもしれない情報は `LEFT JOIN` で扱い、行を落とさない。
- 対象の種類は `WHERE` で明示すると、ビューの意味が読み取りやすい。
