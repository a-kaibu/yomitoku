---
title: "旧式のグループを表す pg_group"
description: "PostgreSQL の pg_group ビュー。ログインできないロールをグループとみなし、所属するロールの一覧を ARRAY のサブクエリで 1 列にまとめる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [57, 63]
function: "pg_group"
difficulty: 2
tags: [API設計, 型システム]
format: 2
---

## ひとことで

`pg_group` は、グループとメンバーの一覧を古い形式で見せるビューです。PostgreSQL では、ログインできないロールをグループとして扱います。そのため、このビューは `pg_authid` からログインできないロールだけを選びます。

## コード

```sql:line-numbers=57
CREATE VIEW pg_group AS
    SELECT
        rolname AS groname,
        oid AS grosysid,
        ARRAY(SELECT member FROM pg_auth_members WHERE roleid = pg_authid.oid) AS grolist
    FROM pg_authid
    WHERE NOT rolcanlogin;
```

## 前提知識

- **ロール**: PostgreSQL で、利用者やグループを区別して表す単位。
- **`rolcanlogin`**: ロールがログインできるかを表す列。`false` のロールは、グループとして使われることが多い。
- **`ARRAY(SELECT ...)`**: サブクエリの結果を、1 つの配列にまとめる書き方。
- **`pg_auth_members`**: どのロールがどのロールに所属しているかを記録する表。

## 何をしているか

### 1. ログインできないロールを選ぶ

```sql:line-numbers=63
    WHERE NOT rolcanlogin;
```

`WHERE NOT rolcanlogin` で、グループとして使うロールだけを残します。

### 2. 所属メンバーを配列にする

```sql:line-numbers=61
        ARRAY(SELECT member FROM pg_auth_members WHERE roleid = pg_authid.oid) AS grolist
```

`grolist` は、`pg_auth_members` から自分の OID を持つ行の `member` を集めて、1 つの配列にしたものです。所属が 1 人もいないグループでも、`ARRAY` は空の配列を返します。

## ここがすごい

- **行ではなく配列で返す**: 1 つのグループに対して、メンバーの一覧を 1 列で表せます。古い `pg_group` の形に合わせるための工夫です。
- **同じ表の別の列を組み合わせる**: 名前と OID は `pg_authid` から、メンバーは `pg_auth_members` から取り、1 つのビューにまとめています。
- **互換性を守る**: 新しい仕組みに移ったあとも、古いアプリケーションが読めるように残されたビューです。

## まとめ

- ログインできないロールを、グループとみなして表示する。
- 1 対多の関係は、`ARRAY` のサブクエリで 1 行にまとめられる。
- 古い形式を残すビューは、内部の表を読み替えて作られる。
