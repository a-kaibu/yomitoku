---
title: "継承で使える役割の一覧と、pg_database_owner の補完"
description: "information_schema.applicable_roles。pg_auth_members と、データベースの持ち主を表す pg_database_owner を UNION でまとめ、使えるロールだけを返す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [244, 247]
function: "applicable_roles"
difficulty: 3
tags: [防御的プログラミング, データ構造]
format: 2
---

## ひとことで

`applicable_roles` は、現在のユーザーが、どのロールに入っているか（どのロールの権限を使えるか）を一覧するビューです。ロールの所属の表 `pg_auth_members` に、データベースの持ち主を表す特別な役割を加えて、1 つの一覧にしています。

## コード

```sql:line-numbers=244
    SELECT CAST(a.rolname AS sql_identifier) AS grantee,
           CAST(b.rolname AS sql_identifier) AS role_name,
           CAST(CASE WHEN m.admin_option THEN 'YES' ELSE 'NO' END AS yes_or_no) AS is_grantable
    FROM (SELECT member, roleid, admin_option FROM pg_auth_members
```

## 前提知識

- **`pg_auth_members`**: ロールの所属関係を持つ内部テーブル。どのロールが、どのロールに入っているかを表す。
- **`admin_option`**: そのロールを、さらに他の人に与える権限を持つかどうか。
- **`pg_database_owner`**: データベースの持ち主を表す、特別な組み込みのロール。
- **`UNION`**: 2 つの結果をつなぎ、重複を取り除く集合の演算。
- **`pg_has_role(ロール, 'USAGE')`**: 現在のユーザーが、そのロールの権限を使えるかを返す関数。

## 何をしているか

### 1. 所属の表を取り出す

`pg_auth_members` の行を、所属する人（`member`）と、入っているロール（`roleid`）、付与の権限（`admin_option`）の組として取ります。

```sql:line-numbers=247
    FROM (SELECT member, roleid, admin_option FROM pg_auth_members
```

### 2. 持ち主のロールを UNION で足す

コメントにあるように、ここで `UNION` を使っているのは、将来の拡張に備えるためです。データベースの持ち主の関係を、同じ形の行として並べ足しています。

```sql:line-numbers=250
          UNION
          SELECT datdba, pg_authid.oid, false
          FROM pg_database, pg_authid
          WHERE datname = current_database() AND rolname = 'pg_database_owner'
         )  m
```

`datdba` がデータベースの持ち主の番号で、それを `pg_database_owner` の番号と組にしています。`false` は、付与の権限が無いことを表します。

### 3. 名前を付けて、使えるものだけを残す

2 つの表を、`oid` で名前に結びつけます。最後に、現在のユーザーが使えるロールだけを残します。

```sql:line-numbers=255
         JOIN pg_authid a ON (m.member = a.oid)
         JOIN pg_authid b ON (m.roleid = b.oid)
    WHERE pg_has_role(a.oid, 'USAGE');
```

## ここがすごい

- **特別な役割を表の形に載せる**: 組み込みの役割を、所属の表と同じ形の行として並べて、一覧を 1 つにしています。
- **`UNION` の選択を説明する**: 重複を取り除く `UNION` を使うのは、同じ行が 2 回出ないようにするためだと、コメントで理由を残しています。
- **権限で見せる範囲を絞る**: 所属の全部ではなく、使えるものだけを返します。
- **トレードオフ**: 同じ行が重複しないよう、`UNION` は並べ替えや比較の処理を伴います。行数が多いと、この処理が重くなります。

## まとめ

- 特別な役割も、同じ形の行として並べると、一覧の中で統一して扱える。
- 重複を避けたい集合は `UNION`、避けなくてよいなら `UNION ALL` と使い分ける。
- 見せる範囲は、最後の `WHERE` で権限の判定をすると明確になる。
