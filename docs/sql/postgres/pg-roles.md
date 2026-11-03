---
title: "パスワードを伏せ字にして見せるロール一覧"
description: "PostgreSQL のユーザーとグループの一覧ビュー。内部テーブルのパスワード列を定数の伏せ字に置き換え、ロールごとの設定を LEFT JOIN で付け加えている。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [22, 38]
function: "pg_roles"
difficulty: 1
tags: [API設計, 防御的プログラミング]
format: 2
---

## ひとことで

`pg_roles` は、データベースのユーザーとグループ（ロール）を一覧するビューです。ロールの本体は `pg_authid` という内部テーブルにありますが、そこにはパスワードのハッシュが入るため、このビューでは中身を伏せ字に置き換えて見せます。

## コード

```sql:line-numbers=22
CREATE VIEW pg_roles AS
    SELECT
        rolname,
        rolsuper,
        rolinherit,
        rolcreaterole,
        rolcreatedb,
        rolcanlogin,
        rolreplication,
        rolconnlimit,
        '********'::text as rolpassword,
        rolvaliduntil,
        rolbypassrls,
        setconfig as rolconfig,
        pg_authid.oid
    FROM pg_authid LEFT JOIN pg_db_role_setting s
    ON (pg_authid.oid = setrole AND setdatabase = 0);
```

## 前提知識

- **ロール（role）**: PostgreSQL の権限の単位。ユーザーもグループも同じ「ロール」として管理される。
- **カタログ**: PostgreSQL がテーブルや関数などの情報を入れておく内部テーブル群。`pg_authid` もその一つ。
- **`LEFT JOIN`**: 左の表の行を必ず残し、右の表に一致する行があれば列を付ける結合。
- **`::text`**: 値を文字列型にする書き方（型キャスト）。
- **`setrole` と `setdatabase`**: `ALTER ROLE ... SET` で登録したロールごとの設定を表す列。

## 何をしているか

### 1. 権限のある列だけを選んで名前を付ける

ほとんどの列は、内部テーブルの名前をそのまま見せるだけです。

```sql:line-numbers=22
CREATE VIEW pg_roles AS
    SELECT
        rolname,
        rolsuper,
        rolinherit,
        rolcreaterole,
        rolcreatedb,
        rolcanlogin,
        rolreplication,
        rolconnlimit,
```

### 2. パスワードを伏せ字に置き換える

パスワードの列は、実際の値の代わりに固定の文字列 `'********'` を返します。

```sql:line-numbers=32
        '********'::text as rolpassword,
```

これで、ビューを読める人にもハッシュ値は見えません。`pg_roles` を読めるのは全員ですが、元のテーブルは管理者だけが読める、という分け方になっています。

### 3. ロールごとの設定を結合する

最後に、`pg_db_role_setting` を結合して `ALTER ROLE ... SET` の設定を配列として付けます。

```sql:line-numbers=35
        setconfig as rolconfig,
        pg_authid.oid
    FROM pg_authid LEFT JOIN pg_db_role_setting s
    ON (pg_authid.oid = setrole AND setdatabase = 0);
```

`setdatabase = 0` は「どのデータベースにも共通の設定」を選ぶ条件です。`LEFT JOIN` なので、設定を持たないロールも一覧から消えません。

## ここがすごい

- **元のテーブルを隠さずに、見せ方だけを変えている**: パスワードを消すのではなく伏せ字にすることで、列の並びや型が変わらず、ツールが壊れにくくなります。
- **`LEFT JOIN` が効いている**: 設定を持たないロールも行として残り、一覧が欠けません。`INNER JOIN` にすると、設定のないロールは消えてしまいます。
- **トレードオフ**: 伏せ字の列は、本当にパスワードが入っていないことを示すものではありません。機密の扱いは、ビューの読み取り権限の設計と合わせて考える必要があります。

## まとめ

- 内部の表は、名前と見せ方を整えたビューで公開すると読みやすくなる。
- 機密の列は、定数に置き換えると型を保ったまま隠せる。
- 付随する設定は `LEFT JOIN` で足すと、対応のない行を落とさずに済む。
