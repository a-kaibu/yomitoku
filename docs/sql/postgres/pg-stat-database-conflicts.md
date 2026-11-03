---
title: "データベースを起点に競合の回数を並べる"
description: "pg_stat_database_conflicts は、データベースごとに複製先での競合の回数を一覧するビュー。統計の関数の結果ではなく、pg_database を起点にして全データベースを必ず並べる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1191, 1202]
function: "pg_stat_database_conflicts"
difficulty: 1
tags: [並行処理, API設計]
format: 2
---

## ひとことで

`pg_stat_database_conflicts` は、複製先のサーバーで、クエリが変更の反映と衝突した回数を、データベースごとに一覧するビューです。競合の種類（表の領域、ロック、スナップショットなど）ごとに、回数を分けて見せます。

## コード

```sql:line-numbers=1191
CREATE VIEW pg_stat_database_conflicts AS
    SELECT
            D.oid AS datid,
            D.datname AS datname,
            pg_stat_get_db_conflict_tablespace(D.oid) AS confl_tablespace,
            pg_stat_get_db_conflict_lock(D.oid) AS confl_lock,
            pg_stat_get_db_conflict_snapshot(D.oid) AS confl_snapshot,
            pg_stat_get_db_conflict_bufferpin(D.oid) AS confl_bufferpin,
            pg_stat_get_db_conflict_startup_deadlock(D.oid) AS confl_deadlock,
            pg_stat_get_db_conflict_logicalslot(D.oid) AS confl_active_logicalslot,
            pg_stat_get_db_stat_reset_time(D.oid) AS stats_reset
    FROM pg_database D;
```

## 前提知識

- **レプリケーションの競合**: 複製先で読み取りのクエリを実行しているとき、変更の反映がそのクエリとぶつかること。
- **スナップショット**: クエリが読む時点のデータの見え方。
- **`pg_database`**: データベースの一覧を持つ内部テーブル。
- **統計の関数**: `pg_stat_get_db_...()` のように、データベースの番号を渡すと統計の値を返す関数。
- **`AS` による別名**: 列の名前を、分かりやすい名前に付け替えること。

## 何をしているか

### 1. データベースの一覧を起点にする

このビューは、`pg_database` をそのまま `FROM` に置いています。統計の表ではなく、データベースの一覧から出発します。

```sql:line-numbers=1193
            D.oid AS datid,
            D.datname AS datname,
```

そのため、競合の記録が 1 回も無いデータベースも、回数 0 の行として一覧に残ります。

### 2. 競合の種類ごとに回数を取る

それぞれの競合の回数は、種類ごとの統計の関数で取り出します。

```sql:line-numbers=1195
            pg_stat_get_db_conflict_tablespace(D.oid) AS confl_tablespace,
            pg_stat_get_db_conflict_lock(D.oid) AS confl_lock,
            pg_stat_get_db_conflict_snapshot(D.oid) AS confl_snapshot,
            pg_stat_get_db_conflict_bufferpin(D.oid) AS confl_bufferpin,
            pg_stat_get_db_conflict_startup_deadlock(D.oid) AS confl_deadlock,
            pg_stat_get_db_conflict_logicalslot(D.oid) AS confl_active_logicalslot,
```

`confl_tablespace` は表領域、`confl_lock` はロック、`confl_snapshot` はスナップショット、`confl_bufferpin` はバッファの固定、`confl_deadlock` は起動時のデッドロックに関する競合です。どの種類で止まったかが、回数で分かります。

### 3. 統計のリセット時刻を付ける

最後に、統計がいつリセットされたかを付けます。

```sql:line-numbers=1201
            pg_stat_get_db_stat_reset_time(D.oid) AS stats_reset
    FROM pg_database D;
```

リセットの時刻が分かると、回数が「いつからの積み重ね」かが読めます。

## ここがすごい

- **起点の表で行の欠けを防ぐ**: 統計の関数から始めると、記録の無いデータベースが消えてしまいます。起点を `pg_database` にすることで、一覧が完全になります。
- **種類ごとに分けて見せる**: 1 つの合計ではなく、競合の種類ごとの列にすることで、対策の方向が分かります。
- **同じ形の関数を並べる**: 統計の関数を一定の形で並べているので、新しい種類が増えても、列を足すだけで済みます。
- **トレードオフ**: 競合の回数は、統計のリセットがない限り増え続けます。前回からの差を見るには、外側で時刻を管理する必要があります。

## まとめ

- 「全部のデータベースを必ず出す」なら、統計ではなく一覧の表を起点にする。
- 原因の種類ごとに列を分けると、対策が立てやすい。
- 統計は、リセット時刻と合わせて読むと意味がはっきりする。
