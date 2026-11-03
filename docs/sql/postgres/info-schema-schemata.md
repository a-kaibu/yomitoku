---
title: "スキーマの一覧に権限チェックを入れる"
description: "information_schema.schemata。スキーマの持ち主の権限があるか、CREATE か USAGE の権限があるものだけを一覧に残す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [1659, 1670]
function: "schemata"
difficulty: 1
tags: [防御的プログラミング, API設計]
format: 2
---

## ひとことで

`schemata` は、データベース内のスキーマ（テーブルなどを入れる名前空間）を一覧するビューです。一覧に出すのは、持ち主の権限があるか、そのスキーマに対する `CREATE` か `USAGE` の権限があるものだけです。

## コード

```sql:line-numbers=1659
CREATE VIEW schemata AS
    SELECT CAST(current_database() AS sql_identifier) AS catalog_name,
           CAST(n.nspname AS sql_identifier) AS schema_name,
           CAST(u.rolname AS sql_identifier) AS schema_owner,
           CAST(null AS sql_identifier) AS default_character_set_catalog,
           CAST(null AS sql_identifier) AS default_character_set_schema,
           CAST(null AS sql_identifier) AS default_character_set_name,
           CAST(null AS character_data) AS sql_path
    FROM pg_namespace n, pg_authid u
    WHERE n.nspowner = u.oid
          AND (pg_has_role(n.nspowner, 'USAGE')
               OR has_schema_privilege(n.oid, 'CREATE, USAGE'));
```

## 前提知識

- **スキーマ（schema）**: テーブルや関数などをまとめる名前空間。`public` が標準で用意される。
- **`pg_namespace`**: スキーマの情報を持つ内部テーブル。
- **`USAGE` と `CREATE`**: スキーマに対する権限。`USAGE` は中の物を使う権限、`CREATE` はその中に作る権限。
- **`has_schema_privilege()`**: 現在のユーザーが、スキーマに対する権限を持つかを返す関数。
- **`CAST(... AS sql_identifier)`**: 値を情報スキーマの識別子の型に変える書き方。

## 何をしているか

### 1. 名前と持ち主を取り出す

スキーマの名前と、その持ち主の名前を取り出します。

```sql:line-numbers=1660
    SELECT CAST(current_database() AS sql_identifier) AS catalog_name,
           CAST(n.nspname AS sql_identifier) AS schema_name,
           CAST(u.rolname AS sql_identifier) AS schema_owner,
```

`pg_namespace` の `nspowner` と `pg_authid` の `oid` を結ぶと、持ち主の名前が分かります。

### 2. 権限のあるスキーマだけを残す

最後の `WHERE` が、一覧に残す行を決めます。

```sql:line-numbers=1667
    FROM pg_namespace n, pg_authid u
    WHERE n.nspowner = u.oid
          AND (pg_has_role(n.nspowner, 'USAGE')
               OR has_schema_privilege(n.oid, 'CREATE, USAGE'));
```

`pg_has_role(n.nspowner, 'USAGE')` は、持ち主のロールを使える人かどうかです。`OR` のもう一方は、スキーマに対して `CREATE` か `USAGE` の権限があるかを表します。どちらかが真なら、そのスキーマが見えます。

## ここがすごい

- **見せる範囲を権限で決めている**: 全部のスキーマを返すのではなく、使えるものだけを返すので、利用者の見える世界が自分の権限に合わせて変わります。
- **2 つの判定を `OR` でつないでいる**: 持ち主か、個別の権限を持っている人のどちらかで通るように、短い式で表せています。
- **トレードオフ**: 権限の判定を 1 行ごとに行うため、スキーマが非常に多いと遅くなることがあります。通常の数では問題になりません。

## まとめ

- 一覧のビューは、行の絞り込みに権限の条件を入れると、見せてよいものだけを返せる。
- `OR` で結ぶ権限の判定は、「持ち主か、権限を持つ人か」という形で読むと分かりやすい。
- 名前と持ち主のように、内部の番号を名前に変えて見せるのは、ビュー全般の基本の形。
