---
title: "ACL を展開して列の権限を一覧する"
description: "information_schema.column_privileges。relacl の権限の配列を aclexplode で 1 行ずつに展開し、所有者なら常に許可できるという規則を CASE で表す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [564, 573]
function: "column_privileges"
difficulty: 3
tags: [防御的プログラミング, データ構造]
format: 2
---

## ひとことで

`column_privileges` は、列ごとに、誰がどの権限を誰に与えたかを一覧するビューです。権限の情報は、内部では「ACL」という 1 つの配列にまとめて入っています。このビューは、その配列を `aclexplode()` で 1 行ずつに広げてから、読みやすい形に直しています。

## コード

```sql:line-numbers=564
CREATE VIEW column_privileges AS
    SELECT CAST(u_grantor.rolname AS sql_identifier) AS grantor,
           CAST(grantee.rolname AS sql_identifier) AS grantee,
           CAST(current_database() AS sql_identifier) AS table_catalog,
           CAST(nc.nspname AS sql_identifier) AS table_schema,
           CAST(x.relname AS sql_identifier) AS table_name,
           CAST(x.attname AS sql_identifier) AS column_name,
           CAST(x.prtype AS character_data) AS privilege_type,
           CAST(
             CASE WHEN
```

## 前提知識

- **ACL（access control list）**: 権限の一覧を、配列の 1 つの値にまとめたもの。`relacl` という列に入る。
- **`aclexplode()`**: ACL の配列を、「誰が、誰に、どの権限を、付与の権限付きか」の行に広げる関数。
- **`acldefault()`**: 権限が設定されていないときの、既定の ACL を作る関数。
- **`coalesce()`**: 最初の `NULL` でない値を返す関数。
- **`WITH GRANT OPTION`**: 権限を、さらに他の人に与える権限。`grantable` が真なら、それを持つ。

## 何をしているか

### 1. ACL を行に広げる

`pg_class` の `relacl` を、`aclexplode()` で行に広げます。`relacl` が `NULL` のときは、`acldefault()` で既定の権限を使います。

```sql:line-numbers=588
           FROM (SELECT oid, relname, relnamespace, relowner, (aclexplode(coalesce(relacl, acldefault('r', relowner)))).*
                 FROM pg_class
                 WHERE relkind IN ('r', 'v', 'f', 'p')
```

`(…).*` と書くと、関数の結果の列をすべて展開できます。これで、付与者、被付与者、権限の種類、付与の権限の有無が、1 行ずつの列になります。

### 2. 列の名前と権限を結びつける

広げた行は、`pg_attribute` と結ばれて、列ごとの行になります。その後、名前を情報スキーマの型に変えます。

```sql:line-numbers=564
CREATE VIEW column_privileges AS
    SELECT CAST(u_grantor.rolname AS sql_identifier) AS grantor,
           CAST(grantee.rolname AS sql_identifier) AS grantee,
           CAST(current_database() AS sql_identifier) AS table_catalog,
           CAST(nc.nspname AS sql_identifier) AS table_schema,
           CAST(x.relname AS sql_identifier) AS table_name,
           CAST(x.attname AS sql_identifier) AS column_name,
           CAST(x.prtype AS character_data) AS privilege_type,
```

### 3. 所有者は常に付与できる、という規則

最後の `CASE` は、`is_grantable` の値を決めます。所有者は、付与の権限を常に持つとみなします。

```sql:line-numbers=572
           CAST(
             CASE WHEN
```

`pg_has_role(x.grantee, x.relowner, 'USAGE')` は、被付与者が所有者のロールを使えるかを判定します。そのうえで、付与の権限があるかを `OR` で足しています。

## ここがすごい

- **配列を行に変えて、通常の条件で扱う**: 権限の配列を行に広げることで、結合や `WHERE` の書き方で素直に扱えます。
- **既定の値を関数で作る**: 権限が設定されていない場合も、`acldefault()` で既定の権限を補えるので、一覧が欠けません。
- **所有者の特別扱いを 1 行で表す**: 「所有者は常に付与できる」という規則を、`OR` の 1 つの条件として読めます。
- **トレードオフ**: `aclexplode()` は行数を増やします。列が多いテーブルでは、一覧がかなり長くなることがあります。

## まとめ

- 配列に詰め込まれた権限は、`aclexplode()` で行に広げると扱いやすい。
- `coalesce` と既定値の関数で、設定の無い場合も一覧を欠けさせない。
- 特別な規則は、`CASE` の中の 1 つの条件として書くと読みやすい。
