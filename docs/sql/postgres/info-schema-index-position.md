---
title: "インデックスの中で列が何番目かを返す"
description: "information_schema の _pg_index_position。インデックスの列の並びから、ある列の位置を求め、無ければ NULL を返す。BEGIN ATOMIC で本体を書いている。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [51, 58]
function: "_pg_index_position"
difficulty: 2
tags: [データ構造, 標準ライブラリ]
format: 2
---

## ひとことで

`_pg_index_position` は、インデックスの中で、あるテーブルの列が何番目に並んでいるかを返す関数です。複合インデックス（複数の列をまとめたインデックス）で、列の順番を知るために使われます。見つからなければ `NULL` を返します。

## コード

```sql:line-numbers=51
CREATE FUNCTION _pg_index_position(oid, smallint) RETURNS int
    LANGUAGE sql STRICT STABLE
BEGIN ATOMIC
SELECT (ss.a).n FROM
  (SELECT information_schema._pg_expandarray(indkey) AS a
   FROM pg_catalog.pg_index WHERE indexrelid = $1) ss
  WHERE (ss.a).x = $2;
END;
```

## 前提知識

- **インデックス**: 特定の列の値から行を素早く探すための仕組み。複数の列をまとめて作ることもできる（複合インデックス）。
- **`pg_index`**: インデックスの情報を持つ内部テーブル。`indkey` にインデックスの列番号が並ぶ。
- **`BEGIN ATOMIC ... END`**: 関数の本体を、文字列ではなく SQL として直接書く書き方（PostgreSQL 14 以降）。
- **`$1`、`$2`**: 関数の 1 番目、2 番目の引数を指す記号。
- **`NULL`**: 結果が無いことを表す特別な値。

## 何をしているか

### 1. インデックスの列番号を展開する

`pg_index` の `indkey` は、インデックスに含まれる列番号の配列です。`_pg_expandarray` で 1 列ずつの行に広げます。

```sql:line-numbers=54
SELECT (ss.a).n FROM
  (SELECT information_schema._pg_expandarray(indkey) AS a
   FROM pg_catalog.pg_index WHERE indexrelid = $1) ss
```

ここで `a` は、列番号（`x`）と位置（`n`）の組です。`WHERE indexrelid = $1` で、引数で渡されたインデックスだけを対象にしています。

### 2. 探している列の位置だけを残す

外側の `WHERE` が、探している列番号に一致する行だけを残します。

```sql:line-numbers=57
  WHERE (ss.a).x = $2;
```

一致した行の `n` が、その列のインデックス内での位置です。一致しなければ行が無くなり、`SELECT` の結果は `NULL` になります。

## ここがすごい

- **配列を行に広げて、普通の比較で探している**: 「配列の中から探す」処理を、行の `WHERE` に置き換えています。
- **見つからない場合を自然に `NULL` にしている**: 特別な分岐を書かなくても、「この列はこのインデックスに無い」という意味が表せます。
- **`BEGIN ATOMIC` の利点**: 本体が文字列にならないので、構文の誤りがそのまま検査されます。昔の書き方のように、引用符の中で SQL を書く必要がありません。
- **トレードオフ**: 列の位置を 1 つだけ返す設計なので、「同じ列が複数の位置にある」ような場合の扱いは、呼び出し側の前提に頼っています。

## まとめ

- 配列の中の位置を知りたいときは、`_pg_expandarray` で行に広げてから探す。
- 「見つからない」は `NULL` で自然に表せる。
- `BEGIN ATOMIC` を使うと、SQL 関数を文字列を使わずに読みやすく書ける。
