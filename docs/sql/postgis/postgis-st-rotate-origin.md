---
title: "回す中心の点を指定して図形を回す ST_Rotate（中心の座標版）"
description: "PostGIS の ST_Rotate(geometry, float8, float8, float8)。回転の角度と中心の座標を受け取り、原点をずらしてから回し、元の位置へ戻す行列を ST_Affine に渡す。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [2134, 2138]
function: "ST_Rotate(geometry,float8,float8,float8)"
difficulty: 3
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`ST_Rotate` の中心指定版は、図形を任意の点のまわりに回す関数です。角度に加えて、中心の X と Y の座標を渡します。原点のまわりに回す基本の版と違い、回したい点を自由に決められます。

## コード

```sql:line-numbers=2134
CREATE OR REPLACE FUNCTION ST_Rotate(geometry,float8,float8,float8)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_Affine($1,  cos($2), -sin($2), 0,  sin($2),  cos($2), 0, 0, 0, 1,	$3 - cos($2) * $3 + sin($2) * $4, $4 - sin($2) * $3 - cos($2) * $4, 0)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_LOW;
```

## 前提知識

- **回転の中心**: 図形が回る軸になる点。原点を使うと、座標は中心からの向きだけで決まる。
- **平行移動と回転の組み合わせ**: 中心を原点へずらし、回し、元の位置へ戻すと、任意の点のまわりの回転になる。
- **`cos` と `sin`**: 角度に対する余弦と正弦。回転の行列の成分になる。
- **`ST_Affine`**: 行列の成分を直接受け取って変換する関数。

## 何をしているか

### 1. 回転の行列を作る

```sql:line-numbers=2136
	AS 'SELECT @extschema@.ST_Affine($1,  cos($2), -sin($2), 0,  sin($2),  cos($2), 0, 0, 0, 1,	$3 - cos($2) * $3 + sin($2) * $4, $4 - sin($2) * $3 - cos($2) * $4, 0)'
```

回転の成分は、角度の `cos` と `sin` で作ります。X と Y の平面の中で回す行列です。

### 2. 中心のずれを平行移動で補う

```sql:line-numbers=2136
	AS 'SELECT @extschema@.ST_Affine($1,  cos($2), -sin($2), 0,  sin($2),  cos($2), 0, 0, 0, 1,	$3 - cos($2) * $3 + sin($2) * $4, $4 - sin($2) * $3 - cos($2) * $4, 0)'
```

行列の平行移動の成分に、`$3 - cos($2) * $3` のような項があります。これは中心の点を動かさないように、回転による位置のずれを打ち消す量です。もう一つの項も同じ考え方で、Y の方向のずれを補います。

### 3. 関数の呼び出しを確かめる

```sql:line-numbers=2137
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_LOW;
```

結果は `ST_Affine` の 1 回の呼び出しで得られます。回転と平行移動を別々に呼ぶ必要はなく、一度の計算にまとめられています。

## ここがすごい

- **一つの式で中心を決められる**: 利用者は中心の座標を渡すだけで、回転の計算を気にせずに済みます。
- **行列の中に平行移動が入っている**: 中心を動かさないという要求を、行列の成分として一度に表しています。
- **原点版と並べて読める**: 同じ角度の回転でも、中心が原点なら、この中心指定版の式の該当部分が 0 になります。

## まとめ

- 任意の点のまわりの回転は、平行移動と回転を組み合わせた行列で表せる。
- 中心を動かさないための補正は、行列の成分として書ける。
- 原点版と比べると、式のどの部分が中心の指定に対応するかがはっきりする。
