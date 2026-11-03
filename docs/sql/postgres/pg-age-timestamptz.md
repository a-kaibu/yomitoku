---
title: "今日からの経過時間を age で求める"
description: "PostgreSQL の age(timestamptz)。引数 1 つだけのときは、今日の日付を基準にして、その時刻からの年・月・日の経過を interval で返す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_functions.sql
lines: [102, 106]
function: "age(timestamptz)"
difficulty: 2
tags: [日時, API設計]
format: 2
---

## ひとことで

`age(時刻)` は、その時刻から今日までの経過を `interval`（期間）として返す関数です。たとえば、生年月日から年齢を出すときに使えます。引数が 1 つのときは、基準の時刻を今日の日付にして、2 引数の `age` を呼ぶ形で定義されています。

## コード

```sql:line-numbers=102
CREATE OR REPLACE FUNCTION age(timestamptz)
 RETURNS interval
 LANGUAGE sql
 STABLE PARALLEL SAFE STRICT COST 1
RETURN age(cast(current_date as timestamptz), $1);
```

## 前提知識

- **`interval`**: 期間を表す型。「2 年 3 か月」のように、年・月・日などの単位で表せる。
- **`timestamptz`**: タイムゾーン付きの日時の型。
- **`current_date`**: 今日の日付を返す値。時刻は含まない。
- **`STABLE`**: 同じ引数なら、同じトランザクションの中では同じ結果を返すという性質。`IMMUTABLE` より弱い約束。
- **`cast(... as timestamptz)`**: 値をタイムゾーン付きの日時に変換する式。

## 何をしているか

### 1. 性質を宣言する

この関数は、今日の日付を使うため、`IMMUTABLE` ではなく `STABLE` と宣言されています。

```sql:line-numbers=102
CREATE OR REPLACE FUNCTION age(timestamptz)
 RETURNS interval
 LANGUAGE sql
 STABLE PARALLEL SAFE STRICT COST 1
```

`STABLE` は、同じ問い合わせの中では結果が変わらないことを、データベースに伝えます。実行する日によって結果が変わるので、`IMMUTABLE` にすると誤りになります。

### 2. 今日の日付を基準の時刻にして呼ぶ

本体は、`current_date` を `timestamptz` に変換し、それを基準にして、2 引数の `age` を呼ぶだけです。

```sql:line-numbers=106
RETURN age(cast(current_date as timestamptz), $1);
```

つまり、`age(時刻)` は `age(今日, 時刻)` と同じ意味になります。

## ここがすごい

- **引数を 1 つ省ける便利さ**: 利用者は、基準の日付を書かずに経過を求められます。
- **宣言の正しさが重要**: `STABLE` と宣言することで、データベースは結果を勝手に保存せず、実行のたびに今日の値を使います。
- **型を変換して 2 引数の関数に渡す**: 日付と時刻の型の違いを、`cast` で揃えて、既存の 2 引数の関数を再利用しています。
- **トレードオフ**: 基準が「今日」なので、同じ式でも実行日によって結果が変わります。過去の集計で使うと、再実行の結果が変わることに注意が必要です。

## まとめ

- 今日を基準にする関数は、`IMMUTABLE` ではなく `STABLE` と宣言する。
- 既定の引数を今日にすると、利用者の書き方が短くなる。
- 日付と時刻の型は、`cast` で揃えてから既存の関数に渡すとよい。
