---
title: "妥当性の項目だけを取り出す ST_IsValid"
description: "PostGIS の ST_IsValid(geometry, integer)。ST_isValidDetail の結果から valid の項目だけを (関数).valid で取り出し、真偽値として返す。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [4003, 4007]
function: "ST_IsValid(geometry, integer)"
difficulty: 2
tags: [型システム, 防御的プログラミング]
format: 2
---

## ひとことで

`ST_IsValid` は、図形が正しい形（妥当）かどうかを、真か偽で返す関数です。内部では、詳しい検査の結果を返す `ST_isValidDetail` を呼び、その中の `valid` の項目だけを取り出しています。

## コード

```sql:line-numbers=4003
CREATE OR REPLACE FUNCTION ST_IsValid(geometry, integer)
	RETURNS boolean
	AS 'SELECT (@extschema@.ST_isValidDetail($1, $2)).valid'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_HIGH;
```

## 前提知識

- **妥当性**: 図形が幾何学的に正しい形であること。たとえば、多角形の辺が交差していない、などの条件を満たすこと。
- **複合型の項目**: 関数が返す値の中の、名前の付いた個々の値。`(関数(...)).項目名` で取り出せる。
- **`integer` の引数**: 検査の方法や詳しさを選ぶための、整数の値。
- **`STRICT`**: 引数に `NULL` があれば、結果を `NULL` にする指定。
- **`_COST_HIGH`**: 計算が重いことを示す見積もり。

## 何をしているか

### 1. 詳しい検査の関数を呼び、項目を 1 つ選ぶ

本体は、`ST_isValidDetail` の結果から、`valid` の項目だけを取り出しています。

```sql:line-numbers=4005
	AS 'SELECT (@extschema@.ST_isValidDetail($1, $2)).valid'
```

`(...).valid` という書き方は、複合型の値のうち、`valid` という名前の項目を選ぶ書き方です。

### 2. 型と性質を宣言する

戻り値は `boolean`（真か偽）です。`IMMUTABLE` と `STRICT` によって、同じ図形と同じ検査方法では、いつも同じ結果が返ることが宣言されています。

```sql:line-numbers=4003
CREATE OR REPLACE FUNCTION ST_IsValid(geometry, integer)
	RETURNS boolean
```

## ここがすごい

- **詳しい検査を、単純な真偽に縮める**: 理由などの詳細は捨てて、有効かどうかだけを返します。`WHERE` の条件に、そのまま使えます。
- **1 つの検査関数を、2 つの関数が共有する**: `ST_IsValid` と `ST_IsValidReason` が、同じ詳細の検査を使っています。検査の仕方は 1 か所で管理されています。
- **複合型の項目選択**: 関数の戻り値から、必要な項目だけを取る書き方の基本になっています。
- **トレードオフ**: 検査は重いので、`WHERE` の中で行数の多い表に使うと、処理に時間がかかります。

## まとめ

- 詳しい検査の結果から、必要な項目だけを取り出すと、利用しやすい関数になる。
- 同じ検査を複数の関数で共有すると、判定の基準が揃う。
- 重い検査は、呼び出す回数と範囲を意識して使う。
