---
title: "ドメインの中身の型を見つける小さな関数"
description: "information_schema の _pg_truetypid。列の型が「ドメイン」なら基底の型を、そうでなければ列の型を返す。CASE 一行で書かれている。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [60, 65]
function: "_pg_truetypid"
difficulty: 1
tags: [型システム, イディオム]
format: 2
---

## ひとことで

`_pg_truetypid` は、列の本当の型を返す小さな関数です。型が「ドメイン」（既存の型に制約を付けた別名の型）であれば、その基底の型を返し、それ以外はそのままの型を返します。

## コード

```sql:line-numbers=60
CREATE FUNCTION _pg_truetypid(pg_attribute, pg_type) RETURNS oid
    LANGUAGE sql
    IMMUTABLE
    PARALLEL SAFE
    RETURNS NULL ON NULL INPUT
RETURN CASE WHEN $2.typtype = 'd' THEN $2.typbasetype ELSE $1.atttypid END;
```

## 前提知識

- **ドメイン（DOMAIN）**: 既存の型に名前と制約（例: 「正の数だけ」）を付けて作る型。`CREATE DOMAIN` で定義する。
- **基底型**: ドメインのもとになった型。
- **`pg_attribute`**: テーブルの列の情報を持つ内部テーブル。`atttypid` が列の型。
- **`pg_type`**: 型の情報を持つ内部テーブル。`typtype` が `'d'` のときドメインを表す。
- **`RETURNS NULL ON NULL INPUT`**: 引数に `NULL` があれば、本体を実行せず `NULL` を返す指定。

## 何をしているか

### 1. 引数を名前で受け取る

この関数は、列の情報（`pg_attribute`）と型の情報（`pg_type`）を引数で受け取ります。`$1` が列、`$2` が型です。

```sql:line-numbers=60
CREATE FUNCTION _pg_truetypid(pg_attribute, pg_type) RETURNS oid
    LANGUAGE sql
    IMMUTABLE
```

`IMMUTABLE` と `PARALLEL SAFE` は、同じ入力には同じ結果を返すことと、並列処理に安全であることを示す宣言です。

### 2. ドメインなら基底型、そうでなければ列の型

本体は、型がドメインかどうかで分けているだけです。

```sql:line-numbers=65
RETURN CASE WHEN $2.typtype = 'd' THEN $2.typbasetype ELSE $1.atttypid END;
```

`$2.typtype = 'd'` が真なら、ドメインの `typbasetype`（基底型）を返します。偽なら、列そのものの `atttypid` を返します。`$2.typtype` のように、引数の列を `.` でたどれるのは、複合型の引数だからです。

## ここがすごい

- **複合型の引数を直接たどっている**: 2 つの内部テーブルの行をそのまま受け取り、`.` で必要な列を読みます。関数の呼び出し側が結合を書く必要がありません。
- **1 行の `CASE` で意図が完結している**: ドメインの扱いを 1 か所にまとめることで、型の情報を使う各ビューが同じルールで動きます。
- **トレードオフ**: 引数の型が複合型なので、呼び出し側は `pg_attribute` と `pg_type` の行を組み合わせて渡す必要があります。読むときは、その前提を押さえておくとよいです。

## まとめ

- ドメインは、そのままでは基底の型の情報が見えない。必要なら `typbasetype` をたどる。
- 型の判定は `CASE` の 1 行にまとめると、どこでも同じ規則で動く。
- 複合型の行を引数で受け取ると、関数の中で列を直接参照できる。
