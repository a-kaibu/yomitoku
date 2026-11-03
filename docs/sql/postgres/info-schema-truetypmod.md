---
title: "型の修飾子を実際の値に直す _pg_truetypmod"
description: "PostgreSQL の information_schema の内部関数 _pg_truetypmod。列の型修飾子を、ドメインを通した本当の型修飾子に変える小さな SQL 関数。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [67, 72]
function: "_pg_truetypmod(pg_attribute, pg_type)"
difficulty: 2
tags: [型システム, API設計]
format: 2
---

## ひとことで

`_pg_truetypmod` は、列の型の修飾子（`varchar(20)` の 20 のような情報）を、正しい値に直す関数です。列の型がドメインの場合は、ドメインが持つ修飾子を使い、そうでなければ列の修飾子をそのまま使います。

## コード

```sql:line-numbers=67
CREATE FUNCTION _pg_truetypmod(pg_attribute, pg_type) RETURNS int4
    LANGUAGE sql
    IMMUTABLE
    PARALLEL SAFE
    RETURNS NULL ON NULL INPUT
RETURN CASE WHEN $2.typtype = 'd' THEN $2.typtypmod ELSE $1.atttypmod END;
```

## 前提知識

- **型修飾子（typmod）**: `varchar(20)` や `numeric(10, 2)` のように、型に付けられる長さや精度の情報。
- **ドメイン**: 既存の型に制約を付けて作る、新しい型の名前。
- **`pg_attribute`**: 列の情報を持つシステムの表。`atttypmod` が列の修飾子。
- **`RETURNS NULL ON NULL INPUT`**: 引数に `NULL` があれば、本体を実行せず `NULL` を返す指定。

## 何をしているか

### 1. ドメインかどうかを確かめる

```sql:line-numbers=72
RETURN CASE WHEN $2.typtype = 'd' THEN $2.typtypmod ELSE $1.atttypmod END;
```

`$2.typtype = 'd'` は、型がドメインかどうかを表します。ドメインなら、`typtypmod` を使い、そうでなければ列の `atttypmod` を使います。

## ここがすごい

- **ドメインを透明に扱う**: 利用者は、ドメインの中の型を気にせず、正しい長さや精度を得られます。
- **一行で分岐を書く**: `CASE` を一つ書くだけなので、読み手は分岐を一目で追えます。
- **引数の順番で役割を分ける**: `$1` は列、`$2` は型と決めて、役割を名前で示す代わりに位置で示しています。

## まとめ

- 型の修飾子は、ドメインなら型側、そうでなければ列側から取る。
- `CASE` で分岐を一行にまとめると、読み手が流れを追いやすい。
- 引数の役割を決めておくと、内部の関数を組み合わせやすい。
