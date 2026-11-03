---
title: "列のコメントを列番号で取り出す col_description"
description: "PostgreSQL の col_description(oid, integer)。テーブルの番号と列番号を渡して、その列に付けられたコメントを pg_description から取り出す。BEGIN ATOMIC で書かれた短い関数。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_functions.sql
lines: [306, 313]
function: "col_description(oid, integer)"
difficulty: 1
tags: [データ構造, API設計]
format: 2
---

## ひとことで

`col_description` は、テーブルの 1 つの列に付けられたコメントを取り出す関数です。テーブルの番号と列の番号（1 から始まる）を渡すと、`COMMENT ON COLUMN` で書かれた説明が返ります。

## コード

```sql:line-numbers=306
CREATE OR REPLACE FUNCTION col_description(oid, integer)
 RETURNS text
 LANGUAGE sql
 STABLE PARALLEL SAFE STRICT
BEGIN ATOMIC
select description from pg_description
  where objoid = $1 and classoid = 'pg_class'::regclass and objsubid = $2;
END;
```

## 前提知識

- **`COMMENT ON COLUMN`**: 列に説明を付ける SQL 文。
- **`pg_description`**: コメントを保存する内部テーブル。`objoid`（対象の番号）、`classoid`（カタログの番号）、`objsubid`（列の番号）を持つ。
- **`regclass`**: テーブルの名前を番号として扱う型。`'pg_class'::regclass` は、`pg_class` の番号を表す。
- **`STABLE`**: 同じ問い合わせの中では同じ結果になる、という読み取り専用の性質。
- **`STRICT`**: 引数に `NULL` があれば、結果を `NULL` にする指定。

## 何をしているか

### 1. 関数の性質を宣言する

戻り値は `text` です。読むだけで、引数に `NULL` が来たら結果も `NULL` になるように `STRICT` が付いています。

```sql:line-numbers=306
CREATE OR REPLACE FUNCTION col_description(oid, integer)
 RETURNS text
 LANGUAGE sql
 STABLE PARALLEL SAFE STRICT
BEGIN ATOMIC
```

### 2. 対象と列番号でコメントを絞り込む

`objoid` が第 1 引数のテーブルの番号、`classoid` が `pg_class` の番号、`objsubid` が第 2 引数の列番号に一致するものを選びます。

```sql:line-numbers=311
select description from pg_description
  where objoid = $1 and classoid = 'pg_class'::regclass and objsubid = $2;
```

`'pg_class'::regclass` は、列のコメントが `pg_class` のカタログに入っていることを表しています。列のコメントは、テーブルの一部として `pg_class` に紐づいて保存されます。

## ここがすごい

- **3 つの条件で一意に決まる**: 対象、カタログ、列番号の組で、コメントの行が 1 つに決まります。
- **`regclass` で名前を番号に直す**: 文字列の比較ではなく、番号どうしの比較なので、確実です。
- **短い関数で役目が明確**: 本体の `select` は 1 つだけで、利用者が何をしているかが分かりやすいです。
- **トレードオフ**: 列番号は、列が削除されても番号が詰まりません。古い番号を渡すと、別の列のコメントを返すことはないものの、無い列の場合は `NULL` になります。

## まとめ

- 列のコメントは、テーブル、カタログ、列番号の 3 つの条件で探す。
- `regclass` を使うと、名前ではなく番号で正確に比べられる。
- 短く役目が明確な関数は、保守がしやすい。
