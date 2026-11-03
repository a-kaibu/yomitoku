---
title: "文字列が点のときだけ、座標系の番号付きで図形にする ST_PointFromText（番号版）"
description: "PostGIS の ST_PointFromText(text, integer)。WKT の文字列と座標系の番号から図形を作り、型が点（ST_Point）のときだけ返し、それ以外は NULL にする。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5829, 5837]
function: "ST_PointFromText(text, integer)"
difficulty: 2
tags: [型システム, 防御的プログラミング]
format: 2
---

## ひとことで

この `ST_PointFromText` は、WKT の文字列から点を作るときに、座標系の番号も一緒に指定できる版です。前の記事の版と同じく、文字列が点でなければ `NULL` を返します。番号を付けておくと、後の変換や比較で座標系の取り違えを防げます。

## コード

```sql:line-numbers=5829
CREATE OR REPLACE FUNCTION ST_PointFromText(text, integer)
	RETURNS geometry
	AS '
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1, $2)) = ''ST_Point''
	THEN @extschema@.ST_GeomFromText($1, $2)
	ELSE NULL END
	'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **WKT（Well-Known Text）**: 図形を `POINT(1 2)` のような文字列で書く標準の形式。
- **座標系の番号（SRID）**: 図形がどの座標系で書かれているかを表す番号。`spatial_ref_sys` の表に登録されている。
- **`ST_GeomFromText(text, integer)`**: 文字列と番号から図形を作る関数。
- **`ST_GeometryType`**: 図形の種類を `ST_Point` のような名前で返す関数。

## 何をしているか

### 1. 番号付きで図形を作り、種類を確かめる

```sql:line-numbers=5832
	SELECT CASE WHEN @extschema@.ST_GeometryType(@extschema@.ST_GeomFromText($1, $2)) = ''ST_Point''
```

文字列と番号から図形を作り、その種類が `ST_Point` かを比べます。番号は、そのまま図形に付けられます。

### 2. 点のときだけ返す

```sql:line-numbers=5833
	THEN @extschema@.ST_GeomFromText($1, $2)
	ELSE NULL END
```

種類が点なら図形を返し、それ以外は `ELSE NULL` で `NULL` を返します。線や多角形が点として扱われることを防いでいます。

### 3. 性質を確かめる

```sql:line-numbers=5836
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

`STRICT` で `NULL` の入力は弾かれ、`IMMUTABLE` で同じ入力には同じ結果が返ることが分かります。

## ここがすごい

- **座標系を一緒に持たせる**: 番号が図形に付くので、後の処理で座標系を取り違える心配が減ります。
- **型で値を選別する**: 文字列の形が正しくても、目的の種類でなければ返さないので、誤りが混ざりません。
- **番号の有無で版を分ける**: 番号を省く版と同じ考え方を、番号付きの版でも揃えています。

## まとめ

- 座標系の番号は、図形と一緒に持たせると取り違えを防げる。
- 種類を確かめてから返すと、目的と違う値が流れ込まない。
- 同じ考え方の版を並べると、どれを使えばよいかが読み手に伝わる。
