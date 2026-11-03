---
title: "文字列が線のときだけ、座標系の番号付きで図形にする ST_LineFromText（番号版）"
description: "PostGIS の ST_LineFromText(text, integer)。WKT の文字列と座標系の番号から図形を作り、型が線（ST_LineString）のときだけ返し、それ以外は NULL にする。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5851, 5859]
function: "ST_LineFromText(text, integer)"
difficulty: 2
tags: [型システム, 防御的プログラミング]
format: 2
---

## ひとことで

この `ST_LineFromText` は、WKT の文字列から線を作るときに、座標系の番号を一緒に渡す版です。文字列が線でなければ `NULL` を返します。点の版と同じ形で書かれているので、一つを読めばもう一つも読めます。

## コード

```sql:line-numbers=5851
CREATE OR REPLACE FUNCTION ST_LineFromText(text, integer)
	RETURNS geometry
	AS '
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1, $2)) = ''ST_LineString''
	THEN @extschema@.ST_GeomFromText($1,$2)
	ELSE NULL END
	'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **線（LINESTRING）**: 点を順番につないだ図形。WKT では `LINESTRING(0 0, 1 1)` と書く。
- **座標系の番号（SRID）**: 図形の座標系を表す番号。
- **`ST_GeometryType`**: 図形の種類を `ST_LineString` のような名前で返す関数。
- **`CASE ... ELSE NULL`**: 条件に合わないときに `NULL` を返す書き方。

## 何をしているか

### 1. 番号付きで図形を作り、種類を確かめる

```sql:line-numbers=5854
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1, $2)) = ''ST_LineString''
```

文字列と番号から図形を作り、その種類が `ST_LineString` かを比べます。

### 2. 線のときだけ返す

```sql:line-numbers=5855
	THEN @extschema@.ST_GeomFromText($1,$2)
	ELSE NULL END
```

種類が線なら、番号付きの図形を返します。違う種類なら `NULL` を返し、線として扱えない値が混ざらないようにします。

## ここがすごい

- **番号付きの図形を一度に作る**: 座標系と種類の両方を、一つの関数で確かめられます。
- **同じ形の版を並べる**: 点、線、多角形の番号版は同じ書き方なので、読み手は一つを理解すれば残りも分かります。
- **欠けた値を先に弾く**: `STRICT` で `NULL` の入力は計算されません。

## まとめ

- 番号付きの生成関数は、座標系と種類の両方を確かめると安全になる。
- 同じ形の関数を並べておくと、覚える量が減る。
- 合わない値を `NULL` にする書き方は、誤りの広がりを止める。
