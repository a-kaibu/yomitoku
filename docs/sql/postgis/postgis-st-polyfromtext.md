---
title: "文字列が多角形のときだけ図形にする ST_PolyFromText"
description: "PostGIS の ST_PolyFromText(text)。WKT の文字列から図形を作り、型が多角形（ST_Polygon）のときだけ返し、それ以外は NULL にする。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5862, 5870]
function: "ST_PolyFromText(text)"
difficulty: 2
tags: [型システム, 防御的プログラミング]
format: 2
---

## ひとことで

`ST_PolyFromText` は、WKT の文字列から多角形を作る関数です。文字列が多角形でないときは、`NULL` を返します。線を作る `ST_LineFromText` と同じ形で、種類を確かめてから値を返します。

## コード

```sql:line-numbers=5862
CREATE OR REPLACE FUNCTION ST_PolyFromText(text)
	RETURNS geometry
	AS '
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1)) = ''ST_Polygon''
	THEN @extschema@.ST_GeomFromText($1)
	ELSE NULL END
	'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **WKT（Well-Known Text）**: 図形を `POLYGON((0 0, 1 0, 1 1, 0 0))` のような文字列で書く標準の形式。
- **多角形（polygon）**: 閉じた輪郭で囲まれた面。穴を持つこともある。
- **`ST_GeometryType`**: 図形の種類を `ST_Polygon` のような名前で返す関数。
- **`ELSE NULL`**: 条件に合わないときの既定の値。

## 何をしているか

### 1. 図形を作り、種類を確かめる

```sql:line-numbers=5865
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1)) = ''ST_Polygon''
```

文字列から図形を作り、種類が `ST_Polygon` かを比べます。

### 2. 多角形のときだけ返す

```sql:line-numbers=5866
	THEN @extschema@.ST_GeomFromText($1)
	ELSE NULL END
```

多角形なら、その図形を返します。違う種類なら `NULL` を返し、面として扱えない値が混ざらないようにします。

## ここがすごい

- **面の種類だけを通す**: 点や線を誤って多角形として使うことを防げます。
- **版の形を揃える**: 点、線、多角形の版は同じ書き方なので、読み手は一つを理解すれば残りも分かります。
- **欠けた値を先に止める**: `STRICT` で `NULL` の入力は、計算の前に結果が決まります。

## まとめ

- 面を表す値は、種類の確認を通してから使うと安全になる。
- 種類ごとの版を同じ形に揃えると、読みやすく保守しやすい。
- 合わない値を `NULL` にする書き方は、後の処理の誤りを防ぐ。
