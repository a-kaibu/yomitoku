---
title: "物理スロットを除いて、スロットごとの統計を LATERAL で呼ぶ"
description: "pg_stat_replication_slots は、論理レプリケーションのスロットごとの統計（書き出し、ストリーミングなど）を一覧するビュー。スロットの一覧を LATERAL で関数に渡し、物理スロットを除く。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1130, 1146]
function: "pg_stat_replication_slots"
difficulty: 3
tags: [並行処理, 標準ライブラリ]
format: 2
---

## ひとことで

`pg_stat_replication_slots` は、論理レプリケーションのスロットごとに、変更の書き出しやストリーミングの量を数えたビューです。スロットの名前を、関数の引数として 1 つずつ渡すために、`LATERAL` を使っています。

## コード

```sql:line-numbers=1130
CREATE VIEW pg_stat_replication_slots AS
    SELECT
            s.slot_name,
            s.spill_txns,
            s.spill_count,
            s.spill_bytes,
            s.stream_txns,
            s.stream_count,
            s.stream_bytes,
            s.mem_exceeded_count,
            s.total_txns,
            s.total_bytes,
            s.slotsync_skip_count,
            s.slotsync_last_skip,
            s.stats_reset
    FROM pg_replication_slots as r,
        LATERAL pg_stat_get_replication_slot(slot_name) as s
```

## 前提知識

- **論理レプリケーションのスロット**: 変更を、論理的な形で送るために、どこまで送ったかを保存するスロット。
- **spill（書き出し）**: メモリに収まらない大きな変更を、ディスクに一時的に書き出すこと。
- **stream（ストリーミング）**: 大きな変更を、トランザクションの完了を待たずに少しずつ送ること。
- **`LATERAL`**: 副問い合わせや関数が、左の表の行の列を引数に使える書き方。
- **物理スロット**: 論理レプリケーションに使われない、WAL の受け渡し用のスロット。

## 何をしているか

### 1. スロットの一覧を、関数の引数として使う

`pg_replication_slots` の各行の `slot_name` を、関数 `pg_stat_get_replication_slot()` の引数に渡します。`LATERAL` があるので、行ごとに関数が呼ばれます。

```sql:line-numbers=1131
    SELECT
            s.slot_name,
            s.spill_txns,
            s.spill_count,
            s.spill_bytes,
            s.stream_txns,
            s.stream_count,
            s.stream_bytes,
            s.mem_exceeded_count,
            s.total_txns,
            s.total_bytes,
            s.slotsync_skip_count,
            s.slotsync_last_skip,
            s.stats_reset
    FROM pg_replication_slots as r,
        LATERAL pg_stat_get_replication_slot(slot_name) as s
```

関数が返す統計は、書き出しの回数（`spill_count`）や、ストリーミングの回数（`stream_count`）などです。

### 2. 物理スロットを外す

最後の `WHERE` では、`datoid` が `NULL` でない行だけを残し、物理スロットを一覧から外しています。物理スロットには、論理的な変更の統計が無いからです。

## ここがすごい

- **行ごとの関数呼び出しを、1 つの `SELECT` で書く**: スロットの数だけ関数を呼ぶ処理を、`LATERAL` で簡潔に表せます。
- **統計の対象を、条件で正しく絞る**: 統計の無いスロットを、`datoid` の有無という既存の情報で判定しています。
- **書き出しとストリーミングを分けて見せる**: どちらが多く発生しているかで、メモリの設定の見直しなどの判断ができます。
- **トレードオフ**: `LATERAL` の関数は、スロットごとに呼ばれるので、スロットの数が多いと時間がかかります。

## まとめ

- 一覧の各行の値を関数に渡すときは、`LATERAL` で書くと簡潔になる。
- 対象外の行は、既存の列の有無で条件を付けて外せる。
- 統計の種類を分けて見せると、原因に応じた対策がとりやすい。
