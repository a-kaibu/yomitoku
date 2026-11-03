---
title: "拡張機能のバージョンごとに導入済みかを判定する"
description: "利用可能な拡張機能の全バージョンを一覧し、インストール済みかどうかを IS NOT NULL で真偽値にするビュー。結合条件は名前とバージョンの両方。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [451, 457]
function: "pg_available_extension_versions"
difficulty: 1
tags: [データ構造, API設計]
format: 2
---

## ひとことで

`pg_available_extension_versions` は、このサーバーに用意されている拡張機能（extension）のバージョンを一覧するビューです。そのうち、今インストールされているものには `installed` が `true` になります。

## コード

```sql:line-numbers=451
CREATE VIEW pg_available_extension_versions AS
    SELECT E.name, E.version, (X.extname IS NOT NULL) AS installed,
           E.superuser, E.trusted, E.relocatable,
           E.schema, E.requires, E.location, E.comment
      FROM pg_available_extension_versions() AS E
           LEFT JOIN pg_extension AS X
             ON E.name = X.extname AND E.version = X.extversion;
```

## 前提知識

- **拡張機能（extension）**: 追加の関数や型をまとめて入れられる部品。`CREATE EXTENSION` で導入する。
- **`LEFT JOIN`**: 左の表の行を必ず残す結合。右に一致がなければ右の列は `NULL` になる。
- **`IS NOT NULL`**: 値が `NULL`（空）でないかを調べる条件。結果は真か偽。
- **`AS` による別名**: 列や式に新しい名前を付けること。

## 何をしているか

### 1. 利用できる拡張機能の一覧を取る

`pg_available_extension_versions()` は、サーバーにあるバージョンの一覧を返す関数です。その結果を `E` という別名で使います。

```sql:line-numbers=451
CREATE VIEW pg_available_extension_versions AS
    SELECT E.name, E.version, (X.extname IS NOT NULL) AS installed,
           E.superuser, E.trusted, E.relocatable,
```

### 2. 導入済みの拡張機能と突き合わせる

`pg_extension` は、今インストールされている拡張機能の表です。名前とバージョンの両方が一致した行だけ、`X` の列が埋まります。

```sql:line-numbers=454
           E.schema, E.requires, E.location, E.comment
      FROM pg_available_extension_versions() AS E
           LEFT JOIN pg_extension AS X
             ON E.name = X.extname AND E.version = X.extversion;
```

`(X.extname IS NOT NULL) AS installed` は、結合できたかどうかを真偽値にしています。一致しなかった行は `X.extname` が `NULL` になるので、`installed` は `false` になります。

## ここがすごい

- **結合条件にバージョンも含めている**: 名前だけで結合すると、同じ拡張機能の別バージョンまで「導入済み」になってしまいます。
- **存在の判定を式で済ませている**: 別のサブクエリを書かずに、`IS NOT NULL` の 1 行で「あるかどうか」を表しています。
- **トレードオフ**: `LEFT JOIN` で残す分、行数は利用可能なバージョンの数だけになります。一覧が長くなることは、この用途では問題になりません。

## まとめ

- 結合の条件は、キーになるものをすべて含める。
- `IS NOT NULL` は、結合の結果を真偽値として読みやすくする便利な書き方。
- 「ある」と「ない」を両方見せたいときは、`LEFT JOIN` と組み合わせると簡潔に書ける。
