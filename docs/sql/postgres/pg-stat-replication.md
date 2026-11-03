---
title: "複製先の状態を JOIN で絞って見せる"
description: "pg_stat_replication は、WAL を送っている複製先（WAL sender）の一覧。セッション情報と送信の状態を JOIN で結び、送信中の接続だけを残す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [967, 991]
function: "pg_stat_replication"
difficulty: 2
tags: [並行処理, API設計]
format: 2
---

## ひとことで

`pg_stat_replication` は、このサーバーから別のサーバーへ、WAL（変更の記録）を送っている接続の一覧です。複製先がどこまで受け取り、どこまで反映したかを、遅れ（lag）の時間と一緒に見せます。

## コード

```sql:line-numbers=967
CREATE VIEW pg_stat_replication AS
    SELECT
            S.pid,
            S.usesysid,
            U.rolname AS usename,
            S.application_name,
            S.client_addr,
            S.client_hostname,
            S.client_port,
            S.backend_start,
            S.backend_xmin,
            W.state,
            W.sent_lsn,
            W.write_lsn,
            W.flush_lsn,
            W.replay_lsn,
            W.write_lag,
            W.flush_lag,
            W.replay_lag,
            W.sync_priority,
            W.sync_state,
            W.reply_time
    FROM pg_stat_get_activity(NULL) AS S
        JOIN pg_stat_get_wal_senders() AS W ON (S.pid = W.pid)
        LEFT JOIN pg_authid AS U ON (S.usesysid = U.oid);
```

## 前提知識

- **WAL sender**: WAL を複製先へ送るための、サーバー側のプロセス。
- **LSN**: WAL の中の位置を表す番号。送った位置や反映した位置を比べられる。
- **レプリケーションの遅れ（lag）**: 送信、書き込み、反映などの段階で、どれだけ後れているかを表す時間。
- **`JOIN` と `LEFT JOIN`**: 両方に一致する行だけを残す結合と、左を残す結合。
- **セッション**: 接続ごとの作業単位。`pg_stat_get_activity()` で一覧できる。

## 何をしているか

### 1. 接続情報と送信の情報を組み合わせる

`pg_stat_get_activity()` の行（接続の情報）と、`pg_stat_get_wal_senders()` の行（送信の情報）を、プロセスの番号 `pid` で結びます。

```sql:line-numbers=989
    FROM pg_stat_get_activity(NULL) AS S
        JOIN pg_stat_get_wal_senders() AS W ON (S.pid = W.pid)
```

`JOIN` なので、両方に一致するものだけが残ります。通常の接続で WAL を送っていないものは、ここで一覧から外れます。

### 2. 送信の状態と遅れを並べる

送信の位置と、遅れの時間を、そのまま列として並べます。

```sql:line-numbers=977
            S.backend_xmin,
            W.state,
            W.sent_lsn,
            W.write_lsn,
            W.flush_lsn,
            W.replay_lsn,
            W.write_lag,
            W.flush_lag,
            W.replay_lag,
            W.sync_priority,
            W.sync_state,
            W.reply_time
```

`sent_lsn`、`write_lsn`、`flush_lsn`、`replay_lsn` の 4 つは、送った位置、書き込んだ位置、ディスクに書いた位置、反映した位置です。送信から反映までの段階ごとに、どこで遅れているかが分かります。

### 3. ユーザー名を LEFT JOIN で付ける

最後に、接続のユーザーの名前を付けます。ユーザーが無い場合も行は残すため、`LEFT JOIN` を使います。

```sql:line-numbers=991
        LEFT JOIN pg_authid AS U ON (S.usesysid = U.oid);
```

## ここがすごい

- **`JOIN` で対象を絞る**: 「WAL を送っている接続」だけを残すために、結合そのものを条件として使っています。
- **遅れを段階で分けて見せる**: 1 つの遅れの数字ではなく、段階ごとの位置を並べることで、どこが遅いのかが分かります。
- **結合の種類を使い分ける**: 送信の条件には `JOIN`、ユーザー名の補足には `LEFT JOIN` と、役割によって使い分けています。
- **トレードオフ**: 送信の情報は、サーバーの統計として読まれるため、読んだ時点の値です。遅れの時間は、刻々と変わります。

## まとめ

- 「送信中のもの」だけを残すなら、対象の条件を `JOIN` で表せる。
- 段階ごとの位置を並べると、遅れの原因が分かりやすい。
- 補足の情報は `LEFT JOIN` で付けると、欠けを防げる。
