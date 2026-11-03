---
title: "回す中心を点の図形で指定して回す ST_Rotate（点の図形版）"
description: "PostGIS の ST_Rotate(geometry, float8, geometry)。回す中心を点の図形として受け取り、その X と Y の座標を取り出して、中心指定の回転の行列を作る。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [2141, 2145]
function: "ST_Rotate(geometry,float8,geometry)"
difficulty: 3
tags: [数値計算, API設計]
format: 2
---

## ひとことで

この `ST_Rotate` の版は、回転の中心を、座標の数ではなく点の図形で受け取ります。前の記事の中心指定版と同じ働きをしますが、中心を別の図形から取り出して渡せるので、図形どうしの位置関係を使った回転が書きやすくなります。

## コード

```sql:line-numbers=2141
CREATE OR REPLACE FUNCTION ST_Rotate(geometry,float8,geometry)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_Affine($1,  cos($2), -sin($2), 0,  sin($2),  cos($2), 0, 0, 0, 1, @extschema@.ST_X($3) - cos($2) * @extschema@.ST_X($3) + sin($2) * @extschema@.ST_Y($3), @extschema@.ST_Y($3) - sin($2) * @extschema@.ST_X($3) - cos($2) * @extschema@.ST_Y($3), 0)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_LOW;
```

## 前提知識

- **点の図形（POINT）**: 一つの座標を表す geometry の値。`ST_MakePoint` などで作れる。
- **`ST_X` と `ST_Y`**: 点の図形から、X と Y の座標を取り出す関数。
- **回転の中心**: 図形が回る軸になる点。中心を動かさないように、行列に補正の項が入る。
- **`cos` と `sin`**: 角度に対する余弦と正弦。回転の行列の成分になる。

## 何をしているか

### 1. 中心の座標を点から取り出す

```sql:line-numbers=2143
	AS 'SELECT @extschema@.ST_Affine($1,  cos($2), -sin($2), 0,  sin($2),  cos($2), 0, 0, 0, 1, @extschema@.ST_X($3) - cos($2) * @extschema@.ST_X($3) + sin($2) * @extschema@.ST_Y($3), @extschema@.ST_Y($3) - sin($2) * @extschema@.ST_X($3) - cos($2) * @extschema@.ST_Y($3), 0)'
```

中心の点の図形から、`ST_X` と `ST_Y` で X と Y の座標を取り出します。取り出した値は、そのまま行列の計算に使われます。

### 2. 回転と補正を一つの行列にまとめる

```sql:line-numbers=2143
	AS 'SELECT @extschema@.ST_Affine($1,  cos($2), -sin($2), 0,  sin($2),  cos($2), 0, 0, 0, 1, @extschema@.ST_X($3) - cos($2) * @extschema@.ST_X($3) + sin($2) * @extschema@.ST_Y($3), @extschema@.ST_Y($3) - sin($2) * @extschema@.ST_X($3) - cos($2) * @extschema@.ST_Y($3), 0)'
```

回転の成分は `cos` と `sin` で作り、中心の座標を使った項で、中心が動かないように補正します。すべてを `ST_Affine` の一回の呼び出しに入れています。

### 3. 呼び出しの形を確かめる

```sql:line-numbers=2144
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_LOW;
```

`STRICT` で、どれかの引数が `NULL` なら計算せずに `NULL` を返します。中心の点が無いときも、誤った結果は作られません。

## ここがすごい

- **中心を図形として渡せる**: 別の図形の位置を中心にして回せるので、図形の組み合わせがしやすくなります。
- **座標の取り出しを関数に任せる**: 点から座標を取る処理は既存の関数を使い、この関数は行列の計算だけに集中しています。
- **数の版と図形の版が同じ結果**: 中心の座標が同じなら、数で渡す版と図形で渡す版は、同じ回転になります。

## まとめ

- 中心は、点の図形から座標を取り出して使うと、図形どうしの関係を表しやすい。
- 補正を行列の中に入れると、中心を動かさない回転が一度の計算で得られる。
- 数で渡す版と図形で渡す版は、結果が同じになるように揃えておくと安心して使える。
