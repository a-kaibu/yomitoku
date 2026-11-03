---
title: "GeoHash の文字列から図形を作る ST_GeomFromGeoHash"
description: "PostGIS の ST_GeomFromGeoHash(text, integer)。GeoHash の文字列を箱に変換し、その箱を geometry の型に変えて返す。精度を省くと文字列の長さから決まる。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5624, 5628]
function: "ST_GeomFromGeoHash(text, integer DEFAULT NULL)"
difficulty: 2
tags: [文字列処理, 数値計算]
format: 2
---

## ひとことで

`ST_GeomFromGeoHash` は、GeoHash という文字列から、その範囲を表す図形を作る関数です。GeoHash は、地球上の位置を短い英数字の並びで表す方式です。文字列が長いほど、範囲は細かくなります。

## コード

```sql:line-numbers=5624
CREATE OR REPLACE FUNCTION ST_GeomFromGeoHash(text, integer DEFAULT NULL)
	RETURNS geometry
	AS $$ SELECT CAST(@extschema@.ST_Box2dFromGeoHash($1, $2) AS @extschema@.geometry); $$
	LANGUAGE 'sql' IMMUTABLE PARALLEL SAFE
	_COST_LOW;
```

## 前提知識

- **GeoHash**: 緯度と経度を、一つの文字列にまとめる方式。前の文字ほど大きな範囲を表し、後ろの文字ほど細かい範囲を表す。
- **精度（precision）**: 文字列のうち、何文字を使って範囲を決めるかの値。省くと、文字列の全体を使う。
- **`ST_Box2dFromGeoHash`**: GeoHash から、箱（box2d）を作る内部の関数。
- **`CAST(... AS geometry)`**: 箱を geometry の型に変える指定。

## 何をしているか

### 1. GeoHash から箱を作る

```sql:line-numbers=5626
	AS $$ SELECT CAST(@extschema@.ST_Box2dFromGeoHash($1, $2) AS @extschema@.geometry); $$
```

`ST_Box2dFromGeoHash` に、文字列と精度を渡して、その範囲の箱を作ります。精度が `NULL` のときは、文字列全体が使われます。

### 2. 箱を図形に変える

```sql:line-numbers=5626
	AS $$ SELECT CAST(@extschema@.ST_Box2dFromGeoHash($1, $2) AS @extschema@.geometry); $$
```

作った箱を `CAST` で `geometry` の型に変えて返します。箱は四角形の図形として扱えるようになります。

## ここがすごい

- **短い文字列で範囲を表せる**: 位置の情報を、一行の文字列で持ち運べます。
- **精度を引数で変えられる**: 同じ文字列でも、どこまで細かく見るかを利用者が選べます。
- **内部の関数を組み合わせる**: 範囲の計算は GeoHash の関数に任せ、この関数は型を変えるだけです。

## まとめ

- 位置の範囲は、短い文字列に詰めると扱いやすい。
- 精度を選べると、同じ値を粗くも細かくも見られる。
- 変換の段階を分けると、各関数の役割が明確になる。
