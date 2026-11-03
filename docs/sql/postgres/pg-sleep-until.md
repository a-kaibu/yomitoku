---
title: "指定した時刻まで待つ pg_sleep_until"
description: "PostgreSQL の pg_sleep_until(timestamptz)。指定した時刻までの残り秒数を extract(epoch) の差で求め、pg_sleep に渡して待つ。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_functions.sql
lines: [262, 267]
function: "pg_sleep_until(timestamptz)"
difficulty: 2
tags: [日時, 並行処理]
format: 2
---

## ひとことで

`pg_sleep_until` は、指定した時刻になるまで待つ関数です。「午前 9 時まで待つ」のように、時刻を直接指定できます。内部では、その時刻と今の時刻の差を秒にして、`pg_sleep` に渡しています。

## コード

```sql:line-numbers=262
CREATE OR REPLACE FUNCTION pg_sleep_until(timestamptz)
 RETURNS void
 LANGUAGE sql
 PARALLEL SAFE STRICT COST 1
RETURN pg_sleep(extract(epoch from $1) -
                extract(epoch from clock_timestamp()));
```

## 前提知識

- **`pg_sleep(秒)`**: 指定した秒数だけ待つ関数。
- **`timestamptz`**: タイムゾーン付きの日時の型。
- **`extract(epoch from ...)`**: 日時を、1970 年 1 月 1 日からの秒数に変える式。
- **`clock_timestamp()`**: 呼ばれた瞬間の正確な時刻を返す関数。
- **`VOLATILE` と `STABLE`**: 関数が呼ばれるたびに結果が変わるかどうかを表す性質。ここでは既定の `VOLATILE` のままになっている。

## 何をしているか

### 1. 目標の時刻を秒に直す

目標の時刻の epoch から、今の時刻の epoch を引くと、残りの秒数が求まります。

```sql:line-numbers=266
RETURN pg_sleep(extract(epoch from $1) -
                extract(epoch from clock_timestamp()));
```

`extract(epoch from $1)` は、指定された時刻を秒で表します。`clock_timestamp()` は、呼ばれた瞬間の時刻です。

### 2. 残りの秒数を pg_sleep に渡す

求めた差を、`pg_sleep` に渡して待ちます。

```sql:line-numbers=262
CREATE OR REPLACE FUNCTION pg_sleep_until(timestamptz)
 RETURNS void
 LANGUAGE sql
 PARALLEL SAFE STRICT COST 1
```

目標の時刻がすでに過ぎていれば、差は負になり、`pg_sleep` は直ちに戻ります。

## ここがすごい

- **時刻の指定を、そのまま使える**: 利用者は、待つ長さを計算せずに、目標の時刻を書けます。
- **負の差の扱い**: 過ぎた時刻を指定しても、待たずに終わるので、安全な動きになります。
- **`pg_sleep_for` と対になる設計**: 期間で指定する版と、時刻で指定する版を並べて、使い分けを可能にしています。
- **トレードオフ**: 待っている間はセッションを占有します。長い時間を待つ用途では、他の仕組みを使うほうがよい場合もあります。

## まとめ

- 時刻で待つには、目標の時刻と今の時刻の差を秒に直す。
- 過ぎた時刻は負の差になり、待たずに戻るので、扱いが簡単になる。
- 期間で指定する版と、時刻で指定する版は、対にして用意すると使いやすい。
