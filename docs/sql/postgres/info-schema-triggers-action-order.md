---
title: "同じ種類のトリガーに順番の番号を付ける rank"
description: "information_schema.triggers の action_order。テーブル、イベント、行か文か、BEFORE か AFTER かで区切った中で、名前順の rank を窓関数で付ける。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [2128, 2134]
function: "triggers.action_order"
difficulty: 3
tags: [アルゴリズム, 型システム]
format: 2
---

## ひとことで

トリガーは、テーブルの変更時に自動で動く関数です。同じテーブルに複数のトリガーがあると、どの順番で動くかが問題になります。`information_schema.triggers` の `action_order` は、その順番を表す番号を、窓関数の `rank()` で付けています。

## コード

```sql:line-numbers=2128
             rank() OVER (PARTITION BY CAST(n.nspname AS sql_identifier),
                                       CAST(c.relname AS sql_identifier),
                                       em.num,
                                       t.tgtype & 1,
                                       t.tgtype & 66
                                       ORDER BY t.tgname)
             AS cardinal_number) AS action_order,
```

## 前提知識

- **トリガー（trigger）**: 挿入・更新・削除などの操作の前後で、決まった関数を自動的に呼ぶ仕組み。
- **窓関数（window function）**: 行の集まりを区切って、その中での順位などを計算する関数。`OVER (...)` と書く。
- **`PARTITION BY`**: 窓関数の計算を区切るグループの指定。
- **`rank()`**: 並び順の中での順位を返す窓関数。同じ値には同じ順位が付く。
- **ビットの `&`**: 整数の各ビットを使ったフラグ判定。`tgtype` の中の、行単位か文単位か、BEFORE か AFTER かを表す。

## 何をしているか

### 1. 区切りの条件をそろえる

トリガーの動作の種類は、`tgtype` という 1 つの整数に、ビットのフラグとして詰め込まれています。`t.tgtype & 1` は、行単位のトリガーかどうかを、`t.tgtype & 66` は、BEFORE か AFTER かに関係するビットを表します。

```sql:line-numbers=2128
             rank() OVER (PARTITION BY CAST(n.nspname AS sql_identifier),
                                       CAST(c.relname AS sql_identifier),
                                       em.num,
                                       t.tgtype & 1,
                                       t.tgtype & 66
                                       ORDER BY t.tgname)
             AS cardinal_number) AS action_order,
```

### 2. 区切りの中で名前順の順位を付ける

`PARTITION BY` の列が、同じ区切りの中で、トリガーの順位を求めるグループを決めます。その中で、`ORDER BY t.tgname` の名前順に `rank()` を付けます。

ここでいう区切りは、スキーマ、テーブル、イベント（`INSERT` など）、行か文か、BEFORE か AFTER か、の組み合わせです。同じ組み合わせのトリガーだけが、同じグループとして比べられます。

### 3. 番号が 1 から始まる

同じ区切りで最初の名前のトリガーは `1`、次は `2` のように番号が付きます。動く順番を、利用者が読みやすい番号で示せます。

## ここがすごい

- **ビットの組み合わせを 1 つの区切りにしている**: 行か文か、BEFORE か AFTER かを、複数の `PARTITION BY` に分けずに、ビットの値で表しています。
- **窓関数で、並び替えと番号付けを 1 回で済ませている**: 別の一時表を作らずに、順番の番号を各行に付けられます。
- **同じ名前の扱いが一貫している**: `rank()` は同じ値に同じ順位を付けるため、重複する名前があっても番号が飛ぶ形で表れます。
- **トレードオフ**: `PARTITION BY` に多くの式を並べるので、読むには前提の知識が必要です。区切りの組み合わせを、まず頭に入れると理解しやすくなります。

## まとめ

- 複数の条件で区切った中の順位は、窓関数の `PARTITION BY` と `rank()` で書ける。
- 整数のビットを使ったフラグは、`&` で取り出すと区切りの条件として使える。
- 実行される順番を、番号として見せると、利用者が確かめやすい。
