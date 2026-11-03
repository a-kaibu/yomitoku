---
title: "図形の周りを広げる ST_Buffer（円の分割数を指定する版）"
description: "PostGIS の ST_Buffer(geom, radius, quadsegs)。円を何分割で近似するかを整数で受け取り、quad_segs= の文字列の形に直して、本体の ST_Buffer を呼ぶ。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [3908, 3912]
function: "ST_Buffer(geom geometry, radius float8, quadsegs integer)"
difficulty: 2
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`ST_Buffer` は、図形の周りを一定の距離だけ広げた図形を作る関数です。この版は、円の近似の細かさを、整数の分割数で渡せるようにしています。内部では、その数を、本体が求める文字列の形に直して呼びます。

## コード

```sql:line-numbers=3908
CREATE OR REPLACE FUNCTION ST_Buffer(geom geometry, radius float8, quadsegs integer)
	RETURNS geometry
	AS $$ SELECT @extschema@.ST_Buffer($1, $2, CAST('quad_segs='||CAST($3 AS text) as text)) $$
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_HIGH;
```

## 前提知識

- **バッファ**: 図形から一定の距離以内にある点の集まりを、新しい図形として作ること。
- **円の近似**: 円は曲線なので、直線の辺をつないで近似する。辺の数で精度が変わる。
- **`CAST(... AS text)`**: 値を文字列に変える指定。
- **`||`**: 文字列をつなぐ演算子。ここでは `'quad_segs='` と、数字を文字にしたものをつないでいる。

## 何をしているか

### 1. 分割数を文字列の形にする

```sql:line-numbers=3910
	AS $$ SELECT @extschema@.ST_Buffer($1, $2, CAST('quad_segs='||CAST($3 AS text) as text)) $$
```

整数の分割数を文字に変え、`quad_segs=` という前置きを付けます。本体の関数は、この形の文字列で設定を受け取ります。

### 2. 本体の関数を呼ぶ

```sql:line-numbers=3908
CREATE OR REPLACE FUNCTION ST_Buffer(geom geometry, radius float8, quadsegs integer)
	RETURNS geometry
```

作った文字列を三つ目の引数として、本体の `ST_Buffer` を呼びます。利用者は整数だけを渡せばよく、文字列の形を知る必要はありません。

## ここがすごい

- **利用者に分かりやすい引数にする**: 本体は文字列で設定を受けますが、この版では整数で書けます。
- **内部の形式を隠す**: 設定の書式が変わっても、この関数の中だけを直せば済みます。
- **`STRICT` で欠けた値を弾く**: 引数に `NULL` があれば、計算せずに `NULL` を返します。

## まとめ

- 利用者向けの引数は、本体が求める形に変換して渡すと使いやすい。
- 設定の書式は、一箇所で組み立てると変更に強くなる。
- 欠けた値は、`STRICT` で最初に弾く。
