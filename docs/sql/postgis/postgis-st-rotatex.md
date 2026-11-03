---
title: "図形を X 軸のまわりに回す ST_RotateX"
description: "PostGIS の ST_RotateX(geometry, float8)。X 軸を中心にした回転の行列を cos と sin で作り、ST_Affine に渡して 3 次元の図形を回す。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [2155, 2159]
function: "ST_RotateX(geometry, float8)"
difficulty: 2
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`ST_RotateX` は、図形を X 軸のまわりに回転させる関数です。回転の角度を、ラジアンで渡します。回転の行列は、角度の cos と sin から作られ、`ST_Affine` にまとめて渡されます。

## コード

```sql:line-numbers=2155
CREATE OR REPLACE FUNCTION ST_RotateX(geometry,float8)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_Affine($1, 1, 0, 0, 0, cos($2), -sin($2), 0, sin($2), cos($2), 0, 0, 0)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_LOW;
```

## 前提知識

- **ラジアン**: 角度の単位の一つ。円を一周で 2π とする。
- **`cos` と `sin`**: 角度に対する余弦と正弦。回転の行列の成分になる。
- **X 軸まわりの回転**: X の値は変えず、Y と Z の値だけを回す変換。
- **`ST_Affine`**: 前の記事で見た、行列で変換を表す関数。

## 何をしているか

### 1. 変換の行列を組み立てる

```sql:line-numbers=2157
	AS 'SELECT @extschema@.ST_Affine($1, 1, 0, 0, 0, cos($2), -sin($2), 0, sin($2), cos($2), 0, 0, 0)'
```

`ST_Affine` には、13 個の値が渡されます。一つ目の行は X をそのまま残す `1, 0, 0`、二つ目と三つ目の行は `cos` と `sin` で作られます。

### 2. 回転の行列が正しいかを確かめる

```sql:line-numbers=2157
	AS 'SELECT @extschema@.ST_Affine($1, 1, 0, 0, 0, cos($2), -sin($2), 0, sin($2), cos($2), 0, 0, 0)'
```

二つ目の行の `cos` と `-sin`、三つ目の行の `sin` と `cos` を並べると、Y と Z の値が角度に応じて混ざります。X の列は変わらないので、X 軸のまわりの回転になります。

## ここがすごい

- **1 行で完結する**: 行列の成分を直接書くので、関数の動きを一目で読めます。
- **既存の関数に任せる**: 変換の計算は `ST_Affine` にまかせ、この関数は行列を作るだけです。
- **三つの軸で揃える**: `ST_RotateY` と同じ形で書かれているので、覚えやすくなっています。

## まとめ

- 回転は、角度の `cos` と `sin` を並べた行列で表せる。
- 変換の計算は、共通の関数に任せると重複が無くなる。
- 軸ごとに同じ形の関数を並べると、読み手が理解しやすい。
