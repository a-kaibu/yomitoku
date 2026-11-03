---
title: "文字列が複数の多角形のときだけ、番号付きで図形にする ST_MPolyFromText（番号版）"
description: "PostGIS の ST_MPolyFromText(text, integer)。WKT の文字列と座標系の番号から図形を作り、型が複数の多角形（ST_MultiPolygon）のときだけ返し、それ以外は NULL にする。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5964, 5972]
function: "ST_MPolyFromText(text, integer)"
difficulty: 2
tags: [型システム, 防御的プログラミング]
format: 2
---

## ひとことで

`ST_MPolyFromText` は、WKT の文字列から複数の多角形をまとめた図形を作る関数です。座標系の番号も一緒に指定します。文字列の型がマルチポリゴンでなければ `NULL` を返し、面の集まりとして扱えない値を除きます。

## コード

```sql:line-numbers=5964
CREATE OR REPLACE FUNCTION ST_MPolyFromText(text, integer)
	RETURNS geometry
	AS '
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1, $2)) = ''ST_MultiPolygon''
	THEN @extschema@.ST_GeomFromText($1,$2)
	ELSE NULL END
	'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **マルチポリゴン（MULTIPOLYGON）**: 複数の多角形をまとめて一つの図形として扱う型。
- **座標系の番号（SRID）**: 図形の座標系を表す番号。
- **`ST_GeometryType`**: 図形の種類を `ST_MultiPolygon` のような名前で返す関数。
- **`CASE ... ELSE NULL`**: 条件に合わないときに `NULL` を返す書き方。

## 何をしているか

### 1. 番号付きで図形を作り、種類を比べる

```sql:line-numbers=5967
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1, $2)) = ''ST_MultiPolygon''
	THEN @extschema@.ST_GeomFromText($1,$2)
```

文字列と番号から図形を作り、種類が `ST_MultiPolygon` かを比べます。合えば、番号付きの図形を返します。

### 2. 合わないときは NULL にする

```sql:line-numbers=5969
	ELSE NULL END
	'
```

種類が違うときは `ELSE NULL` で `NULL` を返します。単独の多角形を、面の集まりとして扱うことを防ぎます。

### 3. 性質を揃える

```sql:line-numbers=5971
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

`STRICT` と `IMMUTABLE` によって、`NULL` の入力は計算されず、同じ入力には同じ結果が返ります。

## ここがすごい

- **面の集まりを型で絞る**: 複数の面として使える値だけを通すので、後の面積計算などが安全です。
- **番号と種類を一度に確かめる**: 二つの条件を一つの関数で扱えます。
- **同じ書き方を繰り返す**: 点、線、面の版が同じ形なので、読みやすさが保たれています。

## まとめ

- 面の集まりは、種類を確かめてから番号を付けて返すと安全になる。
- 版の書き方を揃えると、覚える量が減る。
- 合わない値は `NULL` にすると、誤りの広がりを止められる。
