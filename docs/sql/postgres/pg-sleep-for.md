---
title: "期間を秒に直して pg_sleep を呼ぶ pg_sleep_for"
description: "PostgreSQL の pg_sleep_for(interval)。期間の長さを、clock_timestamp() を使って秒の数に直し、pg_sleep に渡す。待つ時間を interval で指定できる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_functions.sql
lines: [255, 260]
function: "pg_sleep_for(interval)"
difficulty: 3
tags: [日時, 並行処理]
format: 2
---

## ひとことで

`pg_sleep_for` は、指定した期間（`interval`）だけ、セッションを止めて待つ関数です。もとの `pg_sleep` は秒の数で指定しますが、この関数は「1 分」のような期間の型で書けるように、秒数に変換してから `pg_sleep` を呼んでいます。

## コード

```sql:line-numbers=255
CREATE OR REPLACE FUNCTION pg_sleep_for(interval)
 RETURNS void
 LANGUAGE sql
 PARALLEL SAFE STRICT COST 1
RETURN pg_sleep(extract(epoch from clock_timestamp() + $1) -
                extract(epoch from clock_timestamp()));
```

## 前提知識

- **`pg_sleep(秒)`**: 指定した秒数だけ、現在のセッションを待たせる関数。
- **`interval`**: 期間を表す型。`'1 minute'` のように書ける。
- **`clock_timestamp()`**: 呼ばれた瞬間の時刻を返す関数。`now()` と違い、トランザクションの途中でも進む。
- **`extract(epoch from ...)`**: 日時や期間を、1970 年からの秒数（epoch）として取り出す式。
- **`PARALLEL SAFE`**: 並列処理の中で安全に使える、という宣言。

## 何をしているか

### 1. 期間の終わりまでの秒数を求める

本体は、「今から期間が経つ時刻」と「今」の差を秒で取ります。その差が、待つべき秒数です。

```sql:line-numbers=259
RETURN pg_sleep(extract(epoch from clock_timestamp() + $1) -
                extract(epoch from clock_timestamp()));
```

`clock_timestamp() + $1` が「待ち終わる時刻」です。それを epoch の秒数にしたものから、「今」の epoch の秒数を引きます。

### 2. 差を pg_sleep に渡す

求めた秒数を、`pg_sleep` に渡して待ちます。

```sql:line-numbers=255
CREATE OR REPLACE FUNCTION pg_sleep_for(interval)
 RETURNS void
 LANGUAGE sql
 PARALLEL SAFE STRICT COST 1
```

## ここがすごい

- **単位の変換を式で書く**: 期間を、秒という単位に直す処理を、`extract` の差として表しています。
- **`clock_timestamp()` を使う**: 途中で時刻が進むことを前提にして、待つ量を正確に求めています。`now()` を使うと、トランザクションの開始時刻で固定されるため、待つ量がずれます。
- **既存の関数を土台にする**: 待つ仕組みは `pg_sleep` に任せ、この関数は単位の変換だけを担当しています。
- **トレードオフ**: 待つ時間が負になると、すぐに戻ります。また、長い時間の待機は、セッションを占有するので、本番では使いどころに注意が必要です。

## まとめ

- 期間の単位が違う関数は、差を秒に直して既存の関数に渡すと作りやすい。
- 現在の時刻は、トランザクションの途中でも進む `clock_timestamp()` で取ると正確になる。
- 「今から何秒後か」は、終わりの時刻から今の時刻を引くと求められる。
