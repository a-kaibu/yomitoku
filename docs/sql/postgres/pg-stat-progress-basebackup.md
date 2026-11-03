---
title: "バックアップの進み具合を読む pg_stat_progress_basebackup"
description: "PostgreSQL の pg_stat_progress_basebackup ビュー。基本バックアップの段階と種類を文字に変え、不明な合計値は NULL として見せる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1453, 1470]
function: "pg_stat_progress_basebackup"
difficulty: 2
tags: [状態機械, 入出力]
format: 2
---

## ひとことで

`pg_stat_progress_basebackup` は、基本バックアップを取っている最中の進み具合を見せるビューです。今どの段階にいるか、どこまでコピーしたか、増分かどうかを、読める形で返します。

## コード

```sql:line-numbers=1453
CREATE VIEW pg_stat_progress_basebackup AS
    SELECT
        S.pid AS pid,
        CASE S.param1 WHEN 0 THEN 'initializing'
                      WHEN 1 THEN 'waiting for checkpoint to finish'
                      WHEN 2 THEN 'estimating backup size'
                      WHEN 3 THEN 'streaming database files'
                      WHEN 4 THEN 'waiting for wal archiving to finish'
                      WHEN 5 THEN 'transferring wal files'
                      END AS phase,
        CASE S.param2 WHEN -1 THEN NULL ELSE S.param2 END AS backup_total,
        S.param3 AS backup_streamed,
        S.param4 AS tablespaces_total,
        S.param5 AS tablespaces_streamed,
        CASE S.param6 WHEN 1 THEN 'full'
                      WHEN 2 THEN 'incremental'
                      END AS backup_type
    FROM pg_stat_get_progress_info('BASEBACKUP') AS S;
```

## 前提知識

- **基本バックアップ（base backup）**: データベースのファイルを、ある時点の状態でまとめて取り出すバックアップ。
- **増分バックアップ**: 前回のバックアップとの差分だけを取るバックアップ。
- **`-1` を使う数値**: 「まだ分からない」を表すために、負の値を入れる慣習。
- **`CASE ... WHEN -1 THEN NULL`**: その負の値を `NULL` に置き換える式。

## 何をしているか

### 1. 段階の名前を決める

```sql:line-numbers=1456
        CASE S.param1 WHEN 0 THEN 'initializing'
                      WHEN 1 THEN 'waiting for checkpoint to finish'
                      WHEN 2 THEN 'estimating backup size'
                      WHEN 3 THEN 'streaming database files'
                      WHEN 4 THEN 'waiting for wal archiving to finish'
                      WHEN 5 THEN 'transferring wal files'
                      END AS phase,
```

`param1` の値で、チェックポイントを待つ段階、サイズを見積もる段階、ファイルを送る段階などを区別します。

### 2. 合計が不明な値を NULL にする

```sql:line-numbers=1463
        CASE S.param2 WHEN -1 THEN NULL ELSE S.param2 END AS backup_total,
```

`param2` が `-1` のときは、まだ合計が分からないことを表すので、`NULL` にします。それ以外のときは、そのまま合計の値を返します。

### 3. 種類を文字にする

```sql:line-numbers=1467
        CASE S.param6 WHEN 1 THEN 'full'
                      WHEN 2 THEN 'incremental'
                      END AS backup_type
```

`param6` が 1 なら `full`（全体）、2 なら `incremental`（増分）です。

## ここがすごい

- **分からないことを正直に表す**: 負の値をそのまま見せず、`NULL` に変えて「不明」と読めるようにしています。
- **段階と種類を別の列にする**: 進み具合の段階と、バックアップの種類は独立した情報として分けています。
- **ファイル単位の進み具合**: 合計とコピー済みの数を並べると、残りの量が分かります。

## まとめ

- 「分からない」を表す特別な値は、`NULL` に変えて見せる。
- 段階と種類を分けると、読み手が状況を組み立てやすい。
- 合計とコピー済みの値を並べると、進み具合が数で分かる。
