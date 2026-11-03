---
title: "自分が関わる型の権限だけを見せる role_udt_grants"
description: "PostgreSQL の role_udt_grants ビュー。udt_privileges から、有効なロールが付与者か被付与者になっている型の権限だけを残して見せる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [2225, 2237]
function: "role_udt_grants"
difficulty: 2
tags: [セキュリティ, 型システム]
format: 2
---

## ひとことで

`role_udt_grants` は、ユーザー定義の型（UDT）に対する権限のうち、今の利用者に関係するものだけを見せるビューです。複合型などに付けられた USAGE 権限を、有効なロールの立場から読めるようにします。

## コード

```sql:line-numbers=2225
CREATE VIEW role_udt_grants AS
    SELECT grantor,
           grantee,
           udt_catalog,
           udt_schema,
           udt_name,
           privilege_type,
           is_grantable
    FROM udt_privileges
    WHERE grantor IN (SELECT role_name FROM enabled_roles)
          OR grantee IN (SELECT role_name FROM enabled_roles);

GRANT SELECT ON role_udt_grants TO PUBLIC;
```

## 前提知識

- **ユーザー定義型（UDT）**: 利用者が作る型。ここでは複合型などを指す。
- **`udt_privileges`**: 型の権限を一覧にするビュー。このビューの元になっている。
- **`enabled_roles`**: 今有効になっているロールの一覧を返すビュー。
- **`WHERE ... OR ...`**: どちらかの条件を満たす行を残す条件。

## 何をしているか

### 1. 型の権限の情報を列として並べる

```sql:line-numbers=2226
    SELECT grantor,
           grantee,
           udt_catalog,
           udt_schema,
           udt_name,
           privilege_type,
           is_grantable
```

付与者、被付与者、型の名前と場所、権限の種類、付与可能かどうかを、そのまま出します。

### 2. 有効なロールに関係する行だけを残す

```sql:line-numbers=2233
    FROM udt_privileges
    WHERE grantor IN (SELECT role_name FROM enabled_roles)
          OR grantee IN (SELECT role_name FROM enabled_roles);
```

付与者か被付与者が、有効なロールに含まれる行だけを残します。型の権限でも、表の権限と同じ見方ができます。

## ここがすごい

- **型の権限も表と同じ見方にする**: 種類が違う対象でも、利用者が同じように確かめられます。
- **元の仕組みを使い回す**: 型の権限の計算は元のビューに任せ、ここでは絞り込みだけを書いています。
- **列の名前を揃える**: 他の権限のビューと同じ名前なので、まとめて読めます。

## まとめ

- 型の権限も、有効なロールの立場から絞って見せられる。
- 既存のビューの列の名前を揃えると、ほかのビューと並べて読める。
- 絞り込みだけを新しいビューにすると、重複した計算を避けられる。
