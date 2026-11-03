---
title: "数値型の精度の基数を返す _pg_numeric_precision_radix"
description: "PostgreSQL の information_schema の内部関数 _pg_numeric_precision_radix。整数と浮動小数は 2 進数、numeric は 10 進数として精度を表すことを、型の番号で決める。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [126, 135]
function: "_pg_numeric_precision_radix(typid oid, typmod int4)"
difficulty: 2
tags: [数値計算, 型システム]
format: 2
---

## ひとことで

`_pg_numeric_precision_radix` は、数値型の精度が 2 進数で数えられているか、10 進数で数えられているかを返す関数です。整数と浮動小数は 2、`numeric` は 10 を返します。精度の値と組にして読むことで、その数の意味が分かります。

## コード

```sql:line-numbers=126
CREATE FUNCTION _pg_numeric_precision_radix(typid oid, typmod int4) RETURNS integer
    LANGUAGE sql
    IMMUTABLE
    PARALLEL SAFE
    RETURNS NULL ON NULL INPUT
RETURN
  CASE WHEN $1 IN (21, 23, 20, 700, 701) THEN 2
       WHEN $1 IN (1700) THEN 10
       ELSE null
  END;
```

## 前提知識

- **基数（radix）**: 桁の数え方の基準になる数。2 なら二進数、10 なら十進数。
- **精度と基数**: 精度 16 でも、基数が 2 なら 16 ビット、基数が 10 なら 16 桁を表す。
- **`IN (...)`**: 値が一覧のどれかに一致するかを調べる条件。
- **`integer`、`real` など**: 型を表す番号で、一覧に並べて判定する。

## 何をしているか

### 1. 二進数の型を選ぶ

```sql:line-numbers=132
  CASE WHEN $1 IN (21, 23, 20, 700, 701) THEN 2
```

`smallint`、`integer`、`bigint`、`real`、`double precision` を、基数 2 として扱います。これらは、ビットで値を表す型です。

### 2. 十進数の型を選ぶ

```sql:line-numbers=133
       WHEN $1 IN (1700) THEN 10
```

`numeric` は、基数 10 として扱います。桁を十進数で数える型だからです。

## ここがすごい

- **意味の違いを数で表す**: 精度の値だけでは分からない意味を、基数という別の値で補っています。
- **対象の外は NULL**: 数値型以外では `NULL` を返し、誤った基数を見せません。
- **一覧で判定する**: `IN` を使うと、型の追加や入れ替えも一覧の書き換えだけで済みます。

## まとめ

- 数値の精度は、基数と組にして初めて意味が分かる。
- 型の一覧を `IN` で判定すると、読みやすく直しやすい。
- 対象の外の型には `NULL` を返すと、誤解を防げる。
