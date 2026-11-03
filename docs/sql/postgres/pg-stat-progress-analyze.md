---
title: "ANALYZE の進み具合を読む pg_stat_progress_analyze"
description: "PostgreSQL の pg_stat_progress_analyze ビュー。統計情報の収集の段階を文字に変え、どの契機で始まったかを手動か自動かで示す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1307, 1330]
function: "pg_stat_progress_analyze"
difficulty: 3
tags: [状態機械, 並行処理]
format: 2
---

## ひとことで

`pg_stat_progress_analyze` は、`ANALYZE` が統計情報を集めている途中の様子を見せるビューです。今どの段階にいるか、サンプルの行をどれだけ読んだか、誰が始めたかを、読める形にまとめます。

## コード

```sql:line-numbers=1307
CREATE VIEW pg_stat_progress_analyze AS
    SELECT
        S.pid AS pid, S.datid AS datid, D.datname AS datname,
        CAST(S.relid AS oid) AS relid,
        CASE S.param1 WHEN 0 THEN 'initializing'
                      WHEN 1 THEN 'acquiring sample rows'
                      WHEN 2 THEN 'acquiring inherited sample rows'
                      WHEN 3 THEN 'computing statistics'
                      WHEN 4 THEN 'computing extended statistics'
                      WHEN 5 THEN 'finalizing analyze'
                      END AS phase,
        S.param2 AS sample_blks_total,
        S.param3 AS sample_blks_scanned,
        S.param4 AS ext_stats_total,
        S.param5 AS ext_stats_computed,
        S.param6 AS child_tables_total,
        S.param7 AS child_tables_done,
        CAST(S.param8 AS oid) AS current_child_table_relid,
        S.param9 / 1000000::double precision AS delay_time,
        CASE S.param10 WHEN 1 THEN 'manual'
                       WHEN 2 THEN 'autovacuum'
                       ELSE NULL END AS started_by
    FROM pg_stat_get_progress_info('ANALYZE') AS S
        LEFT JOIN pg_database D ON S.datid = D.oid;
```

## 前提知識

- **`ANALYZE`**: 表の中身を調べて、プランナーが使う統計情報を作る処理。
- **サンプル行**: 全部を読まずに、一部の行だけを選んで統計を作るための行の集まり。
- **autovacuum**: 必要なときに、PostgreSQL が自動で `VACUUM` や `ANALYZE` を実行する仕組み。
- **`ELSE NULL`**: どの値にも当たらないときに `NULL` を返す指定。

## 何をしているか

### 1. 段階の名前を決める

```sql:line-numbers=1311
        CASE S.param1 WHEN 0 THEN 'initializing'
                      WHEN 1 THEN 'acquiring sample rows'
                      WHEN 2 THEN 'acquiring inherited sample rows'
                      WHEN 3 THEN 'computing statistics'
                      WHEN 4 THEN 'computing extended statistics'
                      WHEN 5 THEN 'finalizing analyze'
                      END AS phase,
```

`param1` の値で、サンプルを集めている段階、統計を計算している段階などを区別します。

### 2. 開始の理由を決める

```sql:line-numbers=1326
        CASE S.param10 WHEN 1 THEN 'manual'
                       WHEN 2 THEN 'autovacuum'
                       ELSE NULL END AS started_by
```

`param10` が 1 なら手動、2 なら autovacuum による実行です。どちらでもないときは `ELSE NULL` で `NULL` を返します。

### 3. 待ち時間を秒にそろえる

```sql:line-numbers=1325
        S.param9 / 1000000::double precision AS delay_time,
```

`param9` を 1000000 で割り、`double precision` の値にして返しています。元の値の単位を変えて、読みやすくするための計算です。

## ここがすごい

- **段階を文字で表す**: 番号と段階の対応を `CASE` にまとめ、途中の状態を追いやすくしています。
- **開始の理由を別の列にする**: 手動か自動かが分かると、負荷の原因を考えやすくなります。
- **未知の値を `NULL` にする**: 対応しない値が来ても、誤った名前を見せずに済みます。

## まとめ

- 数値の段階は `CASE` で文字に変えて見せる。
- 開始の理由のような付加情報も、別の列として持たせる。
- 単位の違う値は、ビューの中で割って読みやすくする。
