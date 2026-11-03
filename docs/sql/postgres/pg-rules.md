---
title: "ビューの裏側のルールを隠して一覧にする"
description: "pg_rules は、テーブルに付いたルールを一覧するビュー。ビューを支える内部の _RETURN ルールを WHERE で除き、利用者が作ったものだけを見せる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [113, 121]
function: "pg_rules"
difficulty: 2
tags: [設計パターン, 防御的プログラミング]
format: 2
---

## ひとことで

`pg_rules` は、テーブルやビューに付けられたルール（RULE）の一覧です。ただし、ビューそのものを動かしている内部のルール `_RETURN` は、利用者が作ったものではないので、`WHERE` で除外しています。

## コード

```sql:line-numbers=113
CREATE VIEW pg_rules AS
    SELECT
        N.nspname AS schemaname,
        C.relname AS tablename,
        R.rulename AS rulename,
        pg_get_ruledef(R.oid) AS definition
    FROM (pg_rewrite R JOIN pg_class C ON (C.oid = R.ev_class))
        LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
    WHERE R.rulename != '_RETURN';
```

## 前提知識

- **ルール（RULE）**: SQL 文が実行される前に、別の SQL 文へ書き換える PostgreSQL の仕組み。
- **`pg_rewrite`**: ルールの定義を持つ内部テーブル。`rulename` と、対象の `ev_class`（テーブルの番号）を持つ。
- **`_RETURN` ルール**: ビューが作られたとき、内部で自動的に付けられる `SELECT` のルール。ビューの中身を定義する。
- **`pg_get_ruledef()`**: ルールの定義を、SQL の文字列に戻す関数。

## 何をしているか

### 1. ルールと対象のテーブルを結ぶ

`pg_rewrite` の `ev_class` が、ルールの対象のテーブルです。`pg_class` と結んで、テーブル名を取り出します。

```sql:line-numbers=114
    SELECT
        N.nspname AS schemaname,
        C.relname AS tablename,
        R.rulename AS rulename,
        pg_get_ruledef(R.oid) AS definition
    FROM (pg_rewrite R JOIN pg_class C ON (C.oid = R.ev_class))
        LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
```

`LEFT JOIN pg_namespace` でスキーマ名も付けます。ルールの対象がテーブルでもビューでも、同じ形で結べます。

### 2. 内部のルールを除き、定義文を見せる

ビューを支える `_RETURN` ルールは、利用者が書いたルールではありません。`WHERE` で除外し、残りのルールだけを返します。

```sql:line-numbers=121
    WHERE R.rulename != '_RETURN';
```

`pg_get_ruledef(R.oid)` は、ルールの内容を読める SQL の文字列にして返します。

## ここがすごい

- **内部の実装を見せない**: ビューは裏でルールを使って実装されています。その詳細を省くことで、利用者は「自分で付けたルール」だけを見ればよくなります。
- **名前で区別する**: `_RETURN` という名前は、PostgreSQL が内部用に予約しているものです。名前の一致だけで除外できるので、判定が簡単です。
- **トレードオフ**: 名前に頼るため、内部の仕組みの名前が変わると、この `WHERE` の意味も変わります。カタログの仕様を追う必要があります。

## まとめ

- ビューは内部でルールとして実装されている。
- 内部用の名前を `WHERE` で除くと、利用者向けの一覧がすっきりする。
- システム管理用のビューは、内部の仕組みと利用者のものを分けて考えると読みやすい。
