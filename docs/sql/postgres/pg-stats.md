---
title: "統計の種類番号で列を振り分ける pg_stats"
description: "ANALYZE が集めた統計を読みやすくするビュー。5 つの枠に入る統計を種類番号（1 は最頻値、2 はヒストグラム）で見分け、CASE で列ごとに取り出している。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [190, 214]
function: "pg_stats"
difficulty: 3
tags: [データ構造, 最適化]
format: 2
---

## ひとことで

`pg_stats` は、`ANALYZE` が集めた列の統計（値の分布や相関など）を一覧するビューです。内部では、統計の種類ごとの値が 5 つの枠に詰め込まれて保存されています。このビューは、種類の番号を見て、どの枠の値を取り出すかを決めています。

## コード

```sql:line-numbers=190
CREATE VIEW pg_stats WITH (security_barrier) AS
    SELECT
        nspname AS schemaname,
        relname AS tablename,
        attrelid AS tableid,
        attname AS attname,
        attnum,
        stainherit AS inherited,
        stanullfrac AS null_frac,
        stawidth AS avg_width,
        stadistinct AS n_distinct,
        CASE
            WHEN stakind1 = 1 THEN stavalues1
            WHEN stakind2 = 1 THEN stavalues2
            WHEN stakind3 = 1 THEN stavalues3
            WHEN stakind4 = 1 THEN stavalues4
            WHEN stakind5 = 1 THEN stavalues5
        END AS most_common_vals,
        CASE
            WHEN stakind1 = 1 THEN stanumbers1
            WHEN stakind2 = 1 THEN stanumbers2
            WHEN stakind3 = 1 THEN stanumbers3
            WHEN stakind4 = 1 THEN stanumbers4
            WHEN stakind5 = 1 THEN stanumbers5
        END AS most_common_freqs,
```

## 前提知識

- **`ANALYZE`**: テーブルの中身を調べて、クエリの計画に使う統計を集めるコマンド。
- **統計の種類番号**: 1 は最頻値（よく出る値）、2 はヒストグラムの境界、3 は物理的な並びとの相関、4 は配列の要素の頻度を表す。
- **配列**: 同じ型の値を並べたもの。`stanumbers1[1]` のように、添字（1 から始まる番号）で 1 つ取り出せる。
- **`CASE`**: 条件を上から順に調べ、最初に当たったものを返す。

## 何をしているか

### 1. 列の基本情報を取る

まず、列の名前や平均の幅などは、そのまま見せます。

```sql:line-numbers=190
CREATE VIEW pg_stats WITH (security_barrier) AS
    SELECT
        nspname AS schemaname,
        relname AS tablename,
        attrelid AS tableid,
        attname AS attname,
        attnum,
        stainherit AS inherited,
        stanullfrac AS null_frac,
        stawidth AS avg_width,
        stadistinct AS n_distinct,
```

### 2. 種類番号が 1 の枠を最頻値として取り出す

統計の 5 つの枠のどれかに「種類 1」が入っていれば、その枠の値を `most_common_vals` として返します。

```sql:line-numbers=201
        CASE
            WHEN stakind1 = 1 THEN stavalues1
            WHEN stakind2 = 1 THEN stavalues2
            WHEN stakind3 = 1 THEN stavalues3
            WHEN stakind4 = 1 THEN stavalues4
            WHEN stakind5 = 1 THEN stavalues5
        END AS most_common_vals,
```

`CASE` は上から順に調べるので、最初に `stakind1 = 1` が当たればその値を、違えば `stakind2` の確認へ進みます。同じ種類の統計は 1 つしか入らない前提なので、この書き方で十分です。

### 3. 種類番号が 2 の枠をヒストグラムとして取り出す

同じ形で、種類 2 のものを `histogram_bounds` として返します。

```sql:line-numbers=215
        CASE
            WHEN stakind1 = 2 THEN stavalues1
            WHEN stakind2 = 2 THEN stavalues2
            WHEN stakind3 = 2 THEN stavalues3
            WHEN stakind4 = 2 THEN stavalues4
            WHEN stakind5 = 2 THEN stavalues5
        END AS histogram_bounds,
```

## ここがすごい

- **保存の仕方と見せ方を分けている**: 5 つの固定の枠に統計を詰めるのは、保存の効率のためです。ビューがそれを、列ごとの意味がはっきりした形に戻しています。
- **同じ `CASE` の繰り返しで読める**: 種類ごとに同じ形をそろえているので、どれか 1 つを理解すれば、ほかも読めます。
- **トレードオフ**: 枠の数は決まっているため、統計の種類が増えると、枠の数やビューの書き方も見直す必要があります。

## まとめ

- 固定の枠に入れた値は、種類の番号で振り分けると取り出せる。
- `CASE` は「最初に当たったもの」を返すので、枠を順に調べる書き方に向いている。
- 統計の保存と、利用者向けの見せ方は分けて考えると、内部の設計が読みやすくなる。
