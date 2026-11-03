---
title: "データ型の利用権限を一覧にする data_type_privileges"
description: "PostgreSQL の data_type_privileges ビュー。ユーザー定義型・表・ドメイン・ルーチンの列の型を UNION ALL で一つにまとめ、どの型の情報かを文字で示す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [2667, 2685]
function: "data_type_privileges"
difficulty: 3
tags: [データ構造, 型システム]
format: 2
---

## ひとことで

`data_type_privileges` は、データ型をどこで使っているかを一覧にするビューです。型が表の列、ドメイン、ルーチンの引数や戻り値など、いろいろな場所で使われます。このビューは、それらを 1 つの表にまとめて、型の一覧として見せます。

## コード

```sql:line-numbers=2667
CREATE VIEW data_type_privileges AS
    SELECT CAST(current_database() AS sql_identifier) AS object_catalog,
           CAST(x.objschema AS sql_identifier) AS object_schema,
           CAST(x.objname AS sql_identifier) AS object_name,
           CAST(x.objtype AS character_data) AS object_type,
           CAST(x.objdtdid AS sql_identifier) AS dtd_identifier

    FROM
      (
        SELECT udt_schema, udt_name, 'USER-DEFINED TYPE'::text, dtd_identifier FROM attributes
        UNION ALL
        SELECT table_schema, table_name, 'TABLE'::text, dtd_identifier FROM columns
        UNION ALL
        SELECT domain_schema, domain_name, 'DOMAIN'::text, dtd_identifier FROM domains
        UNION ALL
        SELECT specific_schema, specific_name, 'ROUTINE'::text, dtd_identifier FROM parameters
        UNION ALL
        SELECT specific_schema, specific_name, 'ROUTINE'::text, dtd_identifier FROM routines
      ) AS x (objschema, objname, objtype, objdtdid);
```

## 前提知識

- **`UNION ALL`**: 二つ以上の結果を、重複を消さずに縦につなぐ集合演算。
- **サブクエリの別名と列名**: `AS x (objschema, objname, ...)` のように、表と列に名前を付ける書き方。
- **`information_schema` の他のビュー**: `attributes`、`columns`、`domains`、`parameters`、`routines` など、個別の情報を見せるビュー。
- **`'TABLE'::text`**: 固定の文字列を `text` 型として書く式。

## 何をしているか

### 1. 型が使われている場所を集める

```sql:line-numbers=2675
      (
        SELECT udt_schema, udt_name, 'USER-DEFINED TYPE'::text, dtd_identifier FROM attributes
        UNION ALL
        SELECT table_schema, table_name, 'TABLE'::text, dtd_identifier FROM columns
        UNION ALL
        SELECT domain_schema, domain_name, 'DOMAIN'::text, dtd_identifier FROM domains
        UNION ALL
        SELECT specific_schema, specific_name, 'ROUTINE'::text, dtd_identifier FROM parameters
        UNION ALL
        SELECT specific_schema, specific_name, 'ROUTINE'::text, dtd_identifier FROM routines
```

それぞれの SELECT は、型の名前（スキーマと名前）、種類を表す文字、型の ID を取り出します。種類は `'USER-DEFINED TYPE'`、`'TABLE'`、`'DOMAIN'`、`'ROUTINE'` のどれかです。

### 2. 列の名前を決めて一つの表にする

```sql:line-numbers=2685
      ) AS x (objschema, objname, objtype, objdtdid);
```

`UNION ALL` で 5 つの結果をつなぎ、`x` という名前の表として列の名前を付けます。外側の `SELECT` では、その列を標準の型に変えて返します。

## ここがすごい

- **似た情報を一つの形にする**: 別々のビューを同じ列の並びに合わせて、1 つの一覧にしています。
- **種類を文字で残す**: どの場所で使われているかが一目で分かります。
- **`UNION ALL` で速く集める**: 重複を消す手間が無いので、大きな一覧でも扱いやすい形です。

## まとめ

- 似た形の結果は、列を揃えて `UNION ALL` でつなげる。
- 結果がどの種類から来たかは、固定の文字列を一緒に入れて残す。
- 外側で名前と型を決めると、読み手に見せる形を揃えられる。
