---
title: "COPY の進み具合を読む pg_stat_progress_copy"
description: "PostgreSQL の pg_stat_progress_copy ビュー。COPY の向きと入出力の種類を数値から文字列に変え、処理したバイト数や行数を読めるようにする。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1473, 1491]
function: "pg_stat_progress_copy"
difficulty: 2
tags: [入出力, 状態機械]
format: 2
---

## ひとことで

`pg_stat_progress_copy` は、`COPY` の実行中に、どこまで読み書きしたかを見せるビューです。`COPY FROM` でデータを取り込むか、`COPY TO` でデータを書き出すかを、文字で示します。

## コード

```sql:line-numbers=1473
CREATE VIEW pg_stat_progress_copy AS
    SELECT
        S.pid AS pid, S.datid AS datid, D.datname AS datname,
        S.relid AS relid,
        CASE S.param5 WHEN 1 THEN 'COPY FROM'
                      WHEN 2 THEN 'COPY TO'
                      END AS command,
        CASE S.param6 WHEN 1 THEN 'FILE'
                      WHEN 2 THEN 'PROGRAM'
                      WHEN 3 THEN 'PIPE'
                      WHEN 4 THEN 'CALLBACK'
                      END AS "type",
        S.param1 AS bytes_processed,
        S.param2 AS bytes_total,
        S.param3 AS tuples_processed,
        S.param4 AS tuples_excluded,
        S.param7 AS tuples_skipped
    FROM pg_stat_get_progress_info('COPY') AS S
        LEFT JOIN pg_database D ON S.datid = D.oid;
```

## 前提知識

- **`COPY`**: 表とファイルの間で、データをまとめて出し入れする命令。
- **`pg_stat_get_progress_info('COPY')`**: `COPY` の進み具合を、番号付きの列で返す関数。
- **`CASE` 式**: 値ごとに結果を変える。どの値にも当たらないときは `NULL` になる。
- **引用符で囲んだ列名**: `"type"` のように、予約語と同じ名前を列名に使うための書き方。

## 何をしているか

### 1. 向きを文字にする

```sql:line-numbers=1477
        CASE S.param5 WHEN 1 THEN 'COPY FROM'
                      WHEN 2 THEN 'COPY TO'
                      END AS command,
```

`param5` の値で、`COPY FROM`（読み込み）か `COPY TO`（書き出し）かを決めます。

### 2. 入出力の種類を文字にする

```sql:line-numbers=1480
        CASE S.param6 WHEN 1 THEN 'FILE'
                      WHEN 2 THEN 'PROGRAM'
                      WHEN 3 THEN 'PIPE'
                      WHEN 4 THEN 'CALLBACK'
                      END AS "type",
```

`param6` の値で、ファイル、プログラム、パイプ、コールバックのどれを使っているかを示します。列の名前は `"type"` です。

### 3. 数を素直に並べる

```sql:line-numbers=1485
        S.param1 AS bytes_processed,
        S.param2 AS bytes_total,
        S.param3 AS tuples_processed,
        S.param4 AS tuples_excluded,
        S.param7 AS tuples_skipped
```

`bytes_processed`、`tuples_processed` などは、`param` の値をそのまま名前を付けて返します。バイト数と行数が分かれているので、進み具合を割合で計算できます。

## ここがすごい

- **向きと種類を 2 つの列に分ける**: 「何をしているか」と「どこを使っているか」を別の列で表せます。
- **数値の意味を変換だけで隠す**: 利用者は番号を覚えなくても、画面の文字を見れば状況が分かります。
- **未知の値は `NULL` になる**: `ELSE` を書いていないので、対応しない番号が来ても誤った名前は付きません。

## まとめ

- 数値の意味は `CASE` で文字に変えて見せる。
- 向きと入出力の種類は、別の列に分けると読みやすい。
- 進み具合の数値は、そのまま名前を付けて並べる。
