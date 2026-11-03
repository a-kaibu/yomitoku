---
title: "常用対数を log(底, 値) の呼び出しで作る"
description: "PostgreSQL の log(numeric)。底を省いたときは 10 を底にする。log10 も同じ式で定義されていて、2 つの関数名で同じ計算を提供する。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_functions.sql
lines: [66, 76]
function: "log(numeric)"
difficulty: 1
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`log(数)` は、その数の常用対数（10 を底とする対数）を返す関数です。底を省くと 10 になります。PostgreSQL は、底を指定する `log(底, 数)` を本体に持ち、底を 10 に固定した関数を 2 つ用意しています。

## コード

```sql:line-numbers=66
CREATE OR REPLACE FUNCTION log(numeric)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT COST 1
RETURN log(10, $1);

CREATE OR REPLACE FUNCTION log10(numeric)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT COST 1
RETURN log(10, $1);
```

## 前提知識

- **対数**: ある数を何乗すると、ある値になるかを表す数。`log(100) = 2`（10 の 2 乗が 100）。
- **底（base）**: 対数の基準の数。常用対数は底が 10。
- **`numeric` 型**: 小数点以下の桁数を正確に保つ数値の型。
- **関数の多重定義**: 同じ名前で引数の数や型が違う関数を、複数定義すること。
- **`RETURN` 式**: SQL 関数の本体を、1 つの式で書く書き方。

## 何をしているか

### 1. 1 引数の log は底 10 として定義する

`log(numeric)` は、戻り値が `numeric` の関数です。本体は、底に 10 を指定した `log(10, $1)` を呼ぶだけです。

```sql:line-numbers=66
CREATE OR REPLACE FUNCTION log(numeric)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT COST 1
RETURN log(10, $1);
```

### 2. log10 は同じ計算を別の名前で提供する

`log10(numeric)` も、本体は `log(10, $1)` です。名前が違うだけで、同じ計算になります。

```sql:line-numbers=72
CREATE OR REPLACE FUNCTION log10(numeric)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT COST 1
RETURN log(10, $1);
```

この 2 つの名前は、他のデータベースや電卓で使われる名前に合わせるための配慮です。

## ここがすごい

- **本体は 1 か所にある**: 2 つの名前は、底 2 引数の `log` を呼ぶだけなので、計算の仕方が食い違いません。
- **互換のための別名**: `log10` の名前で書いたプログラムも、そのまま動きます。
- **`numeric` で精度を保つ**: 浮動小数点ではなく `numeric` を使うので、桁の数が決まった計算ができます。
- **トレードオフ**: 底を省く書き方は、他のデータベースでは意味が違うことがあります（自然対数を指すもの）。移植の際は、底の既定値に注意が必要です。

## まとめ

- 既定値を持つ関数は、一般の形の関数を既定の引数で呼ぶと、定義を少なくできる。
- 同じ計算を別の名前で提供するときは、本体を共有して食い違いを防ぐ。
- 既定値の違いは、移植のときに問題になりやすいので確認が必要。
