---
title: "日付と時刻を足して timestamptz を作る"
description: "PostgreSQL の timestamptz(date, time)。日付と時刻を足し算で 1 つの日時にし、タイムゾーン付きの型に変換する。足し算の結果が timestamp になることを cast で補う。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_functions.sql
lines: [120, 124]
function: "timestamptz(date, time)"
difficulty: 2
tags: [日時, 型システム]
format: 2
---

## ひとことで

`timestamptz(日付, 時刻)` は、別々の日付と時刻から、タイムゾーン付きの日時を作る関数です。日付と時刻を足すと、まず `timestamp`（タイムゾーンなし）になるので、それを `timestamptz` に変換しています。

## コード

```sql:line-numbers=120
CREATE OR REPLACE FUNCTION timestamptz(date, time)
 RETURNS timestamptz
 LANGUAGE sql
 STABLE PARALLEL SAFE STRICT COST 1
RETURN cast(($1 + $2) as timestamptz);
```

## 前提知識

- **`timestamp`**: 日付と時刻を表す型。タイムゾーンの情報を持たない。
- **`timestamptz`**: 日付と時刻に、タイムゾーンの情報を加えた型。時刻は内部では世界共通の時刻で管理される。
- **日付と時刻の足し算**: `date + time` は `timestamp` の値になる、という PostgreSQL の演算規則。
- **`STABLE`**: 同じトランザクションの中では同じ結果になるが、実行の日によっては変わりうるという性質。
- **`cast`**: 値の型を変える式。

## 何をしているか

### 1. 性質と引数の型を宣言する

この関数は、タイムゾーンの設定に依存するため、`STABLE` と宣言されています。引数は `date` と `time`、戻り値は `timestamptz` です。

```sql:line-numbers=120
CREATE OR REPLACE FUNCTION timestamptz(date, time)
 RETURNS timestamptz
 LANGUAGE sql
 STABLE PARALLEL SAFE STRICT COST 1
```

### 2. 足してから、タイムゾーン付きに変換する

本体は、`$1 + $2`（日付 + 時刻）の結果を、`timestamptz` に変換します。

```sql:line-numbers=124
RETURN cast(($1 + $2) as timestamptz);
```

日付と時刻を足すと、まずタイムゾーンのない `timestamp` になります。そのあとの `cast` で、現在のセッションのタイムゾーンを使って `timestamptz` にします。

## ここがすごい

- **既存の演算を組み合わせている**: 日付と時刻を足す演算があるので、それを使い、新しい計算を書く必要がありません。
- **変換の順番を明示する**: 「先に足して、あとで型を変える」という順番を、本体の式の形が表しています。
- **タイムゾーンの扱いを `STABLE` で表す**: タイムゾーンの設定が変わると結果が変わるので、`IMMUTABLE` ではなく `STABLE` が正しい宣言です。
- **トレードオフ**: どのタイムゾーンの時刻になるかは、セッションの設定で変わります。同じ関数でも、利用者ごとに結果が違うことがあります。

## まとめ

- 日付と時刻の組み合わせは、足し算で `timestamp` になり、必要なら `cast` で `timestamptz` にする。
- タイムゾーンに依存する変換は、`STABLE` と宣言するのが正しい。
- 型の変換の順番は、結果の意味（どのタイムゾーンか）を左右する。
