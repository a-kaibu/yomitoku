---
title: "文字列が複数の線のときだけ、番号付きで図形にする ST_MLineFromText（番号版）"
description: "PostGIS の ST_MLineFromText(text, integer)。WKT の文字列と座標系の番号から図形を作り、型が複数の線（ST_MultiLineString）のときだけ返し、それ以外は NULL にする。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5898, 5907]
function: "ST_MLineFromText(text, integer)"
difficulty: 2
tags: [型システム, 防御的プログラミング]
format: 2
---

## ひとことで

`ST_MLineFromText` は、WKT の文字列から、複数の線をまとめた図形を作る関数です。座標系の番号も一緒に渡せます。文字列の型が複数の線でなければ `NULL` を返し、線の集まりとして扱えない値を除きます。

## コード

```sql:line-numbers=5898
CREATE OR REPLACE FUNCTION ST_MLineFromText(text, integer)
	RETURNS geometry
	AS '
	SELECT CASE
	WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1, $2)) = ''ST_MultiLineString''
	THEN @extschema@.ST_GeomFromText($1,$2)
	ELSE NULL END
	'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **マルチライン（MULTILINESTRING）**: 複数の線をまとめて一つの図形として扱う型。WKT では `MULTILINESTRING((0 0, 1 1), (2 2, 3 3))` と書く。
- **座標系の番号（SRID）**: 図形の座標系を表す番号。
- **`ST_GeometryType`**: 図形の種類を `ST_MultiLineString` のような名前で返す関数。
- **`CASE ... ELSE NULL`**: 条件に合わないときに `NULL` を返す書き方。

## 何をしているか

### 1. 番号付きで図形を作る

```sql:line-numbers=5901
	SELECT CASE
	WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1, $2)) = ''ST_MultiLineString''
	THEN @extschema@.ST_GeomFromText($1,$2)
```

文字列と番号から図形を作り、その種類が `ST_MultiLineString` かを比べます。条件に合えば、番号付きの図形をそのまま返します。

### 2. 合わないときは NULL にする

```sql:line-numbers=5904
	ELSE NULL END
	'
```

種類が違うときは `ELSE NULL` で `NULL` を返します。単独の線や点を、複数の線として扱うことを防ぎます。

### 3. 性質を揃える

```sql:line-numbers=5906
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

`STRICT` で `NULL` の入力は計算されず、`IMMUTABLE` で同じ入力には同じ結果が返ります。

## ここがすごい

- **種類と座標系を一度に確かめる**: 番号付きの版は、利用者が二つの条件を別々に書かずに済みます。
- **番号付きと番号なしで同じ確かめ方**: 番号を省く版と、確かめの書き方が揃っているので読みやすくなっています。
- **誤った型の流入を止める**: 複数の線として扱えない値は、この段階で `NULL` になります。

## まとめ

- 複数の線の図形は、種類を確かめてから番号を付けて返すと安全になる。
- 同じ確かめ方を版ごとに揃えると、読み手が迷わない。
- 合わない値を `NULL` にすると、後の処理の誤りを防げる。
