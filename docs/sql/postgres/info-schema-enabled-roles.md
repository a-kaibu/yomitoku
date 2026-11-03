---
title: "いま有効なロールだけを一覧する"
description: "information_schema.enabled_roles。pg_has_role の USAGE 権限で判定し、ログイン中のユーザーが実際に使えるロールの名前だけを返す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [1055, 1058]
function: "enabled_roles"
difficulty: 1
tags: [API設計, 防御的プログラミング]
format: 2
---

## ひとことで

`enabled_roles` は、いまログインしているユーザーが、実際に権限を使えるロールの名前を一覧するビューです。すべてのロールを見せるのではなく、`pg_has_role()` で「使える」と判定されたものだけを返します。

## コード

```sql:line-numbers=1055
CREATE VIEW enabled_roles AS
    SELECT CAST(a.rolname AS sql_identifier) AS role_name
    FROM pg_authid a
    WHERE pg_has_role(a.oid, 'USAGE');
```

## 前提知識

- **ロール（role）**: 権限の単位。ユーザーもグループもロールとして表される。
- **継承（inherit）**: あるロールの権限を、別のロールが自動的に使えること。`INHERIT` の属性で決まる。
- **`pg_has_role(ロール, 'USAGE')`**: 現在のユーザーが、指定したロールの権限を、継承を含めて使えるかを返す関数。
- **`CAST(... AS sql_identifier)`**: 値を、情報スキーマの識別子の型に変換する書き方。
- **`GRANT ... TO PUBLIC`**: 全ユーザーに読む権限を与えるための指定。

## 何をしているか

### 1. ロールの名前を取り出す

`pg_authid` は、ロールの情報を持つ内部テーブルです。その中の `rolname` を、情報スキーマの識別子の型として取り出します。

```sql:line-numbers=1056
    SELECT CAST(a.rolname AS sql_identifier) AS role_name
    FROM pg_authid a
```

### 2. 使えるロールだけを残す

`WHERE` の条件が、一覧の中身を決めます。

```sql:line-numbers=1058
    WHERE pg_has_role(a.oid, 'USAGE');
```

`pg_has_role(a.oid, 'USAGE')` は、「そのロールの権限を、現在のユーザーが使えるか」を判定します。ロールを直接持っている場合だけでなく、継承によって使える場合も真になります。そのため、利用者が実際に行える操作の範囲に近い一覧になります。

## ここがすごい

- **「存在する」ではなく「使える」を見せる**: 一覧の意味を、単なるロールの一覧から、実際の権限の一覧に変えています。
- **継承を判定の中に含める**: 継承まで自分で調べる必要がなく、組み込みの関数 1 つで済みます。
- **標準の名前に合わせている**: 情報スキーマは SQL の標準として定義されているため、他のデータベースと同じ名前で同じ意味の一覧を得られます。
- **トレードオフ**: `pg_has_role()` は、現在のユーザーに基づいて結果が変わります。管理者が見たときと、一般の利用者が見たときで、一覧の中身が違うことがあります。

## まとめ

- 「存在する一覧」と「使える一覧」は別物で、目的に応じて判定を変えるとよい。
- 継承を含む権限の判定は、組み込みの関数に任せると簡潔になる。
- 標準の名前に従うと、他のデータベースと比べやすい情報が得られる。
