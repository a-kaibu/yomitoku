---
title: "配列の要素と位置を行に広げる一行の関数"
description: "information_schema で使われる _pg_expandarray。WITH ORDINALITY を使い、配列の各要素を値と番号の組にして行として返す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [43, 47]
function: "_pg_expandarray"
difficulty: 2
tags: [イテレータ, 標準ライブラリ]
format: 2
---

## ひとことで

`_pg_expandarray` は、配列を「要素の値」と「何番目か」の 2 つの列を持つ行の集まりに広げる関数です。`information_schema` の多くのビューが、制約の列リストや引数リストを 1 行ずつ扱うためにこれを使っています。

## コード

```sql:line-numbers=43
CREATE FUNCTION _pg_expandarray(IN anyarray, OUT x anyelement, OUT n int)
    RETURNS SETOF RECORD
    LANGUAGE sql STRICT IMMUTABLE PARALLEL SAFE
    ROWS 100 SUPPORT pg_catalog.array_unnest_support
    AS 'SELECT * FROM pg_catalog.unnest($1) WITH ORDINALITY';
```

## 前提知識

- **配列（array）**: 同じ型の値を順番に並べたもの。PostgreSQL では `ARRAY[1,2,3]` のように書く。
- **`RETURNS SETOF RECORD`**: 関数が、行の集まり（表のようなもの）を返すことを表す宣言。
- **`OUT` 引数**: 関数の戻り値の列を名前付きで決める引数。ここでは `x`（要素）と `n`（番号）。
- **`WITH ORDINALITY`**: `unnest` などの集合を返す関数に、1 から始まる行番号の列を付けるオプション。
- **`STRICT`**: 引数に `NULL` が 1 つでも入ったら、関数の本体を実行せず `NULL` を返す指定。

## 何をしているか

### 1. `unnest` に番号を付けて返す

関数の本体は、ほとんどこの 1 行だけです。

```sql:line-numbers=47
    AS 'SELECT * FROM pg_catalog.unnest($1) WITH ORDINALITY';
```

`pg_catalog.unnest($1)` は配列を 1 要素 1 行に展開します。`WITH ORDINALITY` を付けると、各行に 1 から始まる番号が付きます。その 2 つの列が、宣言で決めた `x`（要素）と `n`（番号）に対応します。

例えば `{10, 20, 30}` を渡すと、`(10, 1)`、`(20, 2)`、`(30, 3)` の 3 行が返ります。

### 2. 宣言の部分で型と振る舞いを決める

関数の宣言は、戻り値の形と、最適化のための性質を決めています。

```sql:line-numbers=43
CREATE FUNCTION _pg_expandarray(IN anyarray, OUT x anyelement, OUT n int)
    RETURNS SETOF RECORD
    LANGUAGE sql STRICT IMMUTABLE PARALLEL SAFE
    ROWS 100 SUPPORT pg_catalog.array_unnest_support
```

`anyarray` を受け取り `anyelement` を返すので、整数の配列でも文字列の配列でも同じ関数が使えます。`IMMUTABLE` は同じ入力に必ず同じ結果を返すという約束で、プランナーがこの呼び出しを事前に計算してよいことを示します。

## ここがすごい

- **1 つの関数で多くの場所を助けている**: 制約、インデックス、関数の引数など、「配列の位置を見たい」場面で同じ道具を使えます。
- **番号付きの展開を標準機能で済ませている**: 自前で `generate_series` と配列の添字を組み合わせるより、短く読みやすく書けます。
- **トレードオフ**: `anyarray` を受けるため、型の違いは実行時まで確かめられません。使う側が正しい配列を渡す責任を負います。

## まとめ

- 配列を行に広げるときは、`unnest` と `WITH ORDINALITY` の組み合わせが基本の形。
- 関数に `IMMUTABLE` などの性質を付けると、計画の立て方が変わる。
- 小さな関数を部品として使い回すと、ビューの中身が短くなる。
