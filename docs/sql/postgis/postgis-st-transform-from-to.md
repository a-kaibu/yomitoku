---
title: "投影法を指定して座標を変換する ST_Transform（2 つの投影法版）"
description: "PostGIS の ST_Transform(geom, from_proj, to_proj)。変換元と変換先の投影法を文字列の PROJ で直接指定し、spatial_ref_sys の表を引かずに座標を変換する。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [3144, 3148]
function: "ST_Transform(geom geometry, from_proj text, to_proj text)"
difficulty: 3
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`ST_Transform` は、図形の座標を別の座標系に変換する関数です。この版では、変換元と変換先の投影法を、PROJ という文字列で直接指定します。図形に座標系の番号（SRID）が付いていなくても変換できます。

## コード

```sql:line-numbers=3144
CREATE OR REPLACE FUNCTION ST_Transform(geom geometry, from_proj text, to_proj text)
	RETURNS geometry AS
	'SELECT @extschema@.postgis_transform_geometry($1, $2, $3, 0)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_HIGH;
```

## 前提知識

- **座標系（投影法）**: 地球の表面を平面の座標に写す決まり。地域や用途で使い分ける。
- **PROJ**: 座標変換のための代表的なライブラリ。投影法を `+proj=...` のような文字列で書く。
- **SRID**: 座標系を番号で表したもの。`spatial_ref_sys` の表に登録されている。
- **`postgis_transform_geometry`**: 実際の変換を行う内部の関数。

## 何をしているか

### 1. 変換元と変換先の投影法を受け取る

```sql:line-numbers=3145
	RETURNS geometry AS
	'SELECT @extschema@.postgis_transform_geometry($1, $2, $3, 0)'
```

`from_proj` と `to_proj` の文字列を、そのまま内部の変換関数に渡します。ここでは表を引かず、利用者が書いた投影法をそのまま使います。

### 2. 他の版との違いを見る

```sql:line-numbers=3147
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_HIGH;
```

変換の設定は `STRICT` と `IMMUTABLE` で示され、NULL の入力には計算しません。変換の重さは `_COST_HIGH` で示され、クエリの計画で重い処理として扱われます。

## ここがすごい

- **番号が無い座標系も扱える**: `spatial_ref_sys` に登録されていない投影法でも、文字列で指定すれば変換できます。
- **表を引く版と並べて使える**: 変換元を番号で指定する版と、文字列で指定する版を、用途で選べます。
- **重さをはっきり示す**: コストの指定で、計画の段階に変換の重さを伝えています。

## まとめ

- 座標変換は、投影法の文字列を直接渡して実行できる。
- 番号で管理する方法と、文字列で指定する方法は、用途で使い分ける。
- 重い処理は、コストの指定で計画に伝えると、遅さの原因を読みやすくなる。
