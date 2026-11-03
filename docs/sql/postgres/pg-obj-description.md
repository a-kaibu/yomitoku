---
title: "オブジェクトのコメントを名前から探す obj_description"
description: "PostgreSQL の obj_description(oid, name)。カタログの名前（pg_class など）を使って、どの種類の対象のコメントかを探し、コメント文字列を取り出す。BEGIN ATOMIC で書かれている。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_functions.sql
lines: [275, 285]
function: "obj_description(oid, name)"
difficulty: 2
tags: [データ構造, API設計]
format: 2
---

## ひとことで

`obj_description` は、データベースの対象（テーブルや関数など）に付けられたコメント（`COMMENT ON` で書いたもの）を取り出す関数です。対象の番号と、その種類を表すカタログの名前（`pg_class` など）を渡すと、対応するコメントを返します。

## コード

```sql:line-numbers=275
CREATE OR REPLACE FUNCTION obj_description(oid, name)
 RETURNS text
 LANGUAGE sql
 STABLE PARALLEL SAFE STRICT
BEGIN ATOMIC
select description from pg_description
  where objoid = $1 and
    classoid = (select oid from pg_class where relname = $2 and
                relnamespace = 'pg_catalog'::regnamespace) and
    objsubid = 0;
END;
```

## 前提知識

- **`COMMENT ON`**: 対象に説明の文字列を付ける SQL 文。
- **`pg_description`**: コメントを保存する内部テーブル。対象の番号、カタログの番号、列の番号を持つ。
- **`oid`**: 内部の対象の番号。
- **`BEGIN ATOMIC ... END`**: 関数の本体を、文字列ではなく SQL として直接書く書き方。
- **`regnamespace`**: スキーマの名前を番号として扱う型。`'pg_catalog'::regnamespace` と書く。

## 何をしているか

### 1. 関数の形と性質を宣言する

戻り値は `text`、引数は対象の `oid` と、カタログの名前です。読むだけの関数なので、`STABLE` と宣言されています。

```sql:line-numbers=275
CREATE OR REPLACE FUNCTION obj_description(oid, name)
 RETURNS text
 LANGUAGE sql
 STABLE PARALLEL SAFE STRICT
```

### 2. カタログの名前から、カタログの番号を探す

まず、名前を持つカタログ（`pg_class` など）の番号を、`pg_class` の中から探します。`pg_catalog` のスキーマに限定しています。

```sql:line-numbers=281
  where objoid = $1 and
    classoid = (select oid from pg_class where relname = $2 and
                relnamespace = 'pg_catalog'::regnamespace) and
```

### 3. コメントを探して返す

対象の番号、カタログの番号、列の番号が 0 のもの（対象全体へのコメント）を選びます。

```sql:line-numbers=280
select description from pg_description
  where objoid = $1 and
    classoid = (select oid from pg_class where relname = $2 and
                relnamespace = 'pg_catalog'::regnamespace) and
    objsubid = 0;
```

`objsubid = 0` は、列などの一部ではなく、対象そのものに付けたコメントを表します。

## ここがすごい

- **番号の探し方を 1 か所に閉じる**: カタログの番号を名前から引く処理を、サブクエリで書いています。利用者は名前だけを渡せます。
- **列のコメントと対象全体のコメントを分ける**: `objsubid` で、区別して読んでいます。
- **`BEGIN ATOMIC` で、構文の検査を受けやすくする**: 文字列の中に SQL を書かないので、誤りがそのまま見つかります。
- **トレードオフ**: カタログの名前を変えると、この関数の結果も変わります。カタログの名前は、利用者が指定する前提になっています。

## まとめ

- 対象の番号をカタログの名前から探すと、利用者は名前で指定できる。
- 対象全体と列を区別するには、副番号を条件にする。
- `BEGIN ATOMIC` を使うと、SQL 関数を文字列を使わずに書ける。
