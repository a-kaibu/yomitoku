---
title: "座標系の番号を省いて、複数の多角形を作る ST_MPolyFromText"
description: "PostGIS の ST_MPolyFromText(text)。WKT の文字列だけから複数の多角形を作る。型がマルチポリゴンでなければ NULL を返す。番号付きの版と同じ確かめ方。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5975, 5983]
function: "ST_MPolyFromText(text)"
difficulty: 2
tags: [型システム, 防御的プログラミング]
format: 2
---

## ひとことで

`ST_MPolyFromText` の一引数版は、WKT の文字列だけを受け取って、複数の多角形をまとめた図形を作ります。座標系の番号は指定しません。型がマルチポリゴンでなければ `NULL` を返す点は、番号付きの版と同じです。

## コード

```sql:line-numbers=5975
CREATE OR REPLACE FUNCTION ST_MPolyFromText(text)
	RETURNS geometry
	AS '
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1)) = ''ST_MultiPolygon''
	THEN @extschema@.ST_GeomFromText($1)
	ELSE NULL END
	'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **マルチポリゴン（MULTIPOLYGON）**: 複数の多角形をまとめて一つの図形として扱う型。
- **座標系の番号（SRID）が無い図形**: 番号を付けずに作られた図形。後で `ST_SetSRID` などで番号を付けられる。
- **`ST_GeometryType`**: 図形の種類を名前で返す関数。
- **引数の省略版**: 番号を受け取らない、同じ名前の別の版。

## 何をしているか

### 1. 文字列から図形を作り、種類を比べる

```sql:line-numbers=5978
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1)) = ''ST_MultiPolygon''
	THEN @extschema@.ST_GeomFromText($1)
```

文字列だけから図形を作り、種類が `ST_MultiPolygon` かを比べます。合えば図形を返します。

### 2. 合わないときは NULL にする

```sql:line-numbers=5980
	ELSE NULL END
	'
```

種類が違うときは `NULL` を返します。単独の多角形を、面の集まりとして扱うことを防ぎます。

### 3. 性質を確かめる

```sql:line-numbers=5982
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

`STRICT` で `NULL` の入力は計算されず、`IMMUTABLE` で同じ入力には同じ結果が返ります。

## ここがすごい

- **番号を省いても確かめは同じ**: 引数が少なくても、種類の確かめ方は番号付きの版と揃っています。
- **書く量を減らせる**: 座標系が関係ない場面では、文字列だけで済みます。
- **同じ形の版が並ぶ**: 点、線、面の版が揃っているので、読み手は迷いません。

## まとめ

- 番号を省く版も、種類の確かめ方は番号付きの版と揃えると安心できる。
- 引数の少ない版は、書く量を減らせる。
- 性質を揃えておくと、どの版を使っても結果の扱いが変わらない。
