---
title: "ビューが使う表を、書き換えルールの依存関係から探す"
description: "information_schema.view_table_usage。ビューが参照する表を、ビューの書き換えルールに対する pg_depend の依存を 2 回たどって見つける。DISTINCT で重複をまとめる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [2564, 2581]
function: "view_table_usage"
difficulty: 3
tags: [データ構造, 設計パターン]
format: 2
---

## ひとことで

`view_table_usage` は、どのビューが、どのテーブルを使っているかを一覧するビューです。ビューの定義文を読んで解析する代わりに、PostgreSQL が内部で記録している依存関係（`pg_depend`）を 2 回たどって、ビューと表の対応を見つけています。

## コード

```sql:line-numbers=2564
CREATE VIEW view_table_usage AS
    SELECT DISTINCT
           CAST(current_database() AS sql_identifier) AS view_catalog,
           CAST(nv.nspname AS sql_identifier) AS view_schema,
           CAST(v.relname AS sql_identifier) AS view_name,
           CAST(current_database() AS sql_identifier) AS table_catalog,
           CAST(nt.nspname AS sql_identifier) AS table_schema,
           CAST(t.relname AS sql_identifier) AS table_name

    FROM pg_namespace nv, pg_class v, pg_depend dv,
         pg_depend dt, pg_class t, pg_namespace nt

    WHERE nv.oid = v.relnamespace
          AND v.relkind = 'v'
          AND v.oid = dv.refobjid
          AND dv.refclassid = 'pg_catalog.pg_class'::regclass
          AND dv.classid = 'pg_catalog.pg_rewrite'::regclass
          AND dv.deptype = 'i'
```

## 前提知識

- **書き換えルール（rewrite rule）**: ビューは内部では、`_RETURN` という名前のルールとして実装されている。そのルールの中に、参照する表が書かれている。
- **`pg_rewrite`**: 書き換えルールを持つ内部テーブル。
- **`pg_depend`**: 依存関係を記録する内部テーブル。`deptype = 'i'` は、内部的な依存（自動で作られた関係）を表す。
- **`DISTINCT`**: 重複した行を 1 つにまとめる指定。
- **`relkind`**: 対象の種類。`'v'` はビュー、`'r'` は通常のテーブル。

## 何をしているか

### 1. ビューとそのルールを結ぶ

ビュー（`v`）は、`pg_depend` を通じて、書き換えルール（`pg_rewrite`）に依存しています。その依存の記録を、`dv` として取ります。

```sql:line-numbers=2576
    WHERE nv.oid = v.relnamespace
          AND v.relkind = 'v'
          AND v.oid = dv.refobjid
          AND dv.refclassid = 'pg_catalog.pg_class'::regclass
          AND dv.classid = 'pg_catalog.pg_rewrite'::regclass
          AND dv.deptype = 'i'
```

`dv.deptype = 'i'` は、ビューが自動で作ったルールとの関係であることを表します。

### 2. ルールが参照する表を探す

同じルールに対して、別の依存（`dt`）をたどると、そのルールが参照している表（`t`）が分かります。`dv.refobjid <> dt.refobjid` は、ビュー自身を除くための条件です。

```sql:line-numbers=2582
          AND dv.objid = dt.objid
          AND dv.refobjid <> dt.refobjid
          AND dt.classid = 'pg_catalog.pg_rewrite'::regclass
          AND dt.refclassid = 'pg_catalog.pg_class'::regclass
          AND dt.refobjid = t.oid
          AND t.relnamespace = nt.oid
          AND t.relkind IN ('r', 'v', 'f', 'p')
          AND pg_has_role(t.relowner, 'USAGE');
```

`t.relkind IN ('r', 'v', 'f', 'p')` で、表やビューだけを対象にしています。

### 3. 重複を除く

1 つのビューが、同じ表を何回も参照することがあるので、`SELECT DISTINCT` で、ビューと表の組を 1 行にまとめます。

## ここがすごい

- **解析をしないで依存を使う**: ビューの `SELECT` 文を読み解かなくても、PostgreSQL が記録した依存関係から、参照する表が分かります。文法の変化にも強い方法です。
- **同じ表の 2 つの依存をつなぐ**: 「ビューがルールに依存する」「ルールが表に依存する」という 2 段の関係を、`objid` でつないでいます。
- **`DISTINCT` で見やすさを保つ**: 参照の回数ではなく、ビューと表の組だけを見せています。
- **トレードオフ**: 依存の記録の仕組みに頼るので、PostgreSQL の内部の作り方が変わると、この条件も見直す必要があります。

## まとめ

- 文の解析をせず、内部の依存の記録をたどると、関係を確実に見つけられる。
- 2 段の依存は、同じ中間の対象（ここではルール）を介してつなぐと分かりやすい。
- 参照の回数より、組み合わせの一覧が欲しいときは `DISTINCT` を使う。
