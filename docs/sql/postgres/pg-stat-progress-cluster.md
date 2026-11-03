---
title: "CLUSTER と REPACK の進み具合を読む pg_stat_progress_cluster"
description: "PostgreSQL の pg_stat_progress_cluster ビュー。pg_stat_progress_repack の結果を、命令の名前と列の名前に合わせて並べ直す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1399, 1416]
function: "pg_stat_progress_cluster"
difficulty: 3
tags: [状態機械, 並行処理]
format: 2
---

## ひとことで

`pg_stat_progress_cluster` は、テーブルを並べ替えて作り直す処理の進み具合を見せるビューです。以前の名前は `CLUSTER` ですが、今の PostgreSQL では `REPACK` という同じ仕組みの処理が見せられています。このビューは、その結果を古い名前の列に合わせて返します。

## コード

```sql:line-numbers=1399
CREATE VIEW pg_stat_progress_cluster AS
    SELECT
        pid,
        datid,
        datname,
        relid,
        CASE WHEN command IN ('CLUSTER', 'VACUUM FULL') THEN command
             WHEN command = 'REPACK' AND repack_index_relid = 0 THEN 'VACUUM FULL'
             WHEN command = 'REPACK' THEN 'CLUSTER'
             END AS command,
        phase,
        repack_index_relid AS cluster_index_relid,
        heap_tuples_scanned,
        heap_tuples_inserted + heap_tuples_updated AS heap_tuples_written,
        heap_blks_total,
        heap_blks_scanned,
        index_rebuild_count
    FROM pg_stat_progress_repack;
```

## 前提知識

- **`CLUSTER`**: 索引の順に、テーブルの行を並べ直す命令。
- **`VACUUM FULL`**: 不要な領域を詰めて、テーブルを作り直す命令。
- **`REPACK`**: テーブルを作り直す処理の名前。この版では、進み具合を `pg_stat_progress_repack` で見せている。
- **互換のためのビュー**: 古い名前を使うアプリケーションが壊れないように残した見せ方。

## 何をしているか

### 1. 命令の名前を決める

```sql:line-numbers=1405
        CASE WHEN command IN ('CLUSTER', 'VACUUM FULL') THEN command
             WHEN command = 'REPACK' AND repack_index_relid = 0 THEN 'VACUUM FULL'
             WHEN command = 'REPACK' THEN 'CLUSTER'
             END AS command,
```

`CLUSTER` と `VACUUM FULL` は、そのまま名前を使います。`REPACK` は、索引の指定（`repack_index_relid`）が 0 なら `VACUUM FULL`、そうでなければ `CLUSTER` として表します。

### 2. 書き込んだ行数を足す

```sql:line-numbers=1412
        heap_tuples_inserted + heap_tuples_updated AS heap_tuples_written,
```

挿入された行と更新された行の数を足して、書き込んだ行の数として 1 つの列にまとめています。

## ここがすごい

- **元の処理を読み替える**: 新しい名前の結果を、古い利用者が分かる言葉に変えています。
- **複数の列を 1 つにまとめる**: 挿入と更新を足すことで、利用者は書き込みの総数を 1 つの数で見られます。
- **指定の有無で意味を変える**: 同じ `REPACK` でも、索引の指定の有無で表示を分けています。

## まとめ

- 新しい名前の結果は、`CASE` で古い名前に読み替えられる。
- 関連する数値は、`+` で足して 1 つの列にまとめられる。
- 互換のためのビューは、内部の変化を利用者から隠す役目を持つ。
