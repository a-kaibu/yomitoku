---
title: "2 次元の変換を行列の 6 つの数で表す ST_Affine"
description: "PostGIS の ST_Affine(geometry, a, b, d, e, xoff, yoff)。6 つの数から 3 行 3 列の行列を組み立て、ほかの ST_Rotate や ST_Translate の土台になる関数。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [2120, 2124]
function: "ST_Affine(geometry, float8, float8, float8, float8, float8, float8)"
difficulty: 2
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`ST_Affine` は、図形を平行移動、拡大縮小、回転などでまとめて変換する関数です。変換は行列で表され、この関数は 6 つの数を受け取って行列を組み立てます。ほかの多くの変換関数は、この関数を呼ぶだけで作られています。

## コード

```sql:line-numbers=2120
CREATE OR REPLACE FUNCTION ST_Affine(geometry,float8,float8,float8,float8,float8,float8)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_Affine($1,  $2, $3, 0,  $4, $5, 0,  0, 0, 1,  $6, $7, 0)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_LOW;
```

## 前提知識

- **アフィン変換**: 直線の平行を保ったまま、図形を平行移動、拡大縮小、回転、せん断する変換。
- **行列**: 数を縦と横に並べた表。変換は、行列と座標の掛け算で表せる。
- **`float8`**: 倍精度の浮動小数点数。PostgreSQL の小数の型の一つ。
- **`IMMUTABLE`**: 同じ入力には、いつも同じ結果を返すという指定。

## 何をしているか

### 1. 6 つの数を行列に入れる

```sql:line-numbers=2122
	AS 'SELECT @extschema@.ST_Affine($1,  $2, $3, 0,  $4, $5, 0,  0, 0, 1,  $6, $7, 0)'
```

`$2`、`$3`、`$4`、`$5` の 4 つは、2 次元の行列の成分になります。`$6`、`$7` は、平行移動の量です。残りの成分は、0 や 1 で固定されています。

### 2. 3 次元の行列として呼ぶ

```sql:line-numbers=2121
	RETURNS geometry
	AS 'SELECT @extschema@.ST_Affine($1,  $2, $3, 0,  $4, $5, 0,  0, 0, 1,  $6, $7, 0)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
```

この関数は、z 方向の成分を 0 にした 3 次元の行列で、既存の `ST_Affine` を呼びます。2 次元の変換を、3 次元の計算に乗せる形です。

## ここがすごい

- **6 つの数で変換を表す**: 利用者は行列の書き方を知らなくても、よく使う変換を数で指定できます。
- **上位の関数の土台になる**: 回転や平行移動は、この関数を呼ぶ形で書けるので、計算の仕組みが一箇所にまとまります。
- **`STRICT` で欠けた値を弾く**: 引数に `NULL` があれば、計算せずに `NULL` を返します。

## まとめ

- 変換は、行列の成分として数で表せる。
- 利用者向けの関数は、一つの土台となる関数を呼ぶ形にすると保守しやすい。
- 欠けた値は `STRICT` で扱うと、計算の途中で誤った結果を作らない。
