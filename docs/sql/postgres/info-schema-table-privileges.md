---
title: "表の権限を ACL から展開し、SELECT かどうかを判定する"
description: "information_schema.table_privileges。表の ACL を aclexplode で行に広げ、付与の権限を CASE で YES と NO にし、SELECT の権限だけ with_hierarchy を YES にする。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [1884, 1892]
function: "table_privileges"
difficulty: 3
tags: [防御的プログラミング, 型システム]
format: 2
---

## ひとことで

`table_privileges` は、表ごとに、誰が誰にどの権限を与えたかを一覧するビューです。権限の情報は、表の ACL（アクセス制御の一覧）という 1 つの配列に入っているので、それを行に広げてから読みやすく直しています。

## コード

```sql:line-numbers=1884
CREATE VIEW table_privileges AS
    SELECT CAST(u_grantor.rolname AS sql_identifier) AS grantor,
           CAST(grantee.rolname AS sql_identifier) AS grantee,
           CAST(current_database() AS sql_identifier) AS table_catalog,
           CAST(nc.nspname AS sql_identifier) AS table_schema,
           CAST(c.relname AS sql_identifier) AS table_name,
           CAST(c.prtype AS character_data) AS privilege_type,
           CAST(
             CASE WHEN
```

## 前提知識

- **ACL（アクセス制御リスト）**: 権限の付与を、配列の 1 つの値にまとめたもの。`relacl` という列に入る。
- **`aclexplode()`**: ACL の配列を、「付与者、被付与者、権限、付与の権限の有無」の行に広げる関数。
- **`acldefault()`**: 権限の設定が無いときの既定の ACL を作る関数。
- **`WITH GRANT OPTION`**: 付与された権限を、さらに他の人に与える権限。
- **`with_hierarchy`**: 表の継承の階層を、`SELECT` の権限で見られるかを表す列。

## 何をしているか

### 1. ACL を行に広げる

表の `relacl` を `aclexplode()` で行に広げます。設定が無い場合は、既定の権限を使います。

```sql:line-numbers=1900
            SELECT oid, relname, relnamespace, relkind, relowner, (aclexplode(coalesce(relacl, acldefault('r', relowner)))).* FROM pg_class
```

広げた結果の列に、`grantor`、`grantee`、`prtype`（権限の種類）、`grantable`（付与の権限）などの名前を付けています。

### 2. 付与の権限を YES と NO にする

`is_grantable` は、被付与者が所有者のロールを使えるか、または付与の権限があるかで決まります。所有者は、いつも他の人に権限を与えられる、という規則がここで表されています。

```sql:line-numbers=1891
           CAST(
             CASE WHEN
```

```sql:line-numbers=1894
                  pg_has_role(grantee.oid, c.relowner, 'USAGE')
                  OR c.grantable
                  THEN 'YES' ELSE 'NO' END AS yes_or_no) AS is_grantable,
```

### 3. SELECT の権限だけ with_hierarchy を YES にする

権限の種類が `SELECT` のときだけ、`with_hierarchy` を `YES` にします。

```sql:line-numbers=1897
           CAST(CASE WHEN c.prtype = 'SELECT' THEN 'YES' ELSE 'NO' END AS yes_or_no) AS with_hierarchy
```

`with_hierarchy` は、継承を含む階層の表を、読む権限で見られるかを表す項目です。SQL の標準の定義に合わせて、`SELECT` のときだけ `YES` になります。

## ここがすごい

- **配列を行に広げて、普通の条件で扱う**: 権限の配列を行に広げることで、列ごとの判定を `CASE` で書けます。
- **所有者の規則を式の中に入れる**: 所有者が常に付与できる、という規則を、`OR` の 1 つの条件として読めます。
- **標準の項目を、権限の種類から決める**: `with_hierarchy` は、`SELECT` の行だけ YES になります。標準の形に従うための工夫です。
- **トレードオフ**: `aclexplode()` は、権限の数だけ行を作るので、表の数が多いと一覧が長くなります。

## まとめ

- 配列に詰めた権限は、`aclexplode()` で行に広げると、条件で扱えるようになる。
- 所有者の特別な規則は、条件の 1 つとして書くと読みやすい。
- 標準の項目は、権限の種類に応じた `CASE` で決めると、意図が明確になる。
