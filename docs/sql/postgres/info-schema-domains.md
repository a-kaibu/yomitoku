---
title: "ドメインの型を ARRAY と組み込み型に分ける"
description: "information_schema.domains。型の typelem と typlen から配列型を判定し、組み込みの型なら format_type で型名を、それ以外は USER-DEFINED と表示する。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [966, 976]
function: "domains"
difficulty: 2
tags: [型システム, イディオム]
format: 2
---

## ひとことで

`domains` は、データベースのドメイン（既存の型に制約を付けた型）の一覧です。各ドメインの「データ型」の欄を、配列か、標準の型か、利用者が作った型かに分けて、読める言葉で返します。

## コード

```sql:line-numbers=966
CREATE VIEW domains AS
    SELECT CAST(current_database() AS sql_identifier) AS domain_catalog,
           CAST(nt.nspname AS sql_identifier) AS domain_schema,
           CAST(t.typname AS sql_identifier) AS domain_name,

           CAST(
             CASE WHEN t.typelem <> 0 AND t.typlen = -1 THEN 'ARRAY'
                  WHEN nbt.nspname = 'pg_catalog' THEN format_type(t.typbasetype, null)
                  ELSE 'USER-DEFINED' END
             AS character_data)
             AS data_type,
```

## 前提知識

- **ドメイン（DOMAIN）**: 既存の型に、名前と制約を付けた型。`CREATE DOMAIN` で作る。
- **`pg_type`**: 型の情報を持つ内部テーブル。`typelem` は配列の要素の型、`typlen` は型の長さ。
- **`typlen = -1`**: 長さが固定でない型を表す。配列やテキストは、この値になる。
- **`format_type()`**: 型の番号を、型の名前の文字列に変える関数。
- **`nbt.nspname = 'pg_catalog'`**: 型が、PostgreSQL の標準の型の名前空間にあることを表す条件。

## 何をしているか

### 1. 配列型かどうかを判定する

ドメインの基底型（`typbasetype`）に要素の型があり（`typelem <> 0`）、長さが可変（`typlen = -1`）なら、配列とみなして `ARRAY` を返します。

```sql:line-numbers=971
           CAST(
             CASE WHEN t.typelem <> 0 AND t.typlen = -1 THEN 'ARRAY'
                  WHEN nbt.nspname = 'pg_catalog' THEN format_type(t.typbasetype, null)
                  ELSE 'USER-DEFINED' END
```

`typelem` が `0` でないことは、要素の型が決まっていることを意味します。さらに、`typlen = -1` で、配列のように長さが決まっていないことを確かめています。

### 2. 標準の型と利用者の型を分ける

`pg_catalog` の型なら、`format_type()` で `integer` や `text` のような型名を返します。それ以外は、`USER-DEFINED` と返します。

```sql:line-numbers=973
                  WHEN nbt.nspname = 'pg_catalog' THEN format_type(t.typbasetype, null)
                  ELSE 'USER-DEFINED' END
```

（上の `CASE` の 2 つ目の分岐です。）

### 3. 長さと精度を、型の番号から計算する

同じビューの続きでは、文字列の長さなどを、ドメインの基底型と修飾子から計算する関数で求めています。

```sql:line-numbers=978
           CAST(
             _pg_char_max_length(t.typbasetype, t.typtypmod)
             AS cardinal_number)
             AS character_maximum_length,

           CAST(
             _pg_char_octet_length(t.typbasetype, t.typtypmod)
             AS cardinal_number)
```

## ここがすごい

- **条件の順番で分類する**: 配列を最初に判定し、そのあと標準の型を見ています。順番を変えると、結果も変わるので、意図がはっきりしています。
- **型の名前を文字列にしてくれる関数を使う**: 型の内部の番号を自分で引き直す代わりに、`format_type()` で名前を取り出せます。
- **利用者の型を隠さずに、一般的な名前で示す**: `USER-DEFINED` と書くことで、標準の型と区別しつつ、存在は分かるようにしています。
- **トレードオフ**: `typlen = -1` の判定は、ほかの可変長の型も含むため、配列以外の型も `ARRAY` と見えることがあります。型の性質を知ったうえで読む必要があります。

## まとめ

- 型の分類は、判定の順番で結果が変わるので、順番を意図して並べる。
- 内部の番号を名前に変えるには、`format_type()` のような関数を使う。
- 利用者が作った型は、一般的な名前にまとめると、標準の型と区別して見せられる。
