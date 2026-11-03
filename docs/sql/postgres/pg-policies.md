---
title: "行ごとのアクセス規則を人が読める表にする"
description: "行レベルセキュリティのポリシーを一覧するビュー。1 文字の内部コードを名前に変え、'{0}' を PUBLIC として読める形にしている。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [78, 111]
function: "pg_policies"
difficulty: 2
tags: [型システム, 防御的プログラミング]
format: 2
---

## ひとことで

`pg_policies` は、テーブルごとの行レベルセキュリティ（RLS）のルールを一覧するビューです。内部では 1 文字の記号（`r` や `a` など）や、ロールの番号の配列として保存されているものを、人が読める言葉に直しています。

## コード

```sql:line-numbers=78
CREATE VIEW pg_policies AS
    SELECT
        N.nspname AS schemaname,
        C.relname AS tablename,
        pol.polname AS policyname,
        CASE
            WHEN pol.polpermissive THEN
                'PERMISSIVE'
            ELSE
                'RESTRICTIVE'
        END AS permissive,
        CASE
            WHEN pol.polroles = '{0}' THEN
                string_to_array('public', '')
            ELSE
                ARRAY
                (
                    SELECT rolname
                    FROM pg_catalog.pg_authid
                    WHERE oid = ANY (pol.polroles) ORDER BY 1
                )
        END AS roles,
        CASE pol.polcmd
            WHEN 'r' THEN 'SELECT'
            WHEN 'a' THEN 'INSERT'
            WHEN 'w' THEN 'UPDATE'
            WHEN 'd' THEN 'DELETE'
            WHEN '*' THEN 'ALL'
        END AS cmd,
        pg_catalog.pg_get_expr(pol.polqual, pol.polrelid) AS qual,
        pg_catalog.pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
    FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class C ON (C.oid = pol.polrelid)
    LEFT JOIN pg_catalog.pg_namespace N ON (N.oid = C.relnamespace);
```

## 前提知識

- **行レベルセキュリティ（RLS）**: テーブルの行ごとに、誰が読めるか、書けるかを決める仕組み。ポリシーとして定義する。
- **`CASE ... WHEN ... THEN ... END`**: 条件に合った最初の値を返す分岐。
- **`ARRAY(SELECT ...)`**: サブクエリの結果を配列にまとめる書き方。
- **`pg_get_expr()`**: 内部に保存された式を、読める SQL の文字列に戻す関数。
- **`PUBLIC`**: 全ロールを表す特別な名前。内部では `oid` が `0` のロールとして扱われる。

## 何をしているか

### 1. 内部の値を読める語に変える

ポリシーが許可する操作は、保存時には 1 文字のコードで入っています。`CASE` で 1 つずつ変換します。

```sql:line-numbers=100
        CASE pol.polcmd
            WHEN 'r' THEN 'SELECT'
            WHEN 'a' THEN 'INSERT'
            WHEN 'w' THEN 'UPDATE'
            WHEN 'd' THEN 'DELETE'
            WHEN '*' THEN 'ALL'
        END AS cmd,
```

### 2. `'{0}'` を PUBLIC として読める形にする

ポリシーの対象ロールが空（`{0}`）のときは、全員が対象であることを表します。その場合は `public` という名前の配列を返します。

```sql:line-numbers=89
        CASE
            WHEN pol.polroles = '{0}' THEN
                string_to_array('public', '')
            ELSE
```

それ以外のときは、対象ロールの名前を `ARRAY(SELECT ...)` で集めます。`ORDER BY 1` は、名前の順に並べるための指定です。

```sql:line-numbers=93
                ARRAY
                (
                    SELECT rolname
                    FROM pg_catalog.pg_authid
                    WHERE oid = ANY (pol.polroles) ORDER BY 1
                )
```

### 3. 式を文字列に戻して、対象の行を示す

`qual` は読み取りや更新の対象行を決める条件、`with_check` は書き込み後の行を確かめる条件です。どちらも内部の表現なので、`pg_get_expr()` で文字列に戻します。

```sql:line-numbers=107
        pg_catalog.pg_get_expr(pol.polqual, pol.polrelid) AS qual,
        pg_catalog.pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
```

## ここがすごい

- **番号のままでは読めない値を、ビューが翻訳している**: `r` や `*` のような記号を覚えなくても、`SELECT` や `ALL` と読めます。
- **空の配列を特別扱いしている**: `'{0}'` は「全員」を意味する値なので、ふつうの名前と区別して `public` に直しています。
- **トレードオフ**: `string_to_array('public', '')` のような書き方は、初めて見る人には分かりにくいです。区切り文字が空の場合は、文字列全体を 1 つの要素として扱う、という仕様を知っていると読めます。

## まとめ

- 内部の 1 文字コードは、`CASE` で読みやすい言葉に変えられる。
- 特別な値（全員を表す空配列など）は、ほかの値と区別して書く。
- 式のような内部表現は、関数で文字列に戻すと確認できる。
