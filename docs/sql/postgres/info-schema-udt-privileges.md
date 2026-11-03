---
title: "複合型の USAGE 権限を一覧にする udt_privileges"
description: "PostgreSQL の udt_privileges ビュー。pg_type の ACL を aclexplode で一行ずつに展開し、複合型に付けられた USAGE 権限を、PUBLIC を含めて並べる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [2197, 2215]
function: "udt_privileges"
difficulty: 3
tags: [セキュリティ, 型システム]
format: 2
---

## ひとことで

`udt_privileges` は、ユーザー定義の複合型に付けられた USAGE 権限を一覧にするビューです。型の権限は、一つの配列に詰められて保存されています。このビューは、その配列を一行ずつに展開して、権限を持つ人ごとに見せます。

## コード

```sql:line-numbers=2197
    FROM (
            SELECT oid, typname, typnamespace, typtype, typowner, (aclexplode(coalesce(typacl, acldefault('T', typowner)))).* FROM pg_type
         ) AS t (oid, typname, typnamespace, typtype, typowner, grantor, grantee, prtype, grantable),
         pg_namespace n,
         pg_authid u_grantor,
         (
           SELECT oid, rolname FROM pg_authid
           UNION ALL
           SELECT 0::oid, 'PUBLIC'
         ) AS grantee (oid, rolname)

    WHERE t.typnamespace = n.oid
          AND t.typtype = 'c'
          AND t.grantee = grantee.oid
          AND t.grantor = u_grantor.oid
          AND t.prtype IN ('USAGE')
          AND (pg_has_role(u_grantor.oid, 'USAGE')
               OR pg_has_role(grantee.oid, 'USAGE')
               OR grantee.rolname = 'PUBLIC');
```

## 前提知識

- **ACL（アクセス制御リスト）**: 誰に、どの権限があるかを、配列の形で表したもの。
- **`aclexplode`**: ACL の配列を、一要素ずつの行に展開する関数。
- **`acldefault`**: 権限の設定が無いときに使う、既定の ACL を返す関数。
- **複合型（`typtype = 'c'`）**: 複数の列をまとめた型。
- **`PUBLIC` の番号 0**: 全員を表す特別な番号。`oid` が 0 の行が PUBLIC になる。

## 何をしているか

### 1. 型の権限を一行ずつに展開する

```sql:line-numbers=2198
            SELECT oid, typname, typnamespace, typtype, typowner, (aclexplode(coalesce(typacl, acldefault('T', typowner)))).* FROM pg_type
         ) AS t (oid, typname, typnamespace, typtype, typowner, grantor, grantee, prtype, grantable),
```

`pg_type` の ACL を `aclexplode` で展開し、付与者、被付与者、権限の種類を、行ごとに取り出します。ACL が無いときは、既定の ACL を使います。

### 2. 対象と条件で絞る

```sql:line-numbers=2208
    WHERE t.typnamespace = n.oid
          AND t.typtype = 'c'
          AND t.grantee = grantee.oid
          AND t.grantor = u_grantor.oid
          AND t.prtype IN ('USAGE')
```

スキーマとの結合で名前を引き、複合型（`typtype = 'c'`）で、権限が `USAGE` の行だけを残します。

### 3. 利用者に関係する行だけにする

```sql:line-numbers=2213
          AND (pg_has_role(u_grantor.oid, 'USAGE')
               OR pg_has_role(grantee.oid, 'USAGE')
               OR grantee.rolname = 'PUBLIC');
```

権限を付けた人か、付けられた人に関係するか、`PUBLIC` の行なら、その行を残します。

## ここがすごい

- **配列を行に変える**: 権限の詰まった配列を、行ごとに一つの権限として扱えるので、条件で絞れます。
- **`PUBLIC` も同じ形で扱う**: 番号 0 の行を足すことで、全員への権限を特別扱いせずに並べられます。
- **既定の権限を補う**: 権限の記録が無い型でも、既定の ACL から正しい行を作れます。

## まとめ

- 配列で保存された権限は、`aclexplode` で行に展開すると扱いやすい。
- 全員を表す特別な値を、同じ形の行として並べる。
- 既定の設定を補うと、記録が無い対象も正しく扱える。
