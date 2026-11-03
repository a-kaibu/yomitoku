---
title: "座標系の変換を 3 通りの引数で呼び分ける ST_Transform"
description: "PostGIS の ST_Transform。変換先の座標系（proj 文字列）だけを渡す版では、図形の現在の SRID を spatial_ref_sys から引いて、変換の元を決める。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [3136, 3141]
function: "ST_Transform(geom geometry, to_proj text)"
difficulty: 3
tags: [型システム, API設計]
format: 2
---

## ひとことで

`ST_Transform` は、図形の座標系を別の座標系に変換する関数です。緯度経度から平面の座標へ、といった変換に使います。この定義は、変換先だけを指定する版で、変換元は図形に記録された SRID から、座標系の表を引いて決めています。

## コード

```sql:line-numbers=3136
CREATE OR REPLACE FUNCTION ST_Transform(geom geometry, to_proj text)
	RETURNS geometry AS
	'SELECT @extschema@.postgis_transform_geometry($1, proj4text, $2, 0)
	FROM @extschema@.spatial_ref_sys WHERE srid=@extschema@.ST_SRID($1);'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_HIGH;
```

## 前提知識

- **座標系（CRS）**: 地球上の位置を数値で表すための決まり。緯度経度や、平面の座標など、いくつかの種類がある。
- **SRID**: 座標系に付けられた番号。図形は、どの座標系の値かを SRID で持つ。
- **`spatial_ref_sys`**: 座標系の定義を持つ表。`proj4text` 列に、変換の式を表す文字列（proj 文字列）が入る。
- **proj 文字列**: 座標変換の方法を、`+proj=...` の形の文字列で書いたもの。
- **`_COST_HIGH`**: 計算の重さが大きいことを示す見積もり。

## 何をしているか

### 1. 変換先の proj 文字列を受け取る

引数は、図形と、変換先の proj 文字列です。結果は同じ型の図形になります。

```sql:line-numbers=3136
CREATE OR REPLACE FUNCTION ST_Transform(geom geometry, to_proj text)
	RETURNS geometry AS
```

### 2. 図形の SRID から、変換元を引く

本体の `SELECT` は、`spatial_ref_sys` の表から、図形の SRID に一致する行の `proj4text` を取り出します。その値を変換元として、`postgis_transform_geometry` を呼びます。

```sql:line-numbers=3138
	'SELECT @extschema@.postgis_transform_geometry($1, proj4text, $2, 0)
	FROM @extschema@.spatial_ref_sys WHERE srid=@extschema@.ST_SRID($1);'
```

`ST_SRID($1)` は、図形の SRID を返す関数です。変換元の情報は、図形自体ではなく、座標系の表から得ています。

### 3. 他の版と比べる

同じ名前で、変換元も指定する版（`from_proj`）もあります。そちらは、表を引かずに、変換元の proj 文字列をそのまま使います。

```sql:line-numbers=3144
CREATE OR REPLACE FUNCTION ST_Transform(geom geometry, from_proj text, to_proj text)
	RETURNS geometry AS
	'SELECT @extschema@.postgis_transform_geometry($1, $2, $3, 0)'
```

（ここでは、変換元の情報を引数で与える版の本体を引用しています。）

## ここがすごい

- **図形が持つ情報を最大限使う**: 利用者は、変換元を書かなくても、図形の SRID から自動で決まります。
- **同じ名前で引数の違う版を並べる**: 引数の並びで、どの情報を利用者が与えるかを選べます。
- **重い処理を明示する**: `_COST_HIGH` で、計算が重いことをプランナーに伝えています。
- **トレードオフ**: 表を引くため、変換のたびに座標系の定義を読みます。大量の図形を扱うときは、この違いが速さに影響します。

## まとめ

- 変換元の情報を、データの中の番号（SRID）から引くと、利用者の指定が減る。
- 同じ名前で引数違いの版を用意すると、必要な情報の量に応じて使い分けられる。
- 重い計算には、計算量の見積もりを正しく付けておくと、計画が立てやすい。
