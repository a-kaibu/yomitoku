---
title: "照合順序の使用権限を表す usage_privileges"
description: "PostgreSQL の usage_privileges ビュー。照合順序には実際の権限がないため、すべての照合順序に暗黙の USAGE 権限があるものとして一覧に出す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [2249, 2262]
function: "usage_privileges"
difficulty: 3
tags: [セキュリティ, 型システム]
format: 2
---

## ひとことで

`usage_privileges` は、データベースのオブジェクトに対する USAGE 権限を一覧にするビューです。照合順序（collation）には、本当の権限の記録がありません。そのため、このビューは、すべての照合順序が全員に USAGE 権限を持つものとして見せています。

## コード

```sql:line-numbers=2249
    SELECT CAST(u.rolname AS sql_identifier) AS grantor,
           CAST('PUBLIC' AS sql_identifier) AS grantee,
           CAST(current_database() AS sql_identifier) AS object_catalog,
           CAST(n.nspname AS sql_identifier) AS object_schema,
           CAST(c.collname AS sql_identifier) AS object_name,
           CAST('COLLATION' AS character_data) AS object_type,
           CAST('USAGE' AS character_data) AS privilege_type,
           CAST('NO' AS yes_or_no) AS is_grantable

    FROM pg_authid u,
         pg_namespace n,
         pg_collation c

    WHERE u.oid = c.collowner
```

## 前提知識

- **照合順序（collation）**: 文字列の比べ方や並べ方を決める定義。
- **USAGE 権限**: そのオブジェクトを使ってよいことを表す権限。
- **`pg_authid`、`pg_namespace`、`pg_collation`**: ロール、スキーマ、照合順序の情報を持つシステムの表。
- **`PUBLIC`**: 全員を表す特別な役割。

## 何をしているか

### 1. 照合順序の情報を取り出す

```sql:line-numbers=2249
    SELECT CAST(u.rolname AS sql_identifier) AS grantor,
           CAST('PUBLIC' AS sql_identifier) AS grantee,
           CAST(current_database() AS sql_identifier) AS object_catalog,
           CAST(n.nspname AS sql_identifier) AS object_schema,
           CAST(c.collname AS sql_identifier) AS object_name,
           CAST('COLLATION' AS character_data) AS object_type,
           CAST('USAGE' AS character_data) AS privilege_type,
           CAST('NO' AS yes_or_no) AS is_grantable
```

所有者の名前、スキーマ、照合順序の名前を結び、標準の形の列として返します。権限の種類は `'USAGE'`、対象の種類は `'COLLATION'` と固定しています。

### 2. 所有者と照合順序を結ぶ

```sql:line-numbers=2258
    FROM pg_authid u,
         pg_namespace n,
         pg_collation c

    WHERE u.oid = c.collowner
```

`pg_authid` と `pg_collation` を、所有者の番号で結びます。`pg_namespace` はスキーマの名前を引くために使います。

## ここがすごい

- **実際の記録が無いものを、規則で表す**: 権限を記録していない対象でも、標準の表示として一覧に出せます。
- **固定の値を明示する**: 権限の種類や対象の種類を文字で書くので、読み手は何の情報かがすぐ分かります。
- **標準の形に合わせる**: 他の権限のビューと同じ列の並びなので、まとめて扱えます。

## まとめ

- 権限の記録が無いものは、固定の値として一覧に出す。
- 標準の表示を守るため、列の名前と型をそろえる。
- 所有者は、ロールの表と番号で結んで名前を引く。
