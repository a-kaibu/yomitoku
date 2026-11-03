---
title: "ユーザー名の対応表を読む pg_ident_file_mappings"
description: "PostgreSQL の pg_ident_file_mappings ビュー。pg_ident.conf のユーザー名対応を関数で読み取り、利用者に見せないように権限を閉じる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [670, 673]
function: "pg_ident_file_mappings"
difficulty: 2
tags: [セキュリティ, API設計]
format: 2
---

## ひとことで

`pg_ident_file_mappings` は、外部のユーザー名を PostgreSQL のロールに結び付ける対応表を、表のように読めるビューです。`pg_ident.conf` に書かれた対応が、1 行ずつ見えます。`pg_hba_file_rules` と同じく、設定の中身を扱うため、権限は閉じられています。

## コード

```sql:line-numbers=670
CREATE VIEW pg_ident_file_mappings AS
   SELECT * FROM pg_ident_file_mappings() AS A;

REVOKE ALL ON pg_ident_file_mappings FROM PUBLIC;
```

## 前提知識

- **`pg_ident.conf`**: 外部の認証で得た名前を、データベースのロールに結び付けるファイル。
- **ユーザー名のマッピング**: OS やほかの仕組みの名前と、PostgreSQL の名前を対応させること。
- **`REVOKE`**: 権限を取り消す命令。
- **`SELECT * FROM 関数()`**: 関数の結果を表として読む書き方。

## 何をしているか

### 1. 関数の結果を見せる

```sql:line-numbers=670
CREATE VIEW pg_ident_file_mappings AS
   SELECT * FROM pg_ident_file_mappings() AS A;
```

`pg_ident_file_mappings()` は、対応表の規則を返します。ビューはその結果を `A` という別名で受け、そのまま出します。

### 2. 全員から権限を取り除く

```sql:line-numbers=673
REVOKE ALL ON pg_ident_file_mappings FROM PUBLIC;
```

対応表には、どの名前がどのロールになれるかの情報が含まれます。`REVOKE ALL ... FROM PUBLIC` で、一般の利用者からは読めないようにしています。

## ここがすごい

- **ファイルの対応を表で見せる**: 設定を読む手間を省き、どの名前がどのロールに対応するかを 1 行で確かめられます。
- **機密のデータを守る**: 名前の対応は権限の判断に関わるので、読める人を限っています。
- **同じ型のビューで揃える**: `pg_hba_file_rules` と同じ書き方なので、設定ファイルを見せるビューの形を一度覚えれば読めます。

## まとめ

- 対応表も、関数で読み取って表として見せられる。
- 権限の判断に関わる情報は、`PUBLIC` から取り消して守る。
- 同じ型のビューは、一つ覚えれば別のビューも読める。
