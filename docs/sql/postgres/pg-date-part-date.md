---
title: "date 型の date_part を timestamp に変換して呼ぶ"
description: "PostgreSQL の date_part(text, date)。date 型を timestamp にキャストして、既存の date_part(text, timestamp) に渡す。日付の引数を、時刻の部分の関数で扱えるようにしている。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_functions.sql
lines: [114, 118]
function: "date_part(text, date)"
difficulty: 2
tags: [日時, 型システム]
format: 2
---

## ひとことで

`date_part('year', 日付)` のように、日付から年や月を取り出す関数です。`date` 型には、もともとこの形の関数が無かったため、`timestamp` 型を受け取る関数に変換して渡すことで、同じ動きを実現しています。

## コード

```sql:line-numbers=114
CREATE OR REPLACE FUNCTION date_part(text, date)
 RETURNS double precision
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT COST 1
RETURN date_part($1, cast($2 as timestamp));
```

## 前提知識

- **`date_part(項目, 値)`**: 日時の値から、年、月、日、時などの部分を取り出す関数。
- **`date` 型**: 日付だけを表す型。時刻は含まない。
- **`timestamp` 型**: 日付と時刻を表す型。
- **関数の多重定義**: 同じ名前で、引数の型が違う関数を複数持つこと。
- **`cast(... as timestamp)`**: 値を別の型に変換する式。

## 何をしているか

### 1. 引数の型を明示する

この定義は、`date_part(text, date)` の形です。戻り値は浮動小数点の `double precision` です。

```sql:line-numbers=114
CREATE OR REPLACE FUNCTION date_part(text, date)
 RETURNS double precision
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT COST 1
```

`IMMUTABLE` は、同じ入力に同じ結果を返すことを表します。日付の部分の取り出しは、いつ計算しても同じ結果なので、この宣言が正しく使えます。

### 2. timestamp に変えて、既存の関数に渡す

本体は、日付の値を `timestamp` に `cast` し、それを `date_part($1, timestamp)` として呼びます。

```sql:line-numbers=118
RETURN date_part($1, cast($2 as timestamp));
```

時刻の部分は `00:00:00` になるので、年や月の取り出しは正しく行われます。

## ここがすごい

- **再利用による対応**: 日付の専用の処理を新しく書く代わりに、型の変換で既存の関数に任せています。
- **変換を 1 行に閉じる**: 型を変えるのは `cast` の 1 か所だけです。
- **宣言の一貫性**: 同じ入力には同じ結果を返すので、`IMMUTABLE` で最適化の対象にできます。
- **トレードオフ**: 変換の結果、時刻のある型の関数の挙動に従います。`date_part` の返す型が `double precision` なので、整数の値として使うには変換が必要になることがあります。

## まとめ

- 型が足りない関数は、型を変換して既存の関数に渡すと、少ない定義で済む。
- 変換で増える情報（時刻の 0 など）が、結果に影響しないか確かめる。
- 関数の性質（`IMMUTABLE`）は、本体の計算が本当にそうかを基準に決める。
