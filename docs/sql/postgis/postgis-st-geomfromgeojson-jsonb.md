---
title: "jsonb を文字列に直してから GeoJSON として読む"
description: "PostGIS の ST_GeomFromGeoJson(jsonb)。jsonb の値を ::text で文字列にし、文字列版の ST_GeomFromGeoJson に渡して、GeoJSON から図形を作る。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5163, 5167]
function: "ST_GeomFromGeoJson(jsonb)"
difficulty: 2
tags: [型システム, API設計]
format: 2
---

## ひとことで

`ST_GeomFromGeoJson` は、GeoJSON という形式で書かれた図形の文字列を、PostGIS の図形に変換する関数です。`jsonb` の型で受け取れる版は、値を一度文字列に直してから、文字列の版をそのまま呼び出します。

## コード

```sql:line-numbers=5163
CREATE OR REPLACE FUNCTION ST_GeomFromGeoJson(jsonb)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_GeomFromGeoJson($1::text)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **GeoJSON**: 地理的な図形を JSON の形で書く標準的な形式。`{"type": "Point", "coordinates": [...]}` のように書く。
- **`jsonb`**: 整形されて保存される、PostgreSQL の JSON の型。検索や比較が速い。
- **`json` と `text`**: JSON の値は、文字列として取り出せる。
- **`::text`**: 値を文字列の型に変換する書き方。
- **`IMMUTABLE` と `STRICT`**: 同じ入力には同じ結果を返すこと、`NULL` を返すことを表す宣言。

## 何をしているか

### 1. 型と性質を宣言する

この版は、引数が `jsonb`、戻り値が `geometry` です。同じ入力からは同じ図形ができるので、`IMMUTABLE` と宣言されています。

```sql:line-numbers=5163
CREATE OR REPLACE FUNCTION ST_GeomFromGeoJson(jsonb)
	RETURNS geometry
```

### 2. jsonb を text に変換し、文字列版を呼ぶ

本体は、引数の `$1` を `::text` で文字列にし、文字列を受け取る `ST_GeomFromGeoJson` を呼ぶだけです。

```sql:line-numbers=5165
	AS 'SELECT @extschema@.ST_GeomFromGeoJson($1::text)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
```

`jsonb` から文字列に変えると、JSON の中身は文字列として扱われ、文字列版の変換の処理がそのまま使えます。

## ここがすごい

- **変換の処理を 1 か所に保つ**: 文字列からの変換は 1 つの関数で行い、`jsonb` の版は文字列にするだけです。
- **型の違いを、キャストだけで吸収する**: 新しい処理を書かずに、型の違う入り口を増やせます。
- **利用者の書き方が増える**: 列が `jsonb` でも、そのまま図形に変換できます。
- **トレードオフ**: 文字列に戻すと、`jsonb` の整形された形が使われます。元の文字列の細かな空白などは残りません。図形の意味には影響しません。

## まとめ

- 型の違う入り口は、文字列に直して既存の関数を呼ぶと、少ない定義で増やせる。
- `::text` のキャストは、型の違いを橋渡しする基本の手段。
- 同じ処理の入り口を増やすと、利用する側の型に合わせやすくなる。
