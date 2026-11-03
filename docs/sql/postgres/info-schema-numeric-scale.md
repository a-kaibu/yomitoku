---
title: "数値型の位取りを修飾子から求める _pg_numeric_scale"
description: "PostgreSQL の information_schema の内部関数 _pg_numeric_scale。numeric(p, s) の s にあたる位取りを、修飾子の下位 16 ビットから取り出す。整数型は 0 を返す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [137, 150]
function: "_pg_numeric_scale(typid oid, typmod int4)"
difficulty: 3
tags: [数値計算, 型システム]
format: 2
---

## ひとことで

`_pg_numeric_scale` は、数値型の位取り（小数点以下の桁数）を求める関数です。`numeric(10, 2)` の 2 にあたる値を返します。整数型は小数点を持たないので、0 を返します。

## コード

```sql:line-numbers=137
CREATE FUNCTION _pg_numeric_scale(typid oid, typmod int4) RETURNS integer
    LANGUAGE sql
    IMMUTABLE
    PARALLEL SAFE
    RETURNS NULL ON NULL INPUT
RETURN
  CASE WHEN $1 IN (21, 23, 20) THEN 0
       WHEN $1 IN (1700) THEN
            CASE WHEN $2 = -1
                 THEN null
                 ELSE ($2 - 4) & 0xFFFF
                 END
       ELSE null
  END;
```

## 前提知識

- **位取り（scale）**: 小数点より後ろに置ける桁の数。
- **`numeric(p, s)`**: 精度 `p` と位取り `s` を、利用者が指定する形式。
- **ビット演算の `&`**: 二つの数の同じ位置のビットが両方 1 のときだけ 1 にする演算。`0xFFFF` との `&` で下位 16 ビットを取り出せる。
- **`>>` の役割**: 前の関数で見た、上位の部分を取り出すための右シフト。ここでは使わない。

## 何をしているか

### 1. 整数型は 0 にする

```sql:line-numbers=143
  CASE WHEN $1 IN (21, 23, 20) THEN 0
```

`smallint`、`integer`、`bigint` は小数点を持たないので、位取りは 0 です。

### 2. numeric は修飾子の下位から取る

```sql:line-numbers=144
       WHEN $1 IN (1700) THEN
            CASE WHEN $2 = -1
                 THEN null
                 ELSE ($2 - 4) & 0xFFFF
                 END
```

修飾子が `-1` なら不明なので `NULL` です。そうでなければ、4 を引いて、下位 16 ビットだけを取り出します。ここに位取りが入っています。

## ここがすごい

- **同じ形式の値を別の関数で分ける**: 精度は上位、位取りは下位と、一つの整数に二つの情報を詰める方式を、関数ごとに読み分けています。
- **0 と `NULL` を区別する**: 整数型の 0 は「小数が無い」という意味で、不明の `NULL` とは分けています。
- **一つのビット演算で済む**: 下位 16 ビットを取るだけなので、読み手は意図をすぐ理解できます。

## まとめ

- 位取りは修飾子の下位 16 ビットに入っている。
- 「小数が無い」の 0 と、「不明」の `NULL` は別物として扱う。
- 二つの情報を一つの整数に詰めるときは、取り出し方を関数ごとに分けると読みやすい。
