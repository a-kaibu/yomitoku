---
title: "2 フェーズコミットの途中経過を一覧する"
description: "準備済み（PREPARE TRANSACTION）のトランザクションを一覧するビュー。所有者とデータベース名を LEFT JOIN で付け、対応が無くても行を消さない。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [459, 464]
function: "pg_prepared_xacts"
difficulty: 2
tags: [並行処理, API設計]
format: 2
---

## ひとことで

`pg_prepared_xacts` は、`PREPARE TRANSACTION` で準備された状態のまま残っているトランザクションを一覧するビューです。誰が作ったか、どのデータベースのものかを名前で付け加えています。

## コード

```sql:line-numbers=459
CREATE VIEW pg_prepared_xacts AS
    SELECT P.transaction, P.gid, P.prepared,
           U.rolname AS owner, D.datname AS database
    FROM pg_prepared_xact() AS P
         LEFT JOIN pg_authid U ON P.ownerid = U.oid
         LEFT JOIN pg_database D ON P.dbid = D.oid;
```

## 前提知識

- **トランザクション**: まとめて成功するか、まとめて取り消されるかの一単位。`BEGIN` から `COMMIT` までがそれにあたる。
- **2 フェーズコミット**: 複数の場所をまたぐ変更を、「準備」と「確定」の 2 段階で行う方式。`PREPARE TRANSACTION 'gid'` で準備し、`COMMIT PREPARED 'gid'` か `ROLLBACK PREPARED 'gid'` で決める。
- **`gid`**: 準備したトランザクションに付ける名前。
- **`oid`**: PostgreSQL の内部で使う識別番号。ロールやデータベースはそれぞれ `oid` を持つ。

## 何をしているか

### 1. 内部関数から準備済みトランザクションを取り出す

`pg_prepared_xact()` は、数値の識別子（所有者の `oid` とデータベースの `oid`）を含む行を返します。

```sql:line-numbers=459
CREATE VIEW pg_prepared_xacts AS
    SELECT P.transaction, P.gid, P.prepared,
           U.rolname AS owner, D.datname AS database
    FROM pg_prepared_xact() AS P
```

### 2. 所有者とデータベースの名前を付ける

`oid` のままでは読みにくいので、2 つの `LEFT JOIN` で名前を引きます。

```sql:line-numbers=463
         LEFT JOIN pg_authid U ON P.ownerid = U.oid
         LEFT JOIN pg_database D ON P.dbid = D.oid;
```

`LEFT JOIN` なので、所有者のロールが後から削除されていても、その行は残ります。その場合 `owner` は `NULL` になりますが、準備済みのトランザクションが見えなくなる事故を防げます。

## ここがすごい

- **結合の種類を意図的に選んでいる**: `INNER JOIN` にすると、名前の引けない行が静かに消えてしまいます。準備済みのトランザクションは、後始末が必要なものなので、見えなくなっては困ります。
- **内部表現を人が読める形に直している**: `oid` を名前に変えるのは、管理者が状況を判断するための小さな工夫です。
- **トレードオフ**: 準備済みのまま放置されたトランザクションは、ロックを握り続けることがあります。ビューは見せるだけなので、対応は管理者が手で行う必要があります。

## まとめ

- 「あるかもしれない参照先」を持つ行は、`LEFT JOIN` で残すと情報が欠けない。
- `oid` を名前に変えて見せると、運用者が判断しやすくなる。
- 内部の状態を見せるビューは、そのまま後始末の入り口にもなる。
