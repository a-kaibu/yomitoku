---
title: "索引作成の進み具合を読む pg_stat_progress_create_index"
description: "PostgreSQL の pg_stat_progress_create_index ビュー。CREATE INDEX や REINDEX の内部の数値を、コマンド名と段階の文字列に変えて見せる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1418, 1451]
function: "pg_stat_progress_create_index"
difficulty: 3
tags: [並行処理, 状態機械]
format: 2
---

## ひとことで

`pg_stat_progress_create_index` は、索引を作っている最中の進み具合を見せるビューです。内部では、数値の記録として保存されています。このビューは、その数字を「どのコマンドか」「どの段階か」を表す文字列に変えて返します。

## コード

```sql:line-numbers=1418
CREATE VIEW pg_stat_progress_create_index AS
    SELECT
        S.pid AS pid, S.datid AS datid, D.datname AS datname,
        S.relid AS relid,
        CAST(S.param7 AS oid) AS index_relid,
        CASE S.param1 WHEN 1 THEN 'CREATE INDEX'
                      WHEN 2 THEN 'CREATE INDEX CONCURRENTLY'
                      WHEN 3 THEN 'REINDEX'
                      WHEN 4 THEN 'REINDEX CONCURRENTLY'
                      END AS command,
        CASE S.param10 WHEN 0 THEN 'initializing'
                       WHEN 1 THEN 'waiting for writers before build'
                       WHEN 2 THEN 'building index' ||
                           COALESCE((': ' || pg_indexam_progress_phasename(S.param9::oid, S.param11)),
                                    '')
                       WHEN 3 THEN 'waiting for writers before validation'
                       WHEN 4 THEN 'index validation: scanning index'
                       WHEN 5 THEN 'index validation: sorting tuples'
                       WHEN 6 THEN 'index validation: scanning table'
                       WHEN 7 THEN 'waiting for old snapshots'
                       WHEN 8 THEN 'waiting for readers before marking dead'
                       WHEN 9 THEN 'waiting for readers before dropping'
                       END as phase,
        S.param4 AS lockers_total,
        S.param5 AS lockers_done,
        S.param6 AS current_locker_pid,
        S.param16 AS blocks_total,
        S.param17 AS blocks_done,
        S.param12 AS tuples_total,
        S.param13 AS tuples_done,
        S.param14 AS partitions_total,
        S.param15 AS partitions_done
    FROM pg_stat_get_progress_info('CREATE INDEX') AS S
        LEFT JOIN pg_database D ON S.datid = D.oid;
```

## 前提知識

- **`pg_stat_get_progress_info`**: 実行中の処理の進み具合を、番号付きの列（`param1` など）で返す関数。
- **`CASE ... WHEN`**: 値によって結果を変える式。どの値にも当たらないときは `NULL`。
- **`COALESCE`**: 最初に `NULL` でない値を返す関数。
- **`CONCURRENTLY`**: 書き込みを止めずに索引を作る方式。
- **状態機械**: 段階ごとに、今どの状態にいるかを数で表す考え方。

## 何をしているか

### 1. 実行中の処理を読み込む

```sql:line-numbers=1450
    FROM pg_stat_get_progress_info('CREATE INDEX') AS S
        LEFT JOIN pg_database D ON S.datid = D.oid;
```

`pg_stat_get_progress_info('CREATE INDEX')` は、`CREATE INDEX` の進み具合を数値の列として取り出します。このビューは、それを `S` という名前で使います。

### 2. コマンドの名前を決める

```sql:line-numbers=1423
        CASE S.param1 WHEN 1 THEN 'CREATE INDEX'
                      WHEN 2 THEN 'CREATE INDEX CONCURRENTLY'
                      WHEN 3 THEN 'REINDEX'
                      WHEN 4 THEN 'REINDEX CONCURRENTLY'
                      END AS command,
```

`param1` の値で、`CREATE INDEX`、`CREATE INDEX CONCURRENTLY`、`REINDEX`、`REINDEX CONCURRENTLY` を区別します。

### 3. 段階の名前を決める

```sql:line-numbers=1428
        CASE S.param10 WHEN 0 THEN 'initializing'
                       WHEN 1 THEN 'waiting for writers before build'
                       WHEN 2 THEN 'building index' ||
                           COALESCE((': ' || pg_indexam_progress_phasename(S.param9::oid, S.param11)),
                                    '')
                       WHEN 3 THEN 'waiting for writers before validation'
                       WHEN 4 THEN 'index validation: scanning index'
                       WHEN 5 THEN 'index validation: sorting tuples'
                       WHEN 6 THEN 'index validation: scanning table'
                       WHEN 7 THEN 'waiting for old snapshots'
                       WHEN 8 THEN 'waiting for readers before marking dead'
                       WHEN 9 THEN 'waiting for readers before dropping'
```

`param10` の値は、準備中、書き込み待ち、構築中などの段階を表します。構築中の段階では、索引の種類ごとの細かい段階名を `COALESCE` で後ろに付けます。

## ここがすごい

- **内部の数字を、読める言葉に変える**: 番号の意味を覚えなくても、画面の文字で状況が分かります。
- **段階を細かく分ける**: 書き込みや読み取りを待つ段階が別々に書かれているため、処理が止まっている理由を追えます。
- **`COALESCE` で任意の情報を足す**: 索引の種類によって段階の名前が違うときも、同じ列で扱えます。
- **表の名前も結合で引く**: `LEFT JOIN pg_database` で、データベースの名前を一緒に返します。

## まとめ

- 進み具合は数値で保存されるので、ビューで名前に変換して見せる。
- 段階の名前を `CASE` で並べると、状態の流れが一覧で読める。
- 任意の追加情報は `COALESCE` で後ろに付けられる。
