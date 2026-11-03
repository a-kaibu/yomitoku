---
title: "制約がどの列に依存しているかを pg_depend で探す"
description: "information_schema.constraint_column_usage。チェック制約が使う列を、pg_depend の依存関係の記録から DISTINCT で集め、テーブルと列の名前を付ける。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [808, 815]
function: "constraint_column_usage"
difficulty: 3
tags: [データ構造, 型システム]
format: 2
---

## ひとことで

`constraint_column_usage` は、制約（主にチェック制約など）が、テーブルのどの列を使っているかを一覧するビューです。式の中身を解析するのではなく、PostgreSQL が記録した依存関係（`pg_depend`）を読んで、列との対応を見つけています。

## コード

```sql:line-numbers=808
        SELECT DISTINCT nr.nspname, r.relname, r.relowner, a.attname, nc.nspname, c.conname
          FROM pg_namespace nr, pg_class r, pg_attribute a, pg_depend d, pg_namespace nc, pg_constraint c
          WHERE nr.oid = r.relnamespace
            AND r.oid = a.attrelid
            AND d.refclassid = 'pg_catalog.pg_class'::regclass
            AND d.refobjid = r.oid
            AND d.refobjsubid = a.attnum
            AND d.classid = 'pg_catalog.pg_constraint'::regclass
```

## 前提知識

- **制約（constraint）**: 表の値に課す条件。CHECK 制約は、列の値を使う式として書かれる。
- **`pg_depend`**: 「どの対象が、どの対象に依存するか」を記録する内部テーブル。
- **`refclassid` / `refobjid` / `refobjsubid`**: 依存先の種類、番号、列の番号。`refobjsubid` が列の番号にあたる。
- **`DISTINCT`**: 重複した行を 1 つにまとめる指定。
- **`regclass`**: テーブルなどの名前を、番号として扱う型への変換。

## 何をしているか

### 1. 依存の記録から、制約と列を結ぶ

チェック制約が、どの列に依存しているかは、`pg_depend` に記録されています。`refobjsubid` が列の番号なので、テーブルの列と対応づけられます。

```sql:line-numbers=808
        SELECT DISTINCT nr.nspname, r.relname, r.relowner, a.attname, nc.nspname, c.conname
          FROM pg_namespace nr, pg_class r, pg_attribute a, pg_depend d, pg_namespace nc, pg_constraint c
          WHERE nr.oid = r.relnamespace
            AND r.oid = a.attrelid
            AND d.refclassid = 'pg_catalog.pg_class'::regclass
            AND d.refobjid = r.oid
            AND d.refobjsubid = a.attnum
            AND d.classid = 'pg_catalog.pg_constraint'::regclass
```

`d.refclassid = 'pg_catalog.pg_class'::regclass` で、依存先が表（または列）であることを確かめます。`d.classid = 'pg_catalog.pg_constraint'::regclass` で、依存元が制約であることを確かめます。

### 2. 重複を除き、制約の列を並べる

同じ列を複数の式で使っていても、一覧には 1 回だけ出すように、サブクエリの外側で `DISTINCT` を使います。

## ここがすごい

- **式を読まずに依存を使う**: CHECK 制約の式を文字列から解析する代わりに、PostgreSQL 自身が記録した依存関係を使っています。解析の誤りがありません。
- **`regclass` で種類を指定する**: 名前の文字列ではなく、番号として種類を比べるので、確実に一致を判定できます。
- **列の番号で対応させる**: 同じ表の中の列を、名前ではなく番号の一致で結ぶので、列名の重複に影響されません。
- **トレードオフ**: 依存の記録は、PostgreSQL の内部の仕組みです。依存の種類が増えると、このビューの条件も見直す必要があります。

## まとめ

- 式の中身を読まなくても、依存の記録を使えば「何を使っているか」が分かる。
- 列の対応は、名前ではなく番号で結ぶと確実になる。
- 集合を作るときは、`DISTINCT` で重複を外すと一覧が読みやすくなる。
