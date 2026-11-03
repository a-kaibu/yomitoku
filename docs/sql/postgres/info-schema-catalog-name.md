---
title: "データベースの名前を返す information_schema_catalog_name"
description: "PostgreSQL の information_schema_catalog_name ビュー。current_database() の結果を 1 行の表として見せ、誰でも読めるように PUBLIC に権限を与える。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [212, 215]
function: "information_schema_catalog_name"
difficulty: 1
tags: [API設計, 標準ライブラリ]
format: 2
---

## ひとことで

`information_schema_catalog_name` は、今接続しているデータベースの名前を 1 行で返すビューです。SQL 標準の `information_schema` には、カタログ（データベース）の名前を取り出す決まった場所が必要です。このビューが、その場所を作っています。

## コード

```sql:line-numbers=212
CREATE VIEW information_schema_catalog_name AS
    SELECT CAST(current_database() AS sql_identifier) AS catalog_name;

GRANT SELECT ON information_schema_catalog_name TO PUBLIC;
```

## 前提知識

- **`information_schema`**: SQL 標準で決められた、情報を調べるための表とビューの集まり。
- **`current_database()`**: 今接続しているデータベースの名前を返す関数。
- **`CAST(... AS sql_identifier)`**: 値を、標準の定義どおりの識別子の型に変える指定。
- **`GRANT SELECT ... TO PUBLIC`**: 全員に読み取りを許す指定。

## 何をしているか

### 1. データベースの名前を 1 列にする

```sql:line-numbers=213
    SELECT CAST(current_database() AS sql_identifier) AS catalog_name;
```

`current_database()` の結果を `sql_identifier` 型にキャストし、`catalog_name` という列の名前で返します。ビューは 1 行だけを持ちます。

### 2. 誰でも読めるようにする

```sql:line-numbers=215
GRANT SELECT ON information_schema_catalog_name TO PUBLIC;
```

データベースの名前は秘密ではないので、`PUBLIC` に読み取りを与えています。

## ここがすごい

- **1 行のビューに意味を持たせる**: 関数の結果を、標準で決められた名前と型で見せると、他のツールがそのまま読めます。
- **型を揃える**: キャストで、他の `information_schema` のビューと同じ型の列にそろえています。
- **秘密でない情報だけを公開する**: 権限を全員に開くのは、名前だけで、中身の情報を含まないからです。

## まとめ

- 標準の情報スキーマでは、関数の結果も標準の型と名前で見せる。
- 公開してよい情報だけ、`PUBLIC` に読み取りを与える。
- 1 行のビューでも、名前と型の決まりに沿って作ると、ほかのツールとつながる。
