---
title: "接続中のセッションを一覧する LEFT JOIN"
description: "いま動いているセッションを一覧するビュー。データベース名と役割名を LEFT JOIN で付け、背景プロセスのようにユーザーを持たない行も残している。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [939, 965]
function: "pg_stat_activity"
difficulty: 2
tags: [並行処理, API設計]
format: 2
---

## ひとことで

`pg_stat_activity` は、いま動いているセッションとバックグラウンドプロセスを一覧するビューです。どのユーザーが、どのデータベースで、何のクエリを実行しているかを 1 つの表で見られます。

## コード

```sql:line-numbers=939
CREATE VIEW pg_stat_activity AS
    SELECT
            S.datid AS datid,
            D.datname AS datname,
            S.pid,
            S.leader_pid,
            S.usesysid,
            U.rolname AS usename,
            S.application_name,
            S.client_addr,
            S.client_hostname,
            S.client_port,
            S.backend_start,
            S.xact_start,
            S.query_start,
            S.state_change,
            S.wait_event_type,
            S.wait_event,
            S.state,
            S.backend_xid,
            S.backend_xmin,
            S.query_id,
            S.query,
            S.backend_type
    FROM pg_stat_get_activity(NULL) AS S
        LEFT JOIN pg_database AS D ON (S.datid = D.oid)
        LEFT JOIN pg_authid AS U ON (S.usesysid = U.oid);
```

## 前提知識

- **セッション（バックエンド）**: クライアントが接続するたびに作られる、サーバー側の処理単位。
- **`LEFT JOIN`**: 左の表の行を必ず残し、右に一致する行がなければ右の列を `NULL` にする結合。
- **`NULL`**: 値が無いことを表す特別な状態。
- **並列クエリ**: 1 つのクエリを複数のプロセスで分担して処理すること。ワーカーは `leader_pid` で、もとの接続を指す。

## 何をしているか

### 1. 内部の関数からセッションの情報を取る

`pg_stat_get_activity(NULL)` は、すべてのセッションの状態を返す関数です。引数に `pid` を渡すと、その 1 つだけに絞れます。

```sql:line-numbers=939
CREATE VIEW pg_stat_activity AS
    SELECT
            S.datid AS datid,
            D.datname AS datname,
            S.pid,
            S.leader_pid,
            S.usesysid,
            U.rolname AS usename,
            S.application_name,
            S.client_addr,
            S.client_hostname,
            S.client_port,
```

`leader_pid` は、並列ワーカーがどの接続から生まれたかを示します。

### 2. 時刻や状態の列を付ける

接続の開始時刻、クエリの開始時刻、待ち状態などを並べています。

```sql:line-numbers=951
            S.backend_start,
            S.xact_start,
            S.query_start,
            S.state_change,
            S.wait_event_type,
            S.wait_event,
            S.state,
            S.backend_xid,
            S.backend_xmin,
            S.query_id,
            S.query,
            S.backend_type
```

`query` にはいま実行中のクエリの文字列が入ります。`query_id` は、同じ形のクエリを束ねて数えるための番号です。

### 3. データベース名とユーザー名を LEFT JOIN で付ける

`datid`（データベースの番号）と `usesysid`（ユーザーの番号）を、名前に変えて見せます。

```sql:line-numbers=963
    FROM pg_stat_get_activity(NULL) AS S
        LEFT JOIN pg_database AS D ON (S.datid = D.oid)
        LEFT JOIN pg_authid AS U ON (S.usesysid = U.oid);
```

## ここがすごい

- **`LEFT JOIN` が必須の理由がある**: チェックポイントや自動 VACUUM などの背景プロセスは、どのデータベースにも、ユーザーにも属しません。`INNER JOIN` にすると、そうした行が消えてしまいます。
- **内部の関数を 1 行で包んでいる**: 関数の結果を `S` として使い、必要な列だけを選ぶので、利用者は内部の仕組みを知らなくても使えます。
- **トレードオフ**: 行の内容は、読んだ時点のスナップショットです。見ている間に状態が変わることがあります。

## まとめ

- 「ユーザーを持たない行もある」なら、結合は `LEFT JOIN` で残す。
- 内部の関数をビューで包むと、利用者向けの列名と見せ方を整えられる。
- 並列処理の行を親の接続と結びつける `leader_pid` のような列は、運用の調べ物で役立つ。
