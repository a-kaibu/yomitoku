---
title: "点の集まりから、ボロノイ領域の多角形を作る ST_VoronoiPolygons"
description: "PostGIS の ST_VoronoiPolygons。内部の _ST_Voronoi を、polygons の指定 true で呼び、点の近さで分けた領域を多角形として返す。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [4344, 4347]
function: "ST_VoronoiPolygons(g1 geometry, tolerance float8, extend_to geometry)"
difficulty: 3
tags: [数値計算, データ構造]
format: 2
---

## ひとことで

`ST_VoronoiPolygons` は、点の集まりから、ボロノイ領域を作る関数です。ボロノイ領域とは、どの点に一番近いかで平面を分けた、多角形の集まりです。この関数は、その領域を多角形として返します。

## コード

```sql:line-numbers=4344
CREATE OR REPLACE FUNCTION ST_VoronoiPolygons(g1 geometry, tolerance float8 DEFAULT 0.0, extend_to geometry DEFAULT NULL)
	   RETURNS geometry
	   AS $$ SELECT @extschema@._ST_Voronoi(g1, extend_to, tolerance, true) $$
	   LANGUAGE 'sql' IMMUTABLE PARALLEL SAFE;
```

## 前提知識

- **ボロノイ図**: 各点に、一番近い点が自分であるような領域を、点ごとに区切った図。
- **許容誤差（tolerance）**: 近い点どうしを同じ点とみなす距離の目安。0 なら区別する。
- **`extend_to`**: 領域の外側を、どこまで広げるかを決める図形。
- **`_ST_Voronoi`**: 多角形と線を、同じ計算で作る内部の関数。

## 何をしているか

### 1. 内部の関数に、多角形を作る指定をする

```sql:line-numbers=4346
	   AS $$ SELECT @extschema@._ST_Voronoi(g1, extend_to, tolerance, true) $$
```

`_ST_Voronoi` を呼び、最後の引数に `true` を渡します。これで、結果は線ではなく多角形になります。

### 2. 線の版と並べて見る

```sql:line-numbers=4349
CREATE OR REPLACE FUNCTION ST_VoronoiLines(g1 geometry, tolerance float8 DEFAULT 0.0, extend_to geometry DEFAULT NULL)
	   RETURNS geometry
	   AS $$ SELECT @extschema@._ST_Voronoi(g1, extend_to, tolerance, false) $$
	   LANGUAGE 'sql' IMMUTABLE PARALLEL SAFE;
```

同じ形の `ST_VoronoiLines` は、最後の引数に `false` を渡します。関数を分けるかわりに、一つの内部関数の引数で結果の種類を切り替えています。

## ここがすごい

- **一つの計算を二つの形で使う**: 多角形と線は、同じ計算の結果なので、内部の関数を共有しています。
- **引数で種類を決める**: 関数の名前を分けても、中身は一つに保てます。
- **外側の広がりを指定できる**: `extend_to` で、無限に広がる領域を切り取れます。

## まとめ

- 同じ計算の別の出力は、内部の関数を引数で切り替えて共有する。
- ボロノイ領域は、近さで平面を分けた多角形として表せる。
- 無限に広がる領域は、外側の図形で切り取ると扱いやすい。
