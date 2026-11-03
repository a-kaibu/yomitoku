---
title: "ビューの定義文を権限のある人だけに見せる"
description: "information_schema.views。ビューの SELECT 文を pg_get_viewdef() で取り出すが、持ち主の権限があるときだけ見せる。チェックオプションは配列の文字列から読む。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [2599, 2615]
function: "views"
difficulty: 2
tags: [防御的プログラミング, API設計]
format: 2
---

## ひとことで

`views` は、データベース内のビューの一覧と、その定義（`SELECT` 文）を返します。ただし、ビューの持ち主の権限を持つ人にだけ定義文を見せる、という制限が入っています。チェックオプションの種類は、保存された設定の文字列から読み取ります。

## コード

```sql:line-numbers=2599
CREATE VIEW views AS
    SELECT CAST(current_database() AS sql_identifier) AS table_catalog,
           CAST(nc.nspname AS sql_identifier) AS table_schema,
           CAST(c.relname AS sql_identifier) AS table_name,

           CAST(
             CASE WHEN pg_has_role(c.relowner, 'USAGE')
                  THEN pg_get_viewdef(c.oid)
                  ELSE null END
             AS character_data) AS view_definition,

           CAST(
             CASE WHEN 'check_option=cascaded' = ANY (c.reloptions)
                  THEN 'CASCADED'
                  WHEN 'check_option=local' = ANY (c.reloptions)
                  THEN 'LOCAL'
                  ELSE 'NONE' END
```

## 前提知識

- **ビュー（VIEW）**: 保存された `SELECT` 文に名前を付けたもの。
- **`pg_get_viewdef()`**: ビューの定義文を文字列に戻す関数。
- **`pg_has_role()`**: 現在のユーザーが、ロールの権限を持つか確かめる関数。
- **`reloptions`**: テーブルやビューに付けた設定を、`名前=値` の文字列の配列として保存した列。
- **`= ANY (配列)`**: 配列の中のどれかの要素と一致するかを調べる比較。
- **チェックオプション**: ビュー経由で行を追加・更新するとき、ビューの条件を満たすかを確かめる設定。`CASCADED` と `LOCAL` がある。

## 何をしているか

### 1. 名前と所在を取り出す

ビューの所在は、テーブルと同じように 3 つの名前で表します。

```sql:line-numbers=2600
    SELECT CAST(current_database() AS sql_identifier) AS table_catalog,
           CAST(nc.nspname AS sql_identifier) AS table_schema,
           CAST(c.relname AS sql_identifier) AS table_name,
```

### 2. 権限があるときだけ定義文を返す

定義文は、ビューの持ち主に権限があるときだけ取り出されます。

```sql:line-numbers=2604
           CAST(
             CASE WHEN pg_has_role(c.relowner, 'USAGE')
                  THEN pg_get_viewdef(c.oid)
                  ELSE null END
             AS character_data) AS view_definition,
```

権限がなければ `NULL` になります。定義文には、他人のテーブル名や条件が含まれるかもしれないので、見てよい人にだけ見せる作りです。

### 3. チェックオプションを読み取る

最後の部分は、保存された設定の配列から、チェックオプションの種類を探します。

```sql:line-numbers=2610
           CAST(
             CASE WHEN 'check_option=cascaded' = ANY (c.reloptions)
                  THEN 'CASCADED'
                  WHEN 'check_option=local' = ANY (c.reloptions)
                  THEN 'LOCAL'
                  ELSE 'NONE' END
```

`'check_option=cascaded' = ANY (c.reloptions)` は、配列の中に同じ文字列があるかを調べます。どちらも無ければ `NONE` を返します。

## ここがすごい

- **定義文の公開を権限で絞っている**: ビューの一覧は誰でも見られますが、中身の SQL は持ち主の権限がないと見えません。
- **設定を文字列の配列のまま扱う**: 専用の列を作らず、`reloptions` の文字列を比べるだけで済ませています。
- **トレードオフ**: 文字列の綴りを間違えると、チェックオプションが `NONE` に見えてしまいます。内部の綴りに依存する書き方なので、変更時は注意が必要です。

## まとめ

- 公開してよい情報と、権限が必要な情報を、同じビューの中で分けられる。
- 設定を文字列の配列で持つと、列を増やさずに多くの属性を保存できる。
- `= ANY` は、配列の中の値を調べる基本の書き方。
