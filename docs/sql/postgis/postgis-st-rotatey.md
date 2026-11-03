---
title: "図形を Y 軸のまわりに回す ST_RotateY"
description: "PostGIS の ST_RotateY(geometry, float8)。Y 軸を中心にした回転の行列を cos と sin で作り、ST_Affine に渡して 3 次元の図形を回す。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [2162, 2166]
function: "ST_RotateY(geometry, float8)"
difficulty: 2
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`ST_RotateY` は、図形を Y 軸のまわりに回転させる関数です。Y の値はそのままで、X と Z の値が角度に応じて変わります。角度はラジアンで渡します。

## コード

```sql:line-numbers=2162
CREATE OR REPLACE FUNCTION ST_RotateY(geometry,float8)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_Affine($1,  cos($2), 0, sin($2),  0, 1, 0,  -sin($2), 0, cos($2), 0,  0, 0)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_LOW;
```

## 前提知識

- **ラジアン**: 角度の単位の一つ。円を一周で 2π とする。
- **Y 軸まわりの回転**: 高さの軸である Y を保ったまま、水平の方向に回す変換。
- **`cos` と `sin`**: 角度の余弦と正弦。回転の行列の成分になる。
- **`ST_RotateX` との対比**: X 軸のまわりの回転と、同じ仕組みを別の軸で表したもの。

## 何をしているか

### 1. 回転の行列を組み立てる

```sql:line-numbers=2164
	AS 'SELECT @extschema@.ST_Affine($1,  cos($2), 0, sin($2),  0, 1, 0,  -sin($2), 0, cos($2), 0,  0, 0)'
```

行列の一つ目の行は `cos`、`0`、`sin` で、X の値が Z の値と混ざることを表します。二つ目の行は、Y の値をそのまま残す `0, 1, 0` です。

### 2. 三つ目の行で Z を回す

```sql:line-numbers=2164
	AS 'SELECT @extschema@.ST_Affine($1,  cos($2), 0, sin($2),  0, 1, 0,  -sin($2), 0, cos($2), 0,  0, 0)'
```

三つ目の行は、`-sin`、`0`、`cos` です。Z の値が X の値と混ざり、回転の残りの半分を表します。

## ここがすごい

- **軸の違いが一目で分かる**: Y の行が `0, 1, 0` で固定されていることから、Y 軸が回転の軸だと読めます。
- **既存の関数に任せる**: 変換の計算は `ST_Affine` にあり、この関数は行列の作り方だけを担当します。
- **三つの軸で同じ形を保つ**: `ST_RotateX` と並べると、どの成分が動くかの違いだけが残ります。

## まとめ

- 軸ごとの回転は、その軸の行と列を固定した行列で表せる。
- 行列の成分を一つずつ読むと、どの軸が回転の軸かが分かる。
- 同じ形の関数を軸ごとに並べると、覚えやすく比べやすい。
