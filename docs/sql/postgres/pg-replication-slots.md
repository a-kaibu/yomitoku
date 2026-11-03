---
title: "物理スロットを LEFT JOIN で残すレプリケーション一覧"
description: "pg_replication_slots のビュー。スロットに紐づくデータベース名を LEFT JOIN で付ける。データベースを持たない物理スロットも、NULL として一覧に残す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1103, 1128]
function: "pg_replication_slots"
difficulty: 2
tags: [API設計, 並行処理]
format: 2
---

## ひとことで

`pg_replication_slots` は、レプリケーションのスロットを一覧するビューです。スロットは、待機している複製先がどこまで WAL（先行書き込みログ）を読んだかを覚えておく仕組みです。データベースに結びつくものと、結びつかないもの（物理スロット）の両方があるため、結合の種類に注意がいります。

## コード

```sql:line-numbers=1103
CREATE VIEW pg_replication_slots AS
    SELECT
            L.slot_name,
            L.plugin,
            L.slot_type,
            L.datoid,
            D.datname AS database,
            L.temporary,
            L.active,
            L.active_pid,
            L.xmin,
            L.catalog_xmin,
            L.restart_lsn,
            L.confirmed_flush_lsn,
            L.wal_status,
            L.safe_wal_size,
            L.two_phase,
            L.two_phase_at,
            L.inactive_since,
            L.conflicting,
            L.invalidation_reason,
            L.failover,
            L.synced,
            L.slotsync_skip_reason
    FROM pg_get_replication_slots() AS L
            LEFT JOIN pg_database D ON (L.datoid = D.oid);
```

## 前提知識

- **レプリケーション**: 別のサーバーに、データの変更を送って同じ内容を保つ仕組み。
- **スロット（replication slot）**: 複製先が、どこまでデータを受け取ったかを保存しておく仕組み。受け取っていないログを消さないようにする。
- **WAL**: 変更内容を先に書き残すログ。ディスクに残る形で、データの復旧や複製に使われる。
- **物理スロット**: 特定のデータベースに属さないスロット。`datoid` が `0` になる。
- **`LEFT JOIN`**: 左の行を残し、一致しなければ右の列を `NULL` にする結合。

## 何をしているか

### 1. 内部の関数からスロットの状態を取り出す

`pg_get_replication_slots()` は、スロットの名前、状態、WAL の位置などを返します。ほとんどの列は、そのまま見せるだけです。

```sql:line-numbers=1104
    SELECT
            L.slot_name,
            L.plugin,
            L.slot_type,
            L.datoid,
            D.datname AS database,
            L.temporary,
            L.active,
            L.active_pid,
            L.xmin,
            L.catalog_xmin,
            L.restart_lsn,
            L.confirmed_flush_lsn,
            L.wal_status,
            L.safe_wal_size,
            L.two_phase,
            L.two_phase_at,
            L.inactive_since,
            L.conflicting,
            L.invalidation_reason,
            L.failover,
            L.synced,
            L.slotsync_skip_reason
```

`restart_lsn` や `confirmed_flush_lsn` は、どこまでの WAL を保存しておく必要があるかを示す位置です。

### 2. データベース名を LEFT JOIN で付ける

`datoid` からデータベース名を引きます。物理スロットは、データベースに属さないので、`datoid` が `0` になります。

```sql:line-numbers=1127
    FROM pg_get_replication_slots() AS L
            LEFT JOIN pg_database D ON (L.datoid = D.oid);
```

`LEFT JOIN` にしているので、物理スロットの行も残ります。その場合、`database` は `NULL` になります。

## ここがすごい

- **「無い」を `NULL` で正直に表す**: 物理スロットには、データベース名がありません。それを無理に埋めず、`NULL` として残しています。
- **`INNER JOIN` を避けた判断**: `INNER JOIN` にすると、物理スロットが一覧から消えてしまい、その状態が見えなくなります。スロットは、消えていても WAL を残し続けることがあるので、見えなくては困ります。
- **状態の列を多く見せる**: 安全に WAL を消せるかどうかを、利用者が判断するための列が揃っています。
- **トレードオフ**: 行が多くなりやすいので、スロットの数が多いときは、必要な列だけを選んで読む必要があります。

## まとめ

- 「データベースに属さないもの」がある場合は、`LEFT JOIN` で残すのが正しい。
- `NULL` は、「存在しない」ことを正直に表す値として使える。
- 運用に関わる状態は、消えないように一覧に残すことが大切。
