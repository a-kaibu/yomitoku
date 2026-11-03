---
title: "自分が関わる USAGE 権限だけを見せる role_usage_grants"
description: "PostgreSQL の role_usage_grants ビュー。usage_privileges から、有効なロールが付与者か被付与者になっている行だけを残して見せる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [2416, 2429]
function: "role_usage_grants"
difficulty: 2
tags: [セキュリティ, API設計]
format: 2
---

## ひとことで

`role_usage_grants` は、USAGE 権限のうち、今の利用者に関係するものだけを見せるビューです。`usage_privileges` の結果から、有効なロールが関わる行だけを残します。`role_table_grants` と同じ形で書かれています。

## コード

```sql:line-numbers=2416
CREATE VIEW role_usage_grants AS
    SELECT grantor,
           grantee,
           object_catalog,
           object_schema,
           object_name,
           object_type,
           privilege_type,
           is_grantable
    FROM usage_privileges
    WHERE grantor IN (SELECT role_name FROM enabled_roles)
          OR grantee IN (SELECT role_name FROM enabled_roles);

GRANT SELECT ON role_usage_grants TO PUBLIC;
```

## 前提知識

- **USAGE 権限**: そのオブジェクトを使ってよいことを表す権限。
- **`usage_privileges`**: USAGE 権限を一覧にするビュー。このビューの元になっている。
- **`enabled_roles`**: 今有効になっているロールの一覧を返すビュー。
- **同じ形のビュー**: 表、型、USAGE など、対象が違うだけで同じ書き方をしたビュー群。

## 何をしているか

### 1. 権限の情報を列として並べる

```sql:line-numbers=2417
    SELECT grantor,
           grantee,
           object_catalog,
           object_schema,
           object_name,
           object_type,
           privilege_type,
           is_grantable
```

付与者、被付与者、対象の名前と種類、権限の種類、付与可能かどうかを、そのまま出します。

### 2. 関係する行だけを残す

```sql:line-numbers=2425
    FROM usage_privileges
    WHERE grantor IN (SELECT role_name FROM enabled_roles)
          OR grantee IN (SELECT role_name FROM enabled_roles);
```

付与者か被付与者が、有効なロールの一覧に含まれる行だけを残します。

## ここがすごい

- **同じ形を繰り返す**: 型やビューの種類が違っても、同じ書き方なので、一つ理解すれば他も読めます。
- **元のビューを再利用する**: 権限を求める仕組みは元のビューにあり、ここでは絞るだけです。
- **利用者の立場で見える**: 管理者でなくても、自分に関係する権限を確かめられます。

## まとめ

- 似た形のビューは、同じ書き方で揃える。
- 既存のビューを土台にして、利用者向けに絞る。
- 関係する行は、付与者と被付与者の両方で判断する。
