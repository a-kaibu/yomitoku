---
title: "照合順序の一覧に NO PAD を付ける collations"
description: "information_schema.collations。pg_collation の照合順序を、現在のデータベースの符号化方式に合うものに絞り、pad 属性を NO PAD という固定の文字列で返す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [465, 472]
function: "collations"
difficulty: 2
tags: [文字列処理, 標準ライブラリ]
format: 2
---

## ひとことで

`collations` は、データベースで使える照合順序（文字列の並べ方や比べ方の規則）の一覧です。現在のデータベースの文字コードで使えるものだけを残し、標準の定義に合わせて、`pad_attribute` を `NO PAD` と固定の値で返します。

## コード

```sql:line-numbers=465
CREATE VIEW collations AS
    SELECT CAST(current_database() AS sql_identifier) AS collation_catalog,
           CAST(nc.nspname AS sql_identifier) AS collation_schema,
           CAST(c.collname AS sql_identifier) AS collation_name,
           CAST('NO PAD' AS character_data) AS pad_attribute
    FROM pg_collation c, pg_namespace nc
    WHERE c.collnamespace = nc.oid
          AND collencoding IN (-1, (SELECT encoding FROM pg_database WHERE datname = current_database()));
```

## 前提知識

- **照合順序（collation）**: 文字列をどう並べ、どう比べるかの規則。言語ごとの並びや、大文字と小文字の扱いなどを決める。
- **符号化方式（encoding）**: 文字をバイトの列で表す方式（UTF-8 など）。照合順序は、特定の符号化方式でしか使えないものがある。
- **`-1`**: 符号化方式に依存しないという特別な値。どの方式でも使える照合順序に付けられる。
- **`pad_attribute`**: 文字列の末尾の空白を、比べるときに無視するかどうかの性質。標準の用語。
- **`IN (...)`**: 値がリストのどれかと一致するかを調べる条件。

## 何をしているか

### 1. 照合順序の名前を取り出す

`pg_collation` と `pg_namespace` を結んで、照合順序のスキーマ名と名前を取り出します。

```sql:line-numbers=466
    SELECT CAST(current_database() AS sql_identifier) AS collation_catalog,
           CAST(nc.nspname AS sql_identifier) AS collation_schema,
           CAST(c.collname AS sql_identifier) AS collation_name,
```

### 2. 現在のデータベースで使えるものに絞る

`collencoding` が `-1`（どの符号化方式でも可）か、現在のデータベースの符号化方式と一致するものだけを残します。

```sql:line-numbers=470
    FROM pg_collation c, pg_namespace nc
    WHERE c.collnamespace = nc.oid
          AND collencoding IN (-1, (SELECT encoding FROM pg_database WHERE datname = current_database()));
```

`(SELECT encoding FROM pg_database WHERE datname = current_database())` は、今のデータベースの符号化方式を取る副問い合わせです。

### 3. pad 属性を固定の値で返す

PostgreSQL の照合順序は、末尾の空白を比べに含めるので、標準の用語では `NO PAD` になります。その値を、すべての行に同じ文字列として付けています。

```sql:line-numbers=469
           CAST('NO PAD' AS character_data) AS pad_attribute
```

## ここがすごい

- **使えないものを一覧から外す**: 符号化方式が合わない照合順序は、そもそも使えないので、一覧に出さないようにしています。
- **特別な値 `-1` を活用する**: 「どの方式でも可」という意味の値を、条件の中の 1 つの選択肢として扱っています。
- **標準の用語の値を固定で返す**: PostgreSQL の挙動を、標準の言葉で説明する列になっています。
- **トレードオフ**: 符号化方式の副問い合わせを、行ごとに評価します。一覧の行数が多くても、この副問い合わせは 1 回だけの計算になるため、影響は小さくなっています。

## まとめ

- 使える選択肢だけを一覧にするには、条件で絞るのが基本。
- 「どの環境でも可」を表す特別な値は、条件の選択肢の 1 つとして扱える。
- 標準の用語を、固定の値として返すと、他のツールとの互換性が保てる。
