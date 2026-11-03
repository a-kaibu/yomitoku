---
title: "古い互換のためのパスワード付きユーザー一覧"
description: "pg_shadow は、昔の互換のために残されたユーザー一覧のビュー。ログインできるロールだけを選び、一般のユーザーからは REVOKE で隠している。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [40, 55]
function: "pg_shadow"
difficulty: 1
tags: [防御的プログラミング, 移植性]
format: 2
---

## ひとことで

`pg_shadow` は、ログインできるユーザーの一覧を、昔の形式の列名で返すビューです。パスワードの情報を含むので、一般の利用者からは見えないように `REVOKE` で権限を取り消しています。新しいコードは `pg_roles` を使う前提で、このビューは互換のために残されています。

## コード

```sql:line-numbers=40
CREATE VIEW pg_shadow AS
    SELECT
        rolname AS usename,
        pg_authid.oid AS usesysid,
        rolcreatedb AS usecreatedb,
        rolsuper AS usesuper,
        rolreplication AS userepl,
        rolbypassrls AS usebypassrls,
        rolpassword AS passwd,
        rolvaliduntil AS valuntil,
        setconfig AS useconfig
    FROM pg_authid LEFT JOIN pg_db_role_setting s
    ON (pg_authid.oid = setrole AND setdatabase = 0)
    WHERE rolcanlogin;

REVOKE ALL ON pg_shadow FROM public;
```

## 前提知識

- **ロール（role）**: ユーザーやグループを表す PostgreSQL の権限の単位。`rolcanlogin` が真なら、接続してログインできる。
- **互換ビュー**: 古いバージョンの名前や列の形を保ち、既存のプログラムが動き続けるようにするためのビュー。
- **`REVOKE ... FROM public`**: 全ユーザーに与えられている権限を取り消す文。
- **`AS` による別名**: 列の名前を、古い形式（`usename` など）に合わせる。

## 何をしているか

### 1. ログインできるロールだけを選ぶ

内部のロールの情報を、`pg_authid` と `pg_db_role_setting` の結合から取り出します。

```sql:line-numbers=41
    SELECT
        rolname AS usename,
        pg_authid.oid AS usesysid,
        rolcreatedb AS usecreatedb,
        rolsuper AS usesuper,
        rolreplication AS userepl,
        rolbypassrls AS usebypassrls,
        rolpassword AS passwd,
        rolvaliduntil AS valuntil,
        setconfig AS useconfig
    FROM pg_authid LEFT JOIN pg_db_role_setting s
    ON (pg_authid.oid = setrole AND setdatabase = 0)
```

`WHERE rolcanlogin` が、このビューの絞り込みです。グループのロールは、ログインできないので一覧に入りません。

### 2. 一般の利用者からは権限を取り消す

ビューを作ったあと、全員に与えられる既定の権限を取り消します。

```sql:line-numbers=55
REVOKE ALL ON pg_shadow FROM public;
```

パスワードを含む列があるため、既定のまま公開しないことが重要です。管理者だけが、このビューを読めるようになります。

## ここがすごい

- **古い名前のまま互換性を保つ**: 列名を `usename` などに揃えているので、古いツールが書き換えなしで動きます。
- **絞り込みと権限の二重の防御**: 「ログインできるロールだけ」という条件と、`REVOKE` による権限の制限を分けて持っています。
- **新しいビューへの誘導**: 同じ情報を `pg_roles` などの新しいビューが持つため、新しいコードでは使わない前提で設計されています。
- **トレードオフ**: 互換のために同じ情報が複数のビューに分かれてしまいます。どちらを更新するかを、開発者が意識する必要があります。

## まとめ

- 互換のためのビューは、古い名前を保ちつつ条件を絞るとよい。
- 機密の列を含むビューには、既定の権限を取り消す文を必ず付ける。
- 同じ情報が複数ある場合は、新しい方を推奨する設計にすると混乱が減る。
