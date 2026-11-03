---
title: "json 型の GeoJSON から図形を作る ST_GeomFromGeoJson（json 版）"
description: "PostGIS の ST_GeomFromGeoJson(json)。json 型の値を text に変えて、text を受け取る版の ST_GeomFromGeoJson を呼ぶ。jsonb 版と同じ仕組み。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5156, 5160]
function: "ST_GeomFromGeoJson(json)"
difficulty: 2
tags: [パース, 型システム]
format: 2
---

## ひとことで

`ST_GeomFromGeoJson` の json 版は、JSON の形式で書かれた GeoJSON から図形を作ります。JSON の型を text に変えて、文字列を受け取る本体の関数に渡すだけの、薄い関数です。

## コード

```sql:line-numbers=5156
CREATE OR REPLACE FUNCTION ST_GeomFromGeoJson(json)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_GeomFromGeoJson($1::text)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **GeoJSON**: 図形を JSON の形で書く、地理情報の形式。
- **`json` 型と `text` 型**: JSON の値を、そのままの文字として扱うための型。
- **`$1::text`**: 値を `text` 型に変える PostgreSQL のキャストの書き方。
- **版の使い分け**: 同じ名前の関数を、引数の型で分けて用意すること。

## 何をしているか

### 1. json を text に変える

```sql:line-numbers=5158
	AS 'SELECT @extschema@.ST_GeomFromGeoJson($1::text)'
```

引数の `json` 値を、`::text` で文字列に変えます。中身は変わらず、型だけが変わります。

### 2. 本体の版に渡す

```sql:line-numbers=5156
CREATE OR REPLACE FUNCTION ST_GeomFromGeoJson(json)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_GeomFromGeoJson($1::text)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

変えた文字列を、`text` を受け取る `ST_GeomFromGeoJson` に渡します。読み取りの処理は、その本体の関数が行います。

## ここがすごい

- **型ごとの入口を用意する**: 利用者は、手元の値の型に合う版を選ぶだけで済みます。
- **処理を一か所にまとめる**: 読み取りの本体は一つなので、直すときも一か所で済みます。
- **キャストで型を合わせる**: 型の違いを、一つの式で明示的に変えています。

## まとめ

- 型の違う入口は、型を変えて本体の関数へ渡す薄い関数にすると重複がない。
- キャストは、型の違いを読み手に明示する書き方である。
- 同じ処理の入口を増やすときは、本体は一つに保つ。
