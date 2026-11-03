---
title: "回転の行列を ST_Affine に渡して図形を回す"
description: "PostGIS の ST_Rotate(geometry, float8)。角度の cos と sin から 2 次元の回転行列を作り、ST_Affine に渡して原点を中心に図形を回す。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [2127, 2131]
function: "ST_Rotate(geometry, float8)"
difficulty: 3
tags: [数値計算, アルゴリズム]
format: 2
---

## ひとことで

`ST_Rotate` は、図形を原点のまわりに回転させる関数です。角度（ラジアン）から回転の行列を作り、それを一般の変換を行う `ST_Affine` に渡しています。回転の計算を、1 行の式として書いています。

## コード

```sql:line-numbers=2127
CREATE OR REPLACE FUNCTION ST_Rotate(geometry,float8)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_Affine($1,  cos($2), -sin($2), 0,  sin($2), cos($2), 0,  0, 0, 1,  0, 0, 0)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_LOW;
```

## 前提知識

- **ラジアン**: 角度を表す単位。円を一周すると 2π。
- **三角関数 `cos` と `sin`**: 角度に応じて、回転のための係数を決める関数。
- **回転行列**: 2 次元の点を回すための 2×2 の表。`[cos −sin; sin cos]` の形をしている。
- **アフィン変換**: 点を線形に変換し、さらに平行移動する変換。回転、拡大、平行移動を、同じ形で書ける。
- **`float8`**: 倍精度の小数の型。

## 何をしているか

### 1. 角度から、回転の係数を作る

本体は、`ST_Affine` に、回転の係数を 12 個の引数として渡します。最初の 4 つの値が、回転の行列の成分です。

```sql:line-numbers=2129
	AS 'SELECT @extschema@.ST_Affine($1,  cos($2), -sin($2), 0,  sin($2), cos($2), 0,  0, 0, 1,  0, 0, 0)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
```

回転の行列は、`cos($2)` と `−sin($2)`、`sin($2)` と `cos($2)` の並びです。`$2` は角度です。

### 2. 平行移動の部分は 0 にする

行列の後ろの値は、平行移動や、3 次元の成分にあたります。原点のまわりの回転なので、平行移動は 0 です。

```sql:line-numbers=2131
	_COST_LOW;
```

## ここがすごい

- **回転を、行列の一般の形に乗せる**: 回転という特別な処理を書かず、アフィン変換の 1 つの特別な場合として定義しています。
- **原点を中心にするという前提を、数字の 0 で表す**: 移動量の 0 が、「原点のまわり」を意味します。
- **角度の単位に注意する**: `cos` と `sin` はラジアンで計算するので、度で指定すると、結果が想定と違います。
- **トレードオフ**: 中心を原点以外にするには、平行移動を組み合わせる別の定義が必要です。3 引数の版（中心の座標を指定する版）は、そのために用意されています。

## まとめ

- 回転は、cos と sin からなる行列として書ける。
- 特別な変換は、一般の変換の関数に、特別な値を渡す形で表せる。
- 角度の単位（ラジアン）は、関数の仕様として必ず確認する。
