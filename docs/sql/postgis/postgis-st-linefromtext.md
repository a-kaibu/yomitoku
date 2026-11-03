---
title: "文字列が線のときだけ図形にする ST_LineFromText"
description: "PostGIS の ST_LineFromText(text)。WKT の文字列から図形を作り、型が線（ST_LineString）のときだけ返し、それ以外は NULL にする。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5840, 5848]
function: "ST_LineFromText(text)"
difficulty: 2
tags: [型システム, 防御的プログラミング]
format: 2
---

## ひとことで

`ST_LineFromText` は、WKT の文字列から線を作る関数です。文字列が点や多角形を表しているときは、線として扱わずに `NULL` を返します。前の記事の `ST_PointFromText` と同じ考え方で、型を確かめてから値を返します。

## コード

```sql:line-numbers=5840
CREATE OR REPLACE FUNCTION ST_LineFromText(text)
	RETURNS geometry
	AS '
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1)) = ''ST_LineString''
	THEN @extschema@.ST_GeomFromText($1)
	ELSE NULL END
	'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **WKT（Well-Known Text）**: 図形を `LINESTRING(0 0, 1 1)` のような文字列で書く標準の形式。
- **`ST_GeomFromText`**: WKT の文字列から図形を作る関数。
- **`ST_GeometryType`**: 図形の種類を `ST_LineString` のような名前で返す関数。
- **`CASE ... ELSE NULL`**: 条件に合わないときに `NULL` を返す書き方。

## 何をしているか

### 1. 図形の種類を確かめる

```sql:line-numbers=5843
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1)) = ''ST_LineString''
```

文字列から図形を作り、その種類が `ST_LineString` かを確かめます。文字列の中の `''` は、SQL の文字列の中の引用符です。

### 2. 線のときだけ値を返す

```sql:line-numbers=5844
	THEN @extschema@.ST_GeomFromText($1)
	ELSE NULL END
```

種類が線なら図形を返し、それ以外は `ELSE NULL` で `NULL` を返します。誤った種類の値が後の処理に流れないようにしています。

## ここがすごい

- **種類で値を選ぶ**: 文字列の形式が正しくても、目的と違う種類は返さないので、後の処理が誤りません。
- **同じ書き方を種類ごとに揃える**: 点、線、多角形の版が同じ形なので、一つを読めば残りも分かります。
- **欠けた値を先に弾く**: `STRICT` で `NULL` の入力は計算せずに返します。

## まとめ

- 文字列から作った図形は、種類を確かめてから返すと安全になる。
- 同じ形の関数を種類ごとに揃えると、覚える量が減る。
- 条件に合わない値は `NULL` にすると、誤りが混ざらない。
