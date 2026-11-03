---
title: "引数を 2 つにすると空白で埋める lpad"
description: "PostgreSQL の lpad(text, integer) は、3 つ目の引数を省いたときの既定値を作る関数。SQL 関数として書かれ、本体はもう一方の lpad を空白付きで呼ぶだけ。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_functions.sql
lines: [30, 34]
function: "lpad(text, integer)"
difficulty: 1
tags: [文字列処理, API設計]
format: 2
---

## ひとことで

`lpad` は、文字列の左側を指定した文字で埋めて、決まった長さにする関数です。PostgreSQL では、3 つ目の引数（埋める文字）を省くと空白で埋めます。その既定値の動きを、もう一つの `lpad` を呼ぶ小さな関数として定義しています。

## コード

```sql:line-numbers=30
CREATE OR REPLACE FUNCTION lpad(text, integer)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT COST 1
RETURN lpad($1, $2, ' ');
```

## 前提知識

- **関数の多重定義（オーバーロード）**: 同じ名前の関数を、引数の数や型を変えて複数作ること。
- **`LANGUAGE sql`**: 関数の本体を SQL で書く指定。
- **`RETURN` 式**: SQL 関数の本体を、1 つの式として書く書き方。
- **`$1`、`$2`**: 関数の 1 番目、2 番目の引数。
- **`STRICT`**: 引数に `NULL` があれば、本体を実行せず `NULL` を返す指定。

## 何をしているか

### 1. 引数が 2 つの形を定義する

この定義は、`lpad(文字列, 長さ)` という 2 引数の形です。戻り値は `text` です。

```sql:line-numbers=30
CREATE OR REPLACE FUNCTION lpad(text, integer)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT COST 1
```

`IMMUTABLE` は、同じ入力に同じ結果を返すこと、`PARALLEL SAFE` は並列処理で使ってよいこと、`STRICT` は `NULL` を入れたら `NULL` を返すことを表します。

### 2. 3 つ目の引数を空白にして、もとの関数を呼ぶ

本体は、空白 1 文字（`' '`）を 3 つ目の引数に入れて、3 引数の `lpad` を呼ぶだけです。

```sql:line-numbers=34
RETURN lpad($1, $2, ' ');
```

つまり、利用者は `lpad('7', 3)` と書くだけで、`lpad('7', 3, ' ')` と同じ結果を得られます。

## ここがすごい

- **既定値を、別の関数の呼び出しで表す**: 既定値の処理を、本体の関数に一本化しています。ロジックが 2 か所に分かれません。
- **定義が短く、読みやすい**: 小さな SQL 関数で済むので、C 言語の関数を増やさずに済みます。
- **`STRICT` と組み合わせて `NULL` の扱いを揃える**: 引数のどれかが `NULL` なら結果も `NULL` になり、ほかの関数と挙動が揃います。
- **トレードオフ**: 既定の埋め文字は空白に固定されています。別の文字で埋めたいときは、3 引数の形を使う必要があります。

## まとめ

- 既定値を持つ関数は、もとの関数を既定の引数で呼ぶ薄い関数として書ける。
- SQL 関数の `RETURN` 式は、短い変換を表すのに向いている。
- 関数の性質（`IMMUTABLE`、`STRICT` など）を明示すると、動きが読み取りやすい。
