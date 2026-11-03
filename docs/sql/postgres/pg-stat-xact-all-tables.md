---
title: "トランザクションの中だけの回数を GROUP BY で数える"
description: "pg_stat_xact_all_tables は、いま実行中のトランザクションの中で、テーブルがどう読まれどう変わったかを数える統計ビュー。インデックスの数を集計し GROUP BY でまとめる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [757, 776]
function: "pg_stat_xact_all_tables"
difficulty: 3
tags: [最適化, 並行処理]
format: 2
---

## ひとことで

`pg_stat_xact_all_tables` は、いま実行中のトランザクションの中だけで、テーブルがどれだけ読まれ、どれだけ変更されたかを数えるビューです。全期間の累計（`pg_stat_all_tables`）とは違い、トランザクションが終われば 0 に戻ります。

## コード

```sql:line-numbers=757
CREATE VIEW pg_stat_xact_all_tables AS
    SELECT
            C.oid AS relid,
            N.nspname AS schemaname,
            C.relname AS relname,
            pg_stat_get_xact_numscans(C.oid) AS seq_scan,
            pg_stat_get_xact_tuples_returned(C.oid) AS seq_tup_read,
            sum(pg_stat_get_xact_idx_numscans(I.indexrelid))::bigint AS idx_scan,
            sum(pg_stat_get_xact_idx_tuples_fetched(I.indexrelid))::bigint +
            pg_stat_get_xact_tuples_fetched(C.oid) AS idx_tup_fetch,
            pg_stat_get_xact_tuples_inserted(C.oid) AS n_tup_ins,
            pg_stat_get_xact_tuples_updated(C.oid) AS n_tup_upd,
            pg_stat_get_xact_tuples_deleted(C.oid) AS n_tup_del,
            pg_stat_get_xact_tuples_hot_updated(C.oid) AS n_tup_hot_upd,
            pg_stat_get_xact_tuples_newpage_updated(C.oid) AS n_tup_newpage_upd
    FROM pg_class C LEFT JOIN
         pg_index I ON C.oid = I.indrelid
         LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
    WHERE C.relkind IN ('r', 't', 'm', 'p')
    GROUP BY C.oid, N.nspname, C.relname;
```

## 前提知識

- **トランザクション**: まとめて成功するか、まとめて取り消されるかの一単位。
- **`xact`**: この接頭辞の付いた統計は、現在のトランザクションの中の数字を表す。
- **`GROUP BY`**: 同じ値の行をまとめて、集計関数を使う指定。
- **`sum()`**: 値の合計を求める集計関数。
- **`LEFT JOIN`**: 左の行を残す結合。インデックスの無いテーブルも残す。

## 何をしているか

### 1. テーブルごとの統計を関数で取る

テーブルの番号を使って、トランザクションの中の読み取りや変更の回数を、関数の結果として取ります。

```sql:line-numbers=758
    SELECT
            C.oid AS relid,
            N.nspname AS schemaname,
            C.relname AS relname,
            pg_stat_get_xact_numscans(C.oid) AS seq_scan,
```

`n_tup_ins`、`n_tup_upd`、`n_tup_del` は、挿入、更新、削除された行の数です。`n_tup_hot_upd` は、ページの中で移動せずに更新された行の数を表します。

### 2. インデックスの読み取りを合計する

テーブルに付いたインデックスの数を、`pg_index` を `LEFT JOIN` して、行ごとに増やします。そのうえで、`sum()` で合計します。

```sql:line-numbers=763
            pg_stat_get_xact_tuples_returned(C.oid) AS seq_tup_read,
            sum(pg_stat_get_xact_idx_numscans(I.indexrelid))::bigint AS idx_scan,
            sum(pg_stat_get_xact_idx_tuples_fetched(I.indexrelid))::bigint +
            pg_stat_get_xact_tuples_fetched(C.oid) AS idx_tup_fetch,
            pg_stat_get_xact_tuples_inserted(C.oid) AS n_tup_ins,
            pg_stat_get_xact_tuples_updated(C.oid) AS n_tup_upd,
            pg_stat_get_xact_tuples_deleted(C.oid) AS n_tup_del,
            pg_stat_get_xact_tuples_hot_updated(C.oid) AS n_tup_hot_upd,
            pg_stat_get_xact_tuples_newpage_updated(C.oid) AS n_tup_newpage_upd
```

`sum(...)::bigint` の `::` は、合計を `bigint` に変えます。インデックスの無いテーブルは、結合で 1 行だけ残り、合計は `NULL` になります。

### 3. テーブルの単位にまとめる

インデックスは、テーブルごとに複数の行になるので、最後に `GROUP BY` で 1 テーブル 1 行にまとめます。

```sql:line-numbers=772
    FROM pg_class C LEFT JOIN
         pg_index I ON C.oid = I.indrelid
         LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
    WHERE C.relkind IN ('r', 't', 'm', 'p')
    GROUP BY C.oid, N.nspname, C.relname;
```

## ここがすごい

- **集計と統計の関数を組み合わせる**: 行ごとの値を、テーブル単位で合計できるように、結合と集計を使い分けています。
- **トランザクションの中だけの数字**: 長時間のトランザクションの影響を、全期間の累計と分けて見られます。
- **`GROUP BY` に必要な列を並べる**: 集計の結果を 1 行にするため、テーブルを特定する列をすべて並べています。
- **トレードオフ**: 集計のために、テーブルの行数とインデックスの数の積の分だけ行を作ります。テーブルとインデックスの多いデータベースでは、計算に時間がかかることがあります。

## まとめ

- 行ごとの値を 1 つの行にまとめるときは、`LEFT JOIN` と `GROUP BY` を組み合わせる。
- 集計の結果は、キャストで型をそろえると扱いやすい。
- 「トランザクションの中だけ」の統計は、長い処理の影響を調べるのに役立つ。
