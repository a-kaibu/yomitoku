---
title: "自分が関わる表の権限だけを見せる role_table_grants"
description: "PostgreSQL の role_table_grants ビュー。table_privileges から、現在有効なロールが付与者か被付与者になっている行だけを残して見せる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [1927, 1938]
function: "role_table_grants"
difficulty: 2
tags: [セキュリティ, API設計]
format: 2
---

## ひとことで

`role_table_grants` は、表に対する権限のうち、今の利用者に関係するものだけを見せるビューです。権限を付けた人（付与者）か、付けられた人（被付与者）が、今有効なロールに含まれる行だけを残します。すべての権限を見せると多すぎるので、この絞り込みが役立ちます。

## コード

```sql:line-numbers=1927
CREATE VIEW role_table_grants AS
    SELECT grantor,
           grantee,
           table_catalog,
           table_schema,
           table_name,
           privilege_type,
           is_grantable,
           with_hierarchy
    FROM table_privileges
    WHERE grantor IN (SELECT role_name FROM enabled_roles)
          OR grantee IN (SELECT role_name FROM enabled_roles);
```

## 前提知識

- **権限の付与（GRANT）**: ある役割に、表などへの操作を許すこと。
- **付与者と被付与者**: 権限を与えた側と、与えられた側。
- **`enabled_roles`**: 今のセッションで有効になっているロールの一覧を返すビュー。
- **`table_privileges`**: 表の権限をすべて並べたビュー。このビューの元になっている。

## 何をしているか

### 1. 表の権限の列を選ぶ

```sql:line-numbers=1928
    SELECT grantor,
           grantee,
           table_catalog,
           table_schema,
           table_name,
           privilege_type,
           is_grantable,
           with_hierarchy
```

権限の付与者、被付与者、表の場所、権限の種類、付与可能かどうかを、そのまま出します。

### 2. 有効なロールに関係する行だけを残す

```sql:line-numbers=1937
    WHERE grantor IN (SELECT role_name FROM enabled_roles)
          OR grantee IN (SELECT role_name FROM enabled_roles);
```

付与者か被付与者が `enabled_roles` に含まれる行だけを残します。サブクエリで、その一覧を取り出して `IN` で比べています。

## ここがすごい

- **元のビューを土台にする**: 表の権限の仕組みを、もう一度書かずに済みます。
- **二つの役割のどちらかで絞る**: 権限を与えた側でも与えられた側でも、関係があれば見えるので、取りこぼしがありません。
- **有効な役割だけで見る**: 利用者が切り替えた役割に応じて、見える内容が変わります。

## まとめ

- 既存のビューの結果を、条件で絞って別の見方を作る。
- 付与者と被付与者の両方を見ると、関係する権限を取りこぼさない。
- 有効な役割の一覧を使うと、利用者ごとに見える範囲が変わる。
