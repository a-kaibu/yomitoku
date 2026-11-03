---
title: "インデックスが使われた回数を数える"
description: "pg_stat_all_indexes は、インデックスごとの使われた回数や読んだ行の数を一覧するビュー。テーブルの種類 r、t、m を条件にして、TOAST などの裏の表も含める。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [861, 877]
function: "pg_stat_all_indexes"
difficulty: 2
tags: [最適化, 標準ライブラリ]
format: 2
---

## ひとことで

`pg_stat_all_indexes` は、インデックスがどれだけ使われたかを数えた統計の一覧です。使われていないインデックスを見つけて削除する判断に使えます。テーブルと、そのテーブルのインデックスを対応づけて、読んだ行の数などを一度に見せます。

## コード

```sql:line-numbers=861
CREATE VIEW pg_stat_all_indexes AS
    SELECT
            C.oid AS relid,
            I.oid AS indexrelid,
            N.nspname AS schemaname,
            C.relname AS relname,
            I.relname AS indexrelname,
            pg_stat_get_idx_numscans(I.oid) AS idx_scan,
            pg_stat_get_idx_lastscan(I.oid) AS last_idx_scan,
            pg_stat_get_idx_tuples_returned(I.oid) AS idx_tup_read,
            pg_stat_get_idx_tuples_fetched(I.oid) AS idx_tup_fetch,
            pg_stat_get_idx_stat_reset_time(I.oid) AS stats_reset
    FROM pg_class C JOIN
            pg_index X ON C.oid = X.indrelid JOIN
            pg_class I ON I.oid = X.indexrelid
            LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
    WHERE C.relkind IN ('r', 't', 'm');
```

## 前提知識

- **インデックス**: 特定の列の値から、行を速く探すための仕組み。使われないインデックスは、書き込みを遅くするだけのことがある。
- **統計の累計**: 利用されたことを、サーバーが数え続けた値。
- **`pg_index`**: インデックスの詳細を持つ内部テーブル。`indrelid` が元のテーブル、`indexrelid` がインデックス。
- **`relkind`**: 対象の種類。`'r'` は通常のテーブル、`'t'` は TOAST（大きな値の保存用の裏の表）、`'m'` はマテリアライズドビュー。
- **`pg_stat_get_idx_numscans()`**: インデックスが検索に使われた回数を返す関数。

## 何をしているか

### 1. テーブルとインデックスを結ぶ

`pg_index` を挟んで、テーブルの `pg_class`（`C`）と、インデックスの `pg_class`（`I`）を結びます。

```sql:line-numbers=862
    SELECT
            C.oid AS relid,
            I.oid AS indexrelid,
            N.nspname AS schemaname,
            C.relname AS relname,
            I.relname AS indexrelname,
            pg_stat_get_idx_numscans(I.oid) AS idx_scan,
            pg_stat_get_idx_lastscan(I.oid) AS last_idx_scan,
            pg_stat_get_idx_tuples_returned(I.oid) AS idx_tup_read,
            pg_stat_get_idx_tuples_fetched(I.oid) AS idx_tup_fetch,
            pg_stat_get_idx_stat_reset_time(I.oid) AS stats_reset
    FROM pg_class C JOIN
            pg_index X ON C.oid = X.indrelid JOIN
            pg_class I ON I.oid = X.indexrelid
            LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
```

`X` は、両者の対応を持つ `pg_index` の行です。同じテーブルに付いた複数のインデックスが、それぞれ 1 行になります。

### 2. 利用の統計を取り出す

統計の関数を、インデックスの番号を使って呼び出します。

```sql:line-numbers=868
            pg_stat_get_idx_numscans(I.oid) AS idx_scan,
            pg_stat_get_idx_lastscan(I.oid) AS last_idx_scan,
            pg_stat_get_idx_tuples_returned(I.oid) AS idx_tup_read,
            pg_stat_get_idx_tuples_fetched(I.oid) AS idx_tup_fetch,
            pg_stat_get_idx_stat_reset_time(I.oid) AS stats_reset
```

`idx_scan` は検索に使われた回数、`idx_tup_read` は読まれた行の数、`idx_tup_fetch` はテーブル本体から取り出された行の数です。

### 3. 対象の種類を絞る

最後に、通常のテーブル、TOAST、マテリアライズドビューだけを残します。

```sql:line-numbers=877
    WHERE C.relkind IN ('r', 't', 'm');
```

`WHERE` の条件が、統計を持つ対象を絞っています。TOAST は、大きな値を別の場所に保存する裏の表です。利用者が直接作るものではないので、通常のテーブルと区別せずに一覧に含めています。

## ここがすごい

- **統計を関数の列として並べる**: 同じ形の関数を並べることで、新しい統計の列を簡単に追加できます。
- **裏の表も含めて、見落としを防ぐ**: TOAST のインデックスも、テーブルの一部として扱い、使われ方を見られます。
- **インデックスを 1 行ずつ見せる**: テーブルの単位ではなく、インデックスの単位で分けているので、どれを削除するかの判断がしやすくなります。
- **トレードオフ**: 統計は、サーバーの再起動や統計の取り直しでリセットされることがあります。一覧が、長期の利用を表すとは限りません。

## まとめ

- インデックスの使われ方は、統計の関数を結合の結果に並べると確かめられる。
- 種類の記号を条件にすると、見るべき対象だけを選べる。
- 統計は期間の影響を受けるので、判断するときは期間を意識する。
