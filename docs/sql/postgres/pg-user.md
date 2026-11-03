---
title: "パスワードを伏せて見せる pg_user"
description: "PostgreSQL の pg_user ビュー。pg_shadow からログインできるロールを読み、パスワードの列を固定の文字列 ******** に置き換えて見せる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [65, 76]
function: "pg_user"
difficulty: 2
tags: [セキュリティ, API設計]
format: 2
---

## ひとことで

`pg_user` は、ログインできるロールの一覧を見せるビューです。元になる `pg_shadow` にはパスワードのハッシュが入っています。このビューは、その列を見せずに、固定の文字列 `********` に置き換えて返します。

## コード

```sql:line-numbers=65
CREATE VIEW pg_user AS
    SELECT
        usename,
        usesysid,
        usecreatedb,
        usesuper,
        userepl,
        usebypassrls,
        '********'::text as passwd,
        valuntil,
        useconfig
    FROM pg_shadow;
```

## 前提知識

- **`pg_shadow`**: ログインできるロールの認証情報を含む、システムの表。パスワードの情報を扱うため、見せる範囲が絞られている。
- **`'********'::text`**: 固定の文字列を `text` 型として書く式。
- **`valuntil`**: パスワードの有効期限。
- **`useconfig`**: ロールごとの設定値。

## 何をしているか

### 1. 認証情報の表から列を選ぶ

```sql:line-numbers=67
        usename,
        usesysid,
        usecreatedb,
        usesuper,
```

`FROM pg_shadow` で、名前や権限の列を読みます。`usesuper`、`usecreatedb`、`userepl`、`usebypassrls` は、ロールが持つ権限を真偽値で表します。

### 2. パスワードを伏せる

```sql:line-numbers=73
        '********'::text as passwd,
```

`'********'::text as passwd` は、`passwd` という列に固定の文字列を入れています。どのロールにもパスワードが設定されていることは分かりますが、中身は見えません。

## ここがすごい

- **列の名前は残し、中身だけを隠す**: 列の並びを保つので、既存のクエリを壊さずに済みます。
- **ビューで見せる範囲を決める**: 元の表を直接見せるのではなく、必要な列だけを加工して出しています。
- **権限の情報は見える**: スーパーユーザーかどうか、データベースを作れるかなど、運用に必要な情報は読めます。

## まとめ

- 秘密の値は、固定の文字列に置き換えて見せる。
- 列の名前と並びを保つと、利用者のクエリがそのまま動く。
- 元の表を直接見せず、ビューを通して必要な列だけを出す。
