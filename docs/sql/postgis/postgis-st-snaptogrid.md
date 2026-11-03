---
title: "格子の大きさだけで図形を丸める ST_SnapToGrid"
description: "PostGIS の ST_SnapToGrid(geometry, float8)。格子の原点を 0 にして、X と Y の大きさを同じ値にする。5 引数の版を呼ぶ 2 つの薄い関数の組み。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [3788, 3791]
function: "ST_SnapToGrid(geometry, float8)"
difficulty: 2
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`ST_SnapToGrid` は、図形の座標を、格子（一定の間隔の点）に吸着させる関数です。座標の小数の細かさを減らしたいときや、わずかなずれを揃えたいときに使います。格子の大きさだけを渡す版と、X と Y の大きさを別々に渡す版があります。

## コード

```sql:line-numbers=3788
CREATE OR REPLACE FUNCTION ST_SnapToGrid(geometry, float8, float8)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_SnapToGrid($1, 0, 0, $2, $3)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
```

## 前提知識

- **格子（グリッド）**: 座標を一定の間隔で区切った目盛り。
- **スナップ**: 座標を、一番近い格子の点に動かすこと。
- **原点（オフセット）**: 格子の目盛りの基準になる位置。
- **`float8`**: 倍精度の小数。格子の大きさや座標に使う。
- **関数の多重定義**: 同じ名前で、引数の数や型の違う関数を並べること。

## 何をしているか

### 1. 3 引数の版を、原点 0 で呼ぶ

最初の定義は、格子の原点を `0, 0` にして、X と Y の大きさを別々に渡す版（5 引数の本体）を呼びます。

```sql:line-numbers=3788
CREATE OR REPLACE FUNCTION ST_SnapToGrid(geometry, float8, float8)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_SnapToGrid($1, 0, 0, $2, $3)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
```

### 2. 1 引数の大きさの版は、X と Y を同じ値にする

大きさを 1 つだけ渡す版は、同じ 5 引数の本体に、X と Y の両方として同じ値を渡します。

```sql:line-numbers=3796
CREATE OR REPLACE FUNCTION ST_SnapToGrid(geometry, float8)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_SnapToGrid($1, 0, 0, $2, $2)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
```

どちらの版も、本体は同じ関数に任せています。違いは、引数をどう並べるかだけです。

## ここがすごい

- **少ない引数で、よくある使い方を書ける**: 格子が正方形なら、大きさを 1 つ渡すだけで済みます。
- **原点を 0 に固定して、規則を揃える**: 原点の指定を省けるように、既定の 0 を本体に渡しています。
- **本体を共有する**: どの版も 5 引数の関数を呼ぶので、丸めのロジックは 1 か所で変えられます。
- **トレードオフ**: 原点を 0 にすると、格子の目盛りが、データの中心とずれることがあります。原点を変えたい場合は、5 引数の版を直接使う必要があります。

## まとめ

- 引数の少ない版は、よく使う形の既定値を入れた薄い関数として書ける。
- 丸めの処理は、1 つの本体に集めると、版が増えても一貫性が保てる。
- 原点や大きさの意味は、関数の名前や引数の並びから分かるように書く。
