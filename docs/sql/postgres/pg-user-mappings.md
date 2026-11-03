---
title: "外部サーバーの接続情報を権限で伏せる"
description: "pg_user_mappings は、外部サーバーへの接続設定を一覧するビュー。ユーザー名の 0 を public として扱い、オプションは権限がある人にだけ見せる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1512, 1532]
function: "pg_user_mappings"
difficulty: 3
tags: [防御的プログラミング, 設計パターン]
format: 2
---

## ひとことで

`pg_user_mappings` は、外部サーバーに接続するときの、ユーザーごとの対応（ユーザーマッピング）を一覧するビューです。接続先のユーザー名や設定オプションには機密が含まれるため、見てよい人にだけオプションを見せる作りになっています。

## コード

```sql:line-numbers=1512
CREATE VIEW pg_user_mappings AS
    SELECT
        U.oid       AS umid,
        S.oid       AS srvid,
        S.srvname   AS srvname,
        U.umuser    AS umuser,
        CASE WHEN U.umuser = 0 THEN
            'public'
        ELSE
            A.rolname
        END AS usename,
        CASE WHEN (U.umuser <> 0 AND A.rolname = current_user
                     AND (pg_has_role(S.srvowner, 'USAGE')
                          OR has_server_privilege(S.oid, 'USAGE')))
                    OR (U.umuser = 0 AND pg_has_role(S.srvowner, 'USAGE'))
                    OR (SELECT rolsuper FROM pg_authid WHERE rolname = current_user)
                    THEN U.umoptions
                 ELSE NULL END AS umoptions
    FROM pg_user_mapping U
        JOIN pg_foreign_server S ON (U.umserver = S.oid)
        LEFT JOIN pg_authid A ON (A.oid = U.umuser);
```

## 前提知識

- **外部サーバー（foreign server）**: 別のデータベースなどへの接続先を登録したもの。`postgres_fdw` などで使う。
- **ユーザーマッピング**: ローカルのユーザーを、外部サーバーでのユーザー名と対応づける設定。パスワードなどが入ることがある。
- **`umuser = 0`**: 全ユーザーに共通の対応（`PUBLIC`）を表す特別な値。
- **`has_server_privilege()`**: 現在のユーザーが、外部サーバーに対する権限を持つかを返す関数。
- **`current_user`**: いま接続している利用者の名前。

## 何をしているか

### 1. 名前を付けて、`0` を public にする

ユーザーマッピングの `umuser` が `0` なら、全員向けの対応なので、名前を `public` にします。そうでなければ、ロールの名前を引きます。

```sql:line-numbers=1514
        U.oid       AS umid,
        S.oid       AS srvid,
        S.srvname   AS srvname,
        U.umuser    AS umuser,
        CASE WHEN U.umuser = 0 THEN
            'public'
        ELSE
            A.rolname
        END AS usename,
```

`CASE WHEN U.umuser = 0 THEN 'public'` という 1 行が、内部の `0` を人が読める言葉に変えています。

### 2. 権限がある人だけオプションを見せる

最後の `CASE` が、設定オプションを見せるかどうかを決めます。

```sql:line-numbers=1523
        CASE WHEN (U.umuser <> 0 AND A.rolname = current_user
                     AND (pg_has_role(S.srvowner, 'USAGE')
                          OR has_server_privilege(S.oid, 'USAGE')))
                    OR (U.umuser = 0 AND pg_has_role(S.srvowner, 'USAGE'))
                    OR (SELECT rolsuper FROM pg_authid WHERE rolname = current_user)
                    THEN U.umoptions
                 ELSE NULL END AS umoptions
```

見せる条件は、次のどれかです。自分のマッピングで、外部サーバーの権限がある。全員向けのマッピングで、サーバーの持ち主の権限がある。スーパーユーザーである。どれも満たさなければ、`NULL` になります。

## ここがすごい

- **同じ列の中で条件を重ねている**: オプションが機密かどうかを、1 つの `CASE` で判定しています。
- **スーパーユーザーに例外を設けている**: 管理者は、設定を確認して問題を見つける必要があるため、特別に見られるようにしています。
- **`NULL` で「見せられない」を表す**: 行は残し、オプションだけを伏せるので、どの接続が存在するかは分かります。
- **トレードオフ**: 条件が長く、読むには何度か確かめる必要があります。権限の仕組みを理解してから読むと理解しやすくなります。

## まとめ

- 行は残して、機密の列だけを権限で伏せると、存在の確認と情報の保護を両立できる。
- 全員向けを表す特別な値は、`CASE` の最初の分岐で読みやすい言葉にする。
- 管理者向けの例外は、条件に明示的に書くと監査しやすい。
