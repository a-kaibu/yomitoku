---
title: "文字列が点のときだけ図形にする ST_PointFromText"
description: "PostGIS の ST_PointFromText(text)。WKT の文字列を図形にし、その型が点（ST_Point）のときだけ返し、それ以外は NULL にする。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5817, 5825]
function: "ST_PointFromText(text)"
difficulty: 2
tags: [型システム, 防御的プログラミング]
format: 2
---

## ひとことで

`ST_PointFromText` は、WKT という文字列の形式から点を作る関数です。ただし、文字列が点ではなく線や多角形を表しているときは、作らずに `NULL` を返します。型を確かめてから値を返す、安全な作り方の例です。

## コード

```sql:line-numbers=5817
CREATE OR REPLACE FUNCTION ST_PointFromText(text)
	RETURNS geometry
	AS '
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1)) = ''ST_Point''
	THEN @extschema@.ST_GeomFromText($1)
	ELSE NULL END
	'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **WKT（Well-Known Text）**: 図形を `POINT(1 2)` のような文字列で書く標準の形式。
- **`ST_GeomFromText`**: WKT の文字列から図形を作る関数。
- **`ST_GeometryType`**: 図形の種類を `ST_Point` のような名前で返す関数。
- **`CASE ... ELSE NULL`**: 条件に合わないときに `NULL` を返す書き方。

## 何をしているか

### 1. 図形を作り、型を確かめる

```sql:line-numbers=5820
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1)) = ''ST_Point''
```

まず `ST_GeomFromText` で図形を作り、その型が `ST_Point` かを確かめます。文字列の中に `''` と書かれているのは、SQL の文字列の中の引用符です。

### 2. 点のときだけ図形を返す

```sql:line-numbers=5821
	THEN @extschema@.ST_GeomFromText($1)
	ELSE NULL END
```

型が点なら、同じ図形を返します。それ以外のときは `ELSE NULL` で `NULL` を返し、線や多角形を点として扱うことを防ぎます。

## ここがすごい

- **型で値を選別する**: 文字列の形が正しくても、目的の種類でなければ値を返さないので、後の処理が誤らないようにしています。
- **同じ変換を二度書く**: 型の確認と返す値で同じ変換を使うため、コストは高めです。その点は、コメントで書かれた改善の課題として残されています。
- **引数の数で版を分ける**: 座標系の番号を取る版も、同じ形で用意されています。

## まとめ

- 文字列から作った値は、型を確かめてから返すと安全になる。
- 条件に合わないときは `NULL` を返すと、誤った型の値が混ざらない。
- 同じ変換を繰り返す書き方は、効率の面で改善の余地がある。
