---
title: "ビューの一覧を pg_class の種類から作る"
description: "pg_views は、ビューの一覧。pg_class の relkind が v の行を選び、所有者の名前とビューの定義文を付けて返す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [123, 130]
function: "pg_views"
difficulty: 1
tags: [データ構造, API設計]
format: 2
---

## ひとことで

`pg_views` は、データベースの中のビューを一覧するビューです。ビューは、テーブルと同じく `pg_class` という内部の表に登録されています。そのため、種類の記号 `'v'` で選び分けて、ビューだけを取り出しています。

## コード

```sql:line-numbers=123
CREATE VIEW pg_views AS
    SELECT
        N.nspname AS schemaname,
        C.relname AS viewname,
        pg_get_userbyid(C.relowner) AS viewowner,
        pg_get_viewdef(C.oid) AS definition
    FROM pg_class C LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
    WHERE C.relkind = 'v';
```

## 前提知識

- **`pg_class`**: テーブル、ビュー、インデックスなど、名前を持つ対象をすべて入れている内部テーブル。
- **`relkind`**: 対象の種類を 1 文字で表す列。`'v'` はビュー。
- **`pg_namespace`**: スキーマの情報を持つ内部テーブル。
- **`pg_get_userbyid()`**: 所有者の番号から、ロールの名前を返す関数。
- **`pg_get_viewdef()`**: ビューの定義文を、SQL の文字列として返す関数。

## 何をしているか

### 1. スキーマと名前を取り出す

`pg_class` の行を、`pg_namespace` と結んで、スキーマ名とビュー名を取り出します。

```sql:line-numbers=124
    SELECT
        N.nspname AS schemaname,
        C.relname AS viewname,
```

`LEFT JOIN` にしているので、スキーマの情報が引けない行も残ります。

### 2. 所有者と定義文を付ける

所有者の番号は名前に変え、ビューの定義は、SQL の文字列として取り出します。

```sql:line-numbers=127
        pg_get_userbyid(C.relowner) AS viewowner,
        pg_get_viewdef(C.oid) AS definition
```

`pg_get_viewdef(C.oid)` は、ビューが内部でどんな `SELECT` になっているかを、読める文字列に戻します。

### 3. ビューだけに絞る

最後の条件で、`relkind` が `'v'` の行だけを残します。

```sql:line-numbers=129
    FROM pg_class C LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
    WHERE C.relkind = 'v';
```

テーブルやインデックスは、同じ `pg_class` に入っていても、この条件で除かれます。

## ここがすごい

- **同じ内部の表を、記号で仕分ける**: テーブルもビューもインデックスも、同じ表に入っています。記号の 1 文字で、欲しいものだけを選べます。
- **定義文を関数で文字列に戻す**: ビューの中身を、利用者がそのまま読める形で見せられます。
- **結合の種類を揃える**: 補足の情報はすべて `LEFT JOIN` にして、行の欠けを防いでいます。
- **トレードオフ**: `pg_get_viewdef()` は、ビューの中身を呼び出すたびに文字列にするため、ビューが多いと少し時間がかかります。

## まとめ

- 内部の共通の表から特定の種類を選ぶときは、記号の条件で絞る。
- 定義の文字列は、関数で取り出すと内部の仕組みを隠して見せられる。
- 補足の結合は `LEFT JOIN` にすると、欠けを防げる。
