---
title: "文字列が多角形のときだけ、座標系の番号付きで図形にする ST_PolyFromText（番号版）"
description: "PostGIS の ST_PolyFromText(text, integer)。WKT の文字列と座標系の番号から図形を作り、型が多角形（ST_Polygon）のときだけ返し、それ以外は NULL にする。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5873, 5881]
function: "ST_PolyFromText(text, integer)"
difficulty: 2
tags: [型システム, 防御的プログラミング]
format: 2
---

## ひとことで

この `ST_PolyFromText` は、WKT の文字列から多角形を作るときに、座標系の番号を一緒に渡す版です。文字列が多角形でなければ `NULL` を返します。番号を付けた図形を、後の面積計算や変換に安心して使えます。

## コード

```sql:line-numbers=5873
CREATE OR REPLACE FUNCTION ST_PolyFromText(text, integer)
	RETURNS geometry
	AS '
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1, $2)) = ''ST_Polygon''
	THEN @extschema@.ST_GeomFromText($1, $2)
	ELSE NULL END
	'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **多角形（POLYGON）**: 閉じた輪郭で囲まれた面。WKT では `POLYGON((0 0, 1 0, 1 1, 0 0))` と書く。
- **座標系の番号（SRID）**: 図形の座標系を表す番号。
- **`ST_GeometryType`**: 図形の種類を `ST_Polygon` のような名前で返す関数。
- **`ELSE NULL`**: 条件に合わないときの既定の値。

## 何をしているか

### 1. 番号付きで図形を作り、種類を確かめる

```sql:line-numbers=5876
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1, $2)) = ''ST_Polygon''
```

文字列と番号から図形を作り、その種類が `ST_Polygon` かを比べます。

### 2. 多角形のときだけ返す

```sql:line-numbers=5877
	THEN @extschema@.ST_GeomFromText($1, $2)
	ELSE NULL END
```

種類が多角形なら、番号付きの図形を返します。それ以外は `NULL` を返し、面として扱えない値を除きます。

### 3. 性質を確かめる

```sql:line-numbers=5880
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

`STRICT` と `IMMUTABLE` によって、`NULL` の入力は計算されず、同じ入力には同じ結果が返ることが分かります。

## ここがすごい

- **面の種類を通すだけにする**: 点や線が多角形として扱われる誤りを防げます。
- **座標系と種類を一度に確かめる**: 番号付きの版は、利用者が二つの条件を別々に書かずに済みます。
- **版の形を揃える**: 点、線、多角形の番号版は同じ書き方なので、読みやすさが保たれています。

## まとめ

- 面の値は、番号を付けたうえで種類を確かめると安全になる。
- 版の形を揃えると、読み手が一つを理解すれば残りも分かる。
- 合わない値を `NULL` にする書き方は、後の処理の誤りを防ぐ。
