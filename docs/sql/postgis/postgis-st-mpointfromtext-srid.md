---
title: "文字列が複数の点のときだけ、番号付きで図形にする ST_MPointFromText（番号版）"
description: "PostGIS の ST_MPointFromText(text, integer)。WKT の文字列と座標系の番号から図形を作り、型が複数の点（ST_MultiPoint）のときだけ返し、それ以外は NULL にする。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5935, 5943]
function: "ST_MPointFromText(text, integer)"
difficulty: 2
tags: [型システム, 防御的プログラミング]
format: 2
---

## ひとことで

`ST_MPointFromText` は、WKT の文字列から複数の点をまとめた図形を作る関数です。座標系の番号も一緒に指定します。文字列の型がマルチポイントでなければ `NULL` を返し、点の集まりとして扱えない値を除きます。

## コード

```sql:line-numbers=5935
CREATE OR REPLACE FUNCTION ST_MPointFromText(text, integer)
	RETURNS geometry
	AS '
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1, $2)) = ''ST_MultiPoint''
	THEN @extschema@.ST_GeomFromText($1, $2)
	ELSE NULL END
	'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **マルチポイント（MULTIPOINT）**: 複数の点をまとめて一つの図形として扱う型。WKT では `MULTIPOINT(0 0, 1 1)` と書く。
- **座標系の番号（SRID）**: 図形の座標系を表す番号。
- **`ST_GeometryType`**: 図形の種類を `ST_MultiPoint` のような名前で返す関数。
- **`CASE ... ELSE NULL`**: 条件に合わないときに `NULL` を返す書き方。

## 何をしているか

### 1. 番号付きで図形を作り、種類を比べる

```sql:line-numbers=5938
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1, $2)) = ''ST_MultiPoint''
	THEN @extschema@.ST_GeomFromText($1, $2)
```

文字列と番号から図形を作り、種類が `ST_MultiPoint` かを比べます。合えば、番号付きの図形を返します。

### 2. 合わないときは NULL にする

```sql:line-numbers=5940
	ELSE NULL END
	'
```

種類が違うときは `ELSE NULL` で `NULL` を返します。単独の点を、点の集まりとして扱うことを防ぎます。

### 3. 性質を確かめる

```sql:line-numbers=5942
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

`STRICT` で `NULL` の入力は計算されず、`IMMUTABLE` で同じ入力には同じ結果が返ります。

## ここがすごい

- **集まりの型を条件で絞る**: 点の集まりとして使える値だけを通すので、後の処理が安全です。
- **種類と番号を一緒に確かめる**: 二つの条件を一つの関数で扱えます。
- **線や面の版と同じ形**: 同じ書き方で揃っているので、読み手は一つを理解すれば他も読めます。

## まとめ

- 点の集まりは、種類を確かめてから番号を付けて返すと安全になる。
- 版の書き方を揃えると、覚える量が減る。
- 合わない値は `NULL` にして、誤りの広がりを止める。
