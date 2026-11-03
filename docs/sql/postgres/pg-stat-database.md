---
title: "ディスク読み込み数を引き算で求める統計ビュー"
description: "データベースごとの累計統計を一覧するビュー。ディスク読み込み数（blks_read）を、取得数からキャッシュヒット数を引いて求めている。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1149, 1170]
function: "pg_stat_database"
difficulty: 2
tags: [最適化, キャッシュ]
format: 2
---

## ひとことで

`pg_stat_database` は、データベースごとの累計の統計（コミット数、一時ファイル数、デッドロック数など）を一覧するビューです。`blks_read`（ディスクから読んだブロック数）は直接数えず、「読もうとした数」から「キャッシュで見つかった数」を引いて求めています。

## コード

```sql:line-numbers=1149
CREATE VIEW pg_stat_database AS
    SELECT
            D.oid AS datid,
            D.datname AS datname,
                CASE
                    WHEN (D.oid = (0)::oid) THEN 0
                    ELSE pg_stat_get_db_numbackends(D.oid)
                END AS numbackends,
            pg_stat_get_db_xact_commit(D.oid) AS xact_commit,
            pg_stat_get_db_xact_rollback(D.oid) AS xact_rollback,
            pg_stat_get_db_blocks_fetched(D.oid) -
                    pg_stat_get_db_blocks_hit(D.oid) AS blks_read,
            pg_stat_get_db_blocks_hit(D.oid) AS blks_hit,
            pg_stat_get_db_tuples_returned(D.oid) AS tup_returned,
            pg_stat_get_db_tuples_fetched(D.oid) AS tup_fetched,
            pg_stat_get_db_tuples_inserted(D.oid) AS tup_inserted,
            pg_stat_get_db_tuples_updated(D.oid) AS tup_updated,
            pg_stat_get_db_tuples_deleted(D.oid) AS tup_deleted,
            pg_stat_get_db_conflict_all(D.oid) AS conflicts,
            pg_stat_get_db_temp_files(D.oid) AS temp_files,
            pg_stat_get_db_temp_bytes(D.oid) AS temp_bytes,
            pg_stat_get_db_deadlocks(D.oid) AS deadlocks,
```

## 前提知識

- **ブロック**: PostgreSQL がデータを読み書きする単位となる大きさの区切り（通常 8KB）。
- **共有バッファ**: メモリ上にブロックを置いておくキャッシュ。ここに無ければディスクから読む。
- **`oid` の `0`**: データベースの一覧に出てこない特別な番号。共有カタログなど、どのデータベースにも属さないものを表す。
- **`CASE`**: 条件に合わせて値を分ける式。

## 何をしているか

### 1. データベースの名前と接続数

接続数は、`oid` が `0` の場合だけ特別に `0` を返します。

```sql:line-numbers=1151
            D.oid AS datid,
            D.datname AS datname,
                CASE
                    WHEN (D.oid = (0)::oid) THEN 0
                    ELSE pg_stat_get_db_numbackends(D.oid)
                END AS numbackends,
```

`(0)::oid` は、`0` を `oid` 型として比べるための書き方です。

### 2. ブロックの読み込み数を引き算で求める

ここが、このビューの一番おもしろい部分です。

```sql:line-numbers=1159
            pg_stat_get_db_blocks_fetched(D.oid) -
                    pg_stat_get_db_blocks_hit(D.oid) AS blks_read,
            pg_stat_get_db_blocks_hit(D.oid) AS blks_hit,
```

`pg_stat_get_db_blocks_fetched()` は、キャッシュに関係なく読もうとしたブロックの数です。`blocks_hit()` は、共有バッファで見つかった数です。両者の差は、ディスクから実際に読んだブロックの数に近い値になります。

### 3. そのほかの累計

コミットやロールバック、タプルの操作数なども、同じ形の関数で取り出しています。

```sql:line-numbers=1162
            pg_stat_get_db_tuples_returned(D.oid) AS tup_returned,
            pg_stat_get_db_tuples_fetched(D.oid) AS tup_fetched,
            pg_stat_get_db_tuples_inserted(D.oid) AS tup_inserted,
            pg_stat_get_db_tuples_updated(D.oid) AS tup_updated,
            pg_stat_get_db_tuples_deleted(D.oid) AS tup_deleted,
            pg_stat_get_db_conflict_all(D.oid) AS conflicts,
            pg_stat_get_db_temp_files(D.oid) AS temp_files,
            pg_stat_get_db_temp_bytes(D.oid) AS temp_bytes,
            pg_stat_get_db_deadlocks(D.oid) AS deadlocks,
```

## ここがすごい

- **数えられないものを、数えられるものの差で表している**: ディスクの読み込みを直接記録するより、ほかの 2 つの累計を引くほうが、内部の処理を変えずに済みます。
- **同じ形の関数を並べている**: `pg_stat_get_db_...` という関数を一定の書き方で並べるので、新しい統計を足すのが簡単です。
- **トレードオフ**: 差の値は「おおよそ」です。読み込みの方法によっては、キャッシュにない読み込みと一致しない場合があります。目安として見るのが適しています。

## まとめ

- 直接測れないものは、測れる累計の差で表すことができる。
- `oid` の `0` のような特別な値は、`CASE` で別に扱うと分かりやすい。
- 統計のビューは、同じ形の列を並べるだけで、多くの指標を簡単に増やせる。
