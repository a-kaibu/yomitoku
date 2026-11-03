---
title: "関係のサイズを既定の main 領域で数える"
description: "PostgreSQL の pg_relation_size(regclass)。引数を 1 つだけ受け取り、本体のデータを表す main の領域のサイズを返す。3 引数版の既定値を固定する薄いラッパー。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_functions.sql
lines: [269, 273]
function: "pg_relation_size(regclass)"
difficulty: 1
tags: [標準ライブラリ, API設計]
format: 2
---

## ひとことで

`pg_relation_size` は、テーブルやインデックスの大きさ（バイト数）を返す関数です。引数を 1 つだけ渡すと、そのテーブルの本体のデータ（`main` の領域）の大きさが返ります。

## コード

```sql:line-numbers=269
CREATE OR REPLACE FUNCTION pg_relation_size(regclass)
 RETURNS bigint
 LANGUAGE sql
 PARALLEL SAFE STRICT COST 1
RETURN pg_relation_size($1, 'main');
```

## 前提知識

- **リレーション**: テーブル、インデックスなど、ファイルとして保存される対象の総称。
- **フォーク（fork）**: 1 つのリレーションが、データ本体、空き領域の地図、可視性の地図などに分かれて保存されること。それぞれがファイルになる。
- **`main`**: データ本体のフォーク。
- **`regclass`**: テーブルの名前を、番号として扱う型。
- **`bigint`**: 大きな整数の型。バイト数を入れるのに使う。

## 何をしているか

### 1. 引数 1 つの形を定義する

引数は `regclass`、戻り値は `bigint` です。テーブルの名前を渡すと、そのテーブルの大きさが得られます。

```sql:line-numbers=269
CREATE OR REPLACE FUNCTION pg_relation_size(regclass)
 RETURNS bigint
 LANGUAGE sql
 PARALLEL SAFE STRICT COST 1
```

### 2. 既定のフォーク名を指定して、3 引数版を呼ぶ

本体は、フォークの名前 `'main'` を補って、2 引数版の `pg_relation_size` を呼ぶだけです。

```sql:line-numbers=273
RETURN pg_relation_size($1, 'main');
```

フォークを指定しなかったときは、データ本体の大きさが分かれば十分、という意味になります。空き領域の地図などを含めた大きさを知りたいときは、3 引数の版を使います。

## ここがすごい

- **よく使う形を短く書ける**: 大半の利用者は、データ本体の大きさだけを知りたいので、引数 1 つで済みます。
- **既定値を文字列で明示する**: `'main'` と書くことで、どの領域の大きさかが、関数の定義から読み取れます。
- **サイズの単位を揃える**: 戻り値はバイト数の `bigint` なので、大きな表でも桁あふれしません。
- **トレードオフ**: `main` だけの大きさは、空き領域の管理情報を含みません。ディスクの使用量の全体を知りたいときには、足りないことがあります。

## まとめ

- 多くの場合の既定の形を、薄いラッパーとして用意すると使いやすい。
- 既定値を関数の本体に文字列で書くと、どの対象を測っているかが分かる。
- 大きさの単位は、桁あふれしない型（`bigint`）で返すのが安全。
