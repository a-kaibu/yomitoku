---
title: "点の集まりからボロノイ図の線を作る ST_VoronoiLines"
description: "PostGIS の ST_VoronoiLines。内部の _ST_Voronoi を、polygons の指定 false で呼び、点の境界を線として返す。ST_VoronoiPolygons と同じ仕組みを使う。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [4349, 4352]
function: "ST_VoronoiLines(g1 geometry, tolerance float8, extend_to geometry)"
difficulty: 3
tags: [数値計算, データ構造]
format: 2
---

## ひとことで

`ST_VoronoiLines` は、点の集まりのボロノイ図の境界を、線として返す関数です。ボロノイ図は、どの点に一番近いかで平面を分けたもので、その境界線が得られます。面として欲しいときは、多角形を返す `ST_VoronoiPolygons` を使います。

## コード

```sql:line-numbers=4349
CREATE OR REPLACE FUNCTION ST_VoronoiLines(g1 geometry, tolerance float8 DEFAULT 0.0, extend_to geometry DEFAULT NULL)
	   RETURNS geometry
	   AS $$ SELECT @extschema@._ST_Voronoi(g1, extend_to, tolerance, false) $$
	   LANGUAGE 'sql' IMMUTABLE PARALLEL SAFE;
```

## 前提知識

- **ボロノイ図**: 各点に一番近い領域を、点ごとに区切った図。隣り合う領域の境目が線になる。
- **許容誤差（tolerance）**: 近すぎる点どうしを同じ点とみなす距離の目安。
- **`extend_to`**: 外側の広がりを決める図形。無限に広がる境界を切り取るために使う。
- **`_ST_Voronoi`**: 多角形と線を同じ計算で作る内部の関数。

## 何をしているか

### 1. 内部の関数に線を作る指定をする

```sql:line-numbers=4351
	   AS $$ SELECT @extschema@._ST_Voronoi(g1, extend_to, tolerance, false) $$
```

`_ST_Voronoi` を呼び、最後の引数に `false` を渡します。これで、結果は多角形ではなく線になります。

### 2. 多角形の版との違い

```sql:line-numbers=4349
CREATE OR REPLACE FUNCTION ST_VoronoiLines(g1 geometry, tolerance float8 DEFAULT 0.0, extend_to geometry DEFAULT NULL)
	   RETURNS geometry
```

`ST_VoronoiPolygons` は同じ内部関数を `true` で呼びます。境界だけが欲しいか、領域ごと欲しいかで、関数を選びます。

## ここがすごい

- **同じ計算から二つの結果を得る**: 境界線と領域は同じ計算の別の見方なので、内部の関数を共有しています。
- **真偽の値で出力を切り替える**: 関数の名前を増やさず、引数の一つで種類を分けています。
- **外側の広がりを指定できる**: 無限に続く境界を、利用者が決めた図形で止められます。

## まとめ

- 同じ計算の別の出力は、内部の関数を真偽の値で切り替えて共有する。
- ボロノイ図は、境界線と領域のどちらでも使える。
- 無限に広がる境界は、外側の図形で切ると扱いやすい。
