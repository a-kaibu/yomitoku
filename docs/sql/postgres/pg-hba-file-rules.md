---
title: "認証設定ファイルの規則を表で読む pg_hba_file_rules"
description: "PostgreSQL の pg_hba_file_rules ビュー。pg_hba.conf の接続規則を関数で読み取って行にし、利用者には見せず権限を閉じる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [665, 668]
function: "pg_hba_file_rules"
difficulty: 2
tags: [セキュリティ, API設計]
format: 2
---

## ひとことで

`pg_hba_file_rules` は、接続の認証を決める設定ファイル `pg_hba.conf` の規則を、表のように読めるビューです。どの接続を許すか、どの認証方式を使うかといった規則が、1 行ずつ見えます。設定の中身を見せるので、読める人を限る必要があります。

## コード

```sql:line-numbers=665
CREATE VIEW pg_hba_file_rules AS
   SELECT * FROM pg_hba_file_rules() AS A;

REVOKE ALL ON pg_hba_file_rules FROM PUBLIC;
```

## 前提知識

- **`pg_hba.conf`**: どの接続を、どの方式で認めるかを書いたファイル。HBA は host-based authentication の略。
- **`PUBLIC`**: 全員を表す特別な役割。
- **`REVOKE`**: 権限を取り消す命令。
- **関数の結果を `AS A` で受ける**: 別名を付けて、ほかの表と同じように書く書き方。

## 何をしているか

### 1. 関数の結果を見せる

```sql:line-numbers=665
CREATE VIEW pg_hba_file_rules AS
   SELECT * FROM pg_hba_file_rules() AS A;
```

`pg_hba_file_rules()` は、設定ファイルを読んで規則の一覧を返します。ビューはそれを `A` という別名で受け、そのまま出します。

### 2. 全員から権限を取り除く

```sql:line-numbers=668
REVOKE ALL ON pg_hba_file_rules FROM PUBLIC;
```

設定ファイルには、接続の許可に関わる情報が含まれます。そこで `REVOKE ALL ... FROM PUBLIC` で、一般の利用者からは読めないようにしています。

## ここがすごい

- **ファイルを表に変える**: 設定ファイルの書式を知らなくても、列の名前で中身を読めます。
- **見せる範囲を明示する**: 中身を見せる前に、全員の権限を閉じて、必要な役割だけに開く流れが読み取れます。
- **関数とビューの役割を分ける**: 読み取りは関数、見せ方と権限はビューと、役割が分かれています。

## まとめ

- 設定ファイルの規則は、関数で表の形に読み取れる。
- 中身が機密のビューは、`PUBLIC` からの権限を取り消して作る。
- 読み取りの仕組みと、見せ方の権限を分けて考えると、設計が理解しやすい。
