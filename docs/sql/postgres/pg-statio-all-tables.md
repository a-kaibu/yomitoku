---
title: "テーブルの読み取りブロックをキャッシュの差で求める"
description: "pg_statio_all_tables は、テーブル、TOAST、インデックスの読み取りブロック数とキャッシュヒット数を一覧するビュー。インデックスの数は LATERAL で一度に合計する。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [816, 831]
function: "pg_statio_all_tables"
difficulty: 3
tags: [最適化, キャッシュ]
format: 2
---

## ひとことで

`pg_statio_all_tables` は、テーブルがディスクからどれだけ読まれたか（I/O の統計）を一覧するビューです。読み取りの数はキャッシュから引いた差で求め、インデックスの分は `LATERAL` の副問い合わせで合計しています。

## コード

```sql:line-numbers=816
CREATE VIEW pg_statio_all_tables AS
    SELECT
            C.oid AS relid,
            N.nspname AS schemaname,
            C.relname AS relname,
            pg_stat_get_blocks_fetched(C.oid) -
                    pg_stat_get_blocks_hit(C.oid) AS heap_blks_read,
            pg_stat_get_blocks_hit(C.oid) AS heap_blks_hit,
            I.idx_blks_read AS idx_blks_read,
            I.idx_blks_hit AS idx_blks_hit,
            pg_stat_get_blocks_fetched(T.oid) -
                    pg_stat_get_blocks_hit(T.oid) AS toast_blks_read,
            pg_stat_get_blocks_hit(T.oid) AS toast_blks_hit,
            X.idx_blks_read AS tidx_blks_read,
            X.idx_blks_hit AS tidx_blks_hit,
            pg_stat_get_stat_reset_time(C.oid) AS stats_reset
```

## 前提知識

- **ブロック**: PostgreSQL がデータを読み書きする単位（通常 8KB）。
- **TOAST**: 大きな値を別の裏の表に分けて保存する仕組み。テーブルごとに TOAST 用の表がある。
- **`reltoastrelid`**: テーブルの TOAST 用の表の番号を持つ列。
- **`LATERAL`**: FROM の中の副問い合わせが、左側の表の列を参照できる書き方。
- **`ON true`**: 条件が常に真であることを表す。`LEFT JOIN` と組み合わせて、副問い合わせの結果を必ず残すときに使う。

## 何をしているか

### 1. テーブル本体のブロック数を差で求める

`fetched`（読もうとした数）から `hit`（キャッシュで見つかった数）を引いて、ディスクから読んだ数とします。

```sql:line-numbers=821
            pg_stat_get_blocks_fetched(C.oid) -
                    pg_stat_get_blocks_hit(C.oid) AS heap_blks_read,
            pg_stat_get_blocks_hit(C.oid) AS heap_blks_hit,
```

この方法は、読み取りの回数を直接数えるより、ほかの統計を引くだけで済みます。`pg_stat_database` の `blks_read` と同じ考え方です。

### 2. TOAST とインデックスも、同じ形で求める

TOAST 用の表（`T`）も、同じように差を取ります。インデックスの分は、`LATERAL` の副問い合わせで、テーブルの全インデックスを合計します。

```sql:line-numbers=824
            I.idx_blks_read AS idx_blks_read,
            I.idx_blks_hit AS idx_blks_hit,
            pg_stat_get_blocks_fetched(T.oid) -
                    pg_stat_get_blocks_hit(T.oid) AS toast_blks_read,
            pg_stat_get_blocks_hit(T.oid) AS toast_blks_hit,
            X.idx_blks_read AS tidx_blks_read,
            X.idx_blks_hit AS tidx_blks_hit,
            pg_stat_get_stat_reset_time(C.oid) AS stats_reset
```

### 3. インデックスの合計を LATERAL で取る

インデックスの合計は、テーブルの行ごとに、対象のインデックスを探して `sum` します。

```sql:line-numbers=835
            LEFT JOIN LATERAL (
              SELECT sum(pg_stat_get_idx_blocks_fetched(indexrelid) -
                         pg_stat_get_idx_blocks_hit(indexrelid))::bigint
                     AS idx_blks_read,
                     sum(pg_stat_get_idx_blocks_hit(indexrelid))::bigint
                     AS idx_blks_hit
              FROM pg_index WHERE indrelid = C.oid ) I ON true
```

同じ形の副問い合わせを、TOAST 用の表に対しても書いています。

```sql:line-numbers=842
            LEFT JOIN LATERAL (
              SELECT sum(pg_stat_get_idx_blocks_fetched(indexrelid) -
                         pg_stat_get_idx_blocks_hit(indexrelid))::bigint
                     AS idx_blks_read,
                     sum(pg_stat_get_idx_blocks_hit(indexrelid))::bigint
                     AS idx_blks_hit
              FROM pg_index WHERE indrelid = T.oid ) X ON true
```

最後に、テーブル系の種類だけを残します。

```sql:line-numbers=849
    WHERE C.relkind IN ('r', 't', 'm');
```

## ここがすごい

- **差で直接測れないものを求める**: ディスクの読み取りを数えずに、統計の引き算で表しています。
- **副問い合わせを行ごとに使う**: `LATERAL` で、テーブルごとに異なるインデックスの合計を、1 つの `SELECT` の中で求めています。
- **`ON true` で行を残す**: インデックスの無いテーブルも、合計が `NULL` になって残ります。
- **トレードオフ**: 副問い合わせが 2 つに分かれ、同じような式が繰り返されます。読むときは、テーブル本体、TOAST、インデックスの 3 つの部分を分けて考えるとよいです。

## まとめ

- 直接測れない読み取りの数は、統計の差で近似できる。
- 行ごとに違う合計は、`LATERAL` の副問い合わせで表せる。
- `ON true` と `LEFT JOIN` を組み合わせると、対応する行が無くても全体が残る。
