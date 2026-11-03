---
title: "時刻だけの期間にも同じ OVERLAPS を当てはめる"
description: "PostgreSQL の overlaps(time, interval, time, interval)。日付を含まない時刻だけの期間について、開始と長さから終わりを作り、重なりを判定する。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_functions.sql
lines: [216, 221]
function: "overlaps(time, interval, time, interval)"
difficulty: 2
tags: [日時, アルゴリズム]
format: 2
---

## ひとことで

同じ `OVERLAPS` の考え方は、日付を含まない `time`（時刻）どうしにも使えます。たとえば「9 時から 1 時間」と「9 時 30 分から」のように、1 日の中の時間帯が重なるかを調べられます。この関数は、`time` と `interval` の組み合わせのための定義です。

## コード

```sql:line-numbers=216
CREATE OR REPLACE FUNCTION "overlaps"(time, interval,
  time, interval)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE COST 1
RETURN ($1, ($1 + $2)) overlaps ($3, ($3 + $4));
```

## 前提知識

- **`time` 型**: 時刻だけを表す型。日付は含まない。
- **`interval`**: 期間の長さ。時刻に足すと、時刻が進む。
- **`OVERLAPS`**: 期間どうしが重なるかを判定する述語（前の記事を参照）。
- **行の値**: `(a, b)` のように、2 つの値を組にしたもの。
- **`IMMUTABLE`**: 同じ入力には、いつでも同じ結果を返すという性質。

## 何をしているか

### 1. 時刻と長さの引数を受け取る

引数は、1 つ目の時刻と長さ、2 つ目の時刻と長さです。日付の情報が無いので、タイムゾーンや日付による変化がなく、`IMMUTABLE` と宣言されています。

```sql:line-numbers=216
CREATE OR REPLACE FUNCTION "overlaps"(time, interval,
  time, interval)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE COST 1
```

### 2. 終わりの時刻を足して、行どうしで比べる

1 つ目の期間は `($1, ($1 + $2))`、2 つ目は `($3, ($3 + $4))` の行の値になります。その 2 つを `overlaps` で比べます。

```sql:line-numbers=221
RETURN ($1, ($1 + $2)) overlaps ($3, ($3 + $4));
```

`$1 + $2` は、時刻に長さを足して、終わりの時刻を作ります。日付が無いので、同じ日の中での時間帯だけを比べます。

## ここがすごい

- **同じ形の定義を型ごとに用意する**: `timestamptz`、`timestamp`、`time` の組み合わせに、同じ考え方の関数を揃えています。利用者は型を問わず同じ書き方を使えます。
- **日付がないぶん、性質が安定**: `time` の計算は日付やタイムゾーンに左右されないので、`IMMUTABLE` という強い約束が成り立ちます。
- **時刻の足し算の性質に従う**: 24 時を超える足し算は、通常の時刻の計算と同じく、1 日の範囲で扱われる点に注意が必要です。
- **トレードオフ**: 日付をまたぐ期間は、時刻だけでは表せません。日付をまたぐ可能性がある場合は、`timestamp` の版を使う必要があります。

## まとめ

- 型が違っても、同じ期間の考え方を定義すると、利用者の書き方を揃えられる。
- 日付を含まない型は、性質が安定しやすく、`IMMUTABLE` と宣言しやすい。
- 日付をまたぐかどうかで、どの型の関数を使うかを決める。
