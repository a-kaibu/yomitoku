---
title: "データベースの文字コードを見せる character_sets"
description: "PostgreSQL の character_sets ビュー。データベースの符号化の名前と、既定の照合順序を、一つの行にまとめて返す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [381, 393]
function: "character_sets"
difficulty: 3
tags: [Unicode, 文字列処理]
format: 2
---

## ひとことで

`character_sets` は、データベースが使っている文字コード（符号化）を、標準の形で見せるビューです。文字コードの名前、文字の集まり（repertoire）、既定の照合順序を、1 行にまとめます。

## コード

```sql:line-numbers=381
CREATE VIEW character_sets AS
    SELECT CAST(null AS sql_identifier) AS character_set_catalog,
           CAST(null AS sql_identifier) AS character_set_schema,
           CAST(getdatabaseencoding() AS sql_identifier) AS character_set_name,
           CAST(CASE WHEN getdatabaseencoding() = 'UTF8' THEN 'UCS' ELSE getdatabaseencoding() END AS sql_identifier) AS character_repertoire,
           CAST(getdatabaseencoding() AS sql_identifier) AS form_of_use,
           CAST(current_database() AS sql_identifier) AS default_collate_catalog,
           CAST(nc.nspname AS sql_identifier) AS default_collate_schema,
           CAST(c.collname AS sql_identifier) AS default_collate_name
    FROM pg_database d
         LEFT JOIN (pg_collation c JOIN pg_namespace nc ON (c.collnamespace = nc.oid))
             ON (datcollate = collcollate AND datctype = collctype)
    WHERE d.datname = current_database()
```

## 前提知識

- **符号化（encoding）**: 文字を、バイトの並びとして表すための取り決め。UTF-8 など。
- **repertoire（文字の集まり）**: 扱える文字の範囲を表す標準の用語。UTF-8 では UCS として表す。
- **照合順序（collation）**: 文字列の比べ方や並べ方を決める定義。
- **`LEFT JOIN`**: 対応する行が無くても、左側の行を残す結合。

## 何をしているか

### 1. 文字コードの名前を決める

```sql:line-numbers=384
           CAST(getdatabaseencoding() AS sql_identifier) AS character_set_name,
           CAST(CASE WHEN getdatabaseencoding() = 'UTF8' THEN 'UCS' ELSE getdatabaseencoding() END AS sql_identifier) AS character_repertoire,
           CAST(getdatabaseencoding() AS sql_identifier) AS form_of_use,
```

`getdatabaseencoding()` で符号化の名前を取ります。UTF-8 のときは文字の集まりを `UCS` と表し、それ以外はそのまま名前を使います。

### 2. 既定の照合順序を探す

```sql:line-numbers=387
           CAST(current_database() AS sql_identifier) AS default_collate_catalog,
           CAST(nc.nspname AS sql_identifier) AS default_collate_schema,
           CAST(c.collname AS sql_identifier) AS default_collate_name
```

データベースの照合順序と、同じ組み合わせの照合順序を、`pg_collation` から探します。複数あるときは、名前の長いほうを優先します。

### 3. 対応する行を結ぶ

```sql:line-numbers=391
         LEFT JOIN (pg_collation c JOIN pg_namespace nc ON (c.collnamespace = nc.oid))
             ON (datcollate = collcollate AND datctype = collctype)
    WHERE d.datname = current_database()
```

`pg_database` とは `LEFT JOIN` で結ぶので、照合順序が見つからなくても、行は残ります。最後に `LIMIT 1` で一行だけ返します。

## ここがすごい

- **標準の名前に変換する**: 内部の文字コード名を、標準の形（文字の集まりなど）で見せています。
- **見つからなくても壊れない**: `LEFT JOIN` と `LIMIT` で、対応が無くても一行の結果を返せます。
- **同じ条件の中から選ぶ**: 名前の長さで順番を決め、どれを返すかを明確にしています。

## まとめ

- 内部の文字コードは、標準の名前と分類に変えて見せる。
- 対応する行が無くても残すために、外部結合を使う。
- 候補が複数あるときは、並べ替えと `LIMIT` で一つに決める。
