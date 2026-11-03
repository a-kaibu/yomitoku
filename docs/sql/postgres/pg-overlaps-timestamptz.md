---
title: "期間の重なりを OVERLAPS の行どうしの比較で調べる"
description: "PostgreSQL の overlaps(timestamptz, interval, timestamptz, interval)。開始と「開始 + 期間」の組を行の比較にし、OVERLAPS 述語で期間が重なるかを真偽値で返す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_functions.sql
lines: [181, 186]
function: "overlaps(timestamptz, interval, timestamptz, interval)"
difficulty: 2
tags: [日時, アルゴリズム]
format: 2
---

## ひとことで

`OVERLAPS` は、2 つの期間が重なっているかを調べる SQL の述語です。期間の終わりを「開始 + 長さ」で計算して、2 つの期間の組を比べます。この関数は、期間の片方を「開始と長さ」で与える形のための定義です。

## コード

```sql:line-numbers=181
CREATE OR REPLACE FUNCTION "overlaps"(timestamptz, interval,
  timestamptz, interval)
 RETURNS boolean
 LANGUAGE sql
 STABLE PARALLEL SAFE COST 1
RETURN ($1, ($1 + $2)) overlaps ($3, ($3 + $4));
```

## 前提知識

- **`OVERLAPS` 述語**: `(開始1, 終了1) OVERLAPS (開始2, 終了2)` の形で、2 つの期間が重なるかを真偽値で返す SQL の演算。
- **行の値（row constructor）**: `(a, b)` のように、複数の値をまとめて 1 つの値として扱う書き方。
- **`interval`**: 期間の長さを表す型。
- **`timestamptz`**: タイムゾーン付きの日時の型。
- **`STABLE`**: 同じ問い合わせの中では同じ結果になるが、タイムゾーンなどで変わりうる性質。

## 何をしているか

### 1. 性質と引数の型を宣言する

引数は、1 つ目の期間の開始（`timestamptz`）と長さ（`interval`）、2 つ目の期間の開始と長さです。タイムゾーンに依存するので、`STABLE` と宣言されています。

```sql:line-numbers=181
CREATE OR REPLACE FUNCTION "overlaps"(timestamptz, interval,
  timestamptz, interval)
 RETURNS boolean
 LANGUAGE sql
 STABLE PARALLEL SAFE COST 1
```

### 2. 期間の終わりを「開始 + 長さ」で求め、行どうしで比べる

本体では、1 つ目の期間を `($1, ($1 + $2))` という行の値にします。2 つ目の期間も `($3, ($3 + $4))` です。その 2 つを `overlaps` でつなぎます。

```sql:line-numbers=186
RETURN ($1, ($1 + $2)) overlaps ($3, ($3 + $4));
```

`($1 + $2)` が、終わりの時刻を表します。こうして、期間の終わりが無くても、開始と長さから `OVERLAPS` の形を作れます。

## ここがすごい

- **長さで与えられた期間を、そのまま比べられる**: 利用者が終わりの時刻を計算しなくても、長さのまま比較できます。
- **既存の述語の再利用**: 重なりの判定は、`OVERLAPS` の演算に任せています。自前で「開始が終了より前か」などを書く必要がありません。
- **引数の組み合わせを増やせる**: 開始と終了、開始と長さの組み合わせごとに、同じ形で関数を定義しています。
- **トレードオフ**: `OVERLAPS` は、境界がぴったり接している場合（終わりと開始が同じ）の扱いに注意が必要です。接しているだけでは重ならない、という規則が前提になります。

## まとめ

- 期間の重なりは、開始と終了の組を作って `OVERLAPS` で比べる。
- 長さで与えられた期間は、`開始 + 長さ` を終わりとして行の値にすると扱える。
- 境界の扱いは、演算子の規則を前提として読み取る。
