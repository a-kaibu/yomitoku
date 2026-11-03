---
title: "テーブルとインデックスを結んで定義文を返す"
description: "pg_indexes のビュー。インデックスの情報を pg_index で、テーブルとインデックスの 2 つの pg_class に結び、対象の種類を IN で絞る。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [159, 170]
function: "pg_indexes"
difficulty: 2
tags: [データ構造, API設計]
format: 2
---

## ひとことで

`pg_indexes` は、テーブルに作られたインデックスを一覧するビューです。テーブル名、インデックス名、置き場所、そして `CREATE INDEX` の文を返します。内部では同じ `pg_class` を 2 回使い、テーブルとインデックスの両方の名前を引いています。

## コード

```sql:line-numbers=159
CREATE VIEW pg_indexes AS
    SELECT
        N.nspname AS schemaname,
        C.relname AS tablename,
        I.relname AS indexname,
        T.spcname AS tablespace,
        pg_get_indexdef(I.oid) AS indexdef
    FROM pg_index X JOIN pg_class C ON (C.oid = X.indrelid)
         JOIN pg_class I ON (I.oid = X.indexrelid)
         LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
         LEFT JOIN pg_tablespace T ON (T.oid = I.reltablespace)
    WHERE C.relkind IN ('r', 'm', 'p') AND I.relkind IN ('i', 'I');
```

## 前提知識

- **インデックス**: 特定の列の値から行を速く探すための仕組み。
- **`pg_class`**: テーブル、インデックス、ビューなど、名前を持つ対象（リレーション）の情報を持つ内部テーブル。
- **`pg_index`**: インデックスの詳細を持つ内部テーブル。`indrelid`（テーブル）と `indexrelid`（インデックス）を持つ。
- **`relkind`**: 対象の種類。`'r'` はテーブル、`'i'` はインデックス、`'I'` はパーティションされたインデックス。
- **別名の使い分け**: 同じテーブルを 2 回使うとき、`C` と `I` のように別の名前を付けて区別する。

## 何をしているか

### 1. インデックスとテーブルを結ぶ

`pg_index` の `indrelid` と `indexrelid` を使って、テーブルの `pg_class`（`C`）と、インデックスの `pg_class`（`I`）を結びます。

```sql:line-numbers=160
    SELECT
        N.nspname AS schemaname,
        C.relname AS tablename,
        I.relname AS indexname,
        T.spcname AS tablespace,
        pg_get_indexdef(I.oid) AS indexdef
    FROM pg_index X JOIN pg_class C ON (C.oid = X.indrelid)
         JOIN pg_class I ON (I.oid = X.indexrelid)
```

同じ `pg_class` を 2 回結ぶので、別名 `C` と `I` が必要になります。1 つの行に、テーブルの名前とインデックスの名前が同時に入ります。

### 2. スキーマと表領域の名前を付ける

スキーマは、テーブル側の `relnamespace` から引きます。表領域は、インデックスの `reltablespace` から引きます。

```sql:line-numbers=168
         LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
         LEFT JOIN pg_tablespace T ON (T.oid = I.reltablespace)
```

`LEFT JOIN` なので、既定の表領域を使うインデックスも行が消えません。その場合 `tablespace` は `NULL` になります。

### 3. テーブルとインデックスの種類を絞る

最後の条件で、対象をテーブル系とインデックス系に限ります。

```sql:line-numbers=170
    WHERE C.relkind IN ('r', 'm', 'p') AND I.relkind IN ('i', 'I');
```

`IN ('r', 'm', 'p')` は、通常のテーブル、マテリアライズドビュー、パーティションのテーブルです。`IN ('i', 'I')` は、通常のインデックスとパーティションのインデックスです。

## ここがすごい

- **同じ表を 2 回使う結合**: 1 つの内部テーブルを、役割の違う 2 つの別名で使い分けています。
- **`IN` で種類を並べる**: 対象の種類を 1 文字ずつ並べることで、テーブルとインデックスの組み合わせを簡潔に表せます。
- **`LEFT JOIN` で既定の値を残す**: 表領域を指定していないインデックスも、一覧から消えません。
- **トレードオフ**: `relkind` の文字は内部の記号なので、新しい種類が増えたときは、この条件も更新が必要になります。

## まとめ

- 2 つの関係を 1 つの行に出すときは、同じ表を別名で 2 回結ぶ。
- 対象の種類は、`IN` の中に並べると読みやすい。
- 指定が無いことを表す値は、`LEFT JOIN` で残して扱う。
