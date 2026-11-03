---
title: "図形を 3 方向に平行移動する ST_Translate"
description: "PostGIS の ST_Translate(geometry, float8, float8, float8)。単位行列に移動量を入れた行列を ST_Affine に渡し、図形を X、Y、Z の各方向へずらす。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [2169, 2173]
function: "ST_Translate(geometry,float8,float8,float8)"
difficulty: 1
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`ST_Translate` は、図形を指定した量だけずらす関数です。X、Y、Z の 3 方向の移動量を渡します。拡大や回転を含まず、位置だけを変えるので、いちばん単純な変換です。

## コード

```sql:line-numbers=2169
CREATE OR REPLACE FUNCTION ST_Translate(geometry,float8,float8,float8)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_Affine($1, 1, 0, 0, 0, 1, 0, 0, 0, 1, $2, $3, $4)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_LOW;
```

## 前提知識

- **平行移動**: 図形の形と向きを変えず、位置だけを動かす変換。
- **単位行列**: 対角線だけが 1 で、ほかが 0 の行列。何も変えない変換を表す。
- **移動量**: 元の座標に足す値。座標ごとに別々に決められる。

## 何をしているか

### 1. 単位行列に移動量を入れる

```sql:line-numbers=2171
	AS 'SELECT @extschema@.ST_Affine($1, 1, 0, 0, 0, 1, 0, 0, 0, 1, $2, $3, $4)'
```

`1, 0, 0, 0, 1, 0, 0, 0, 1` の部分が単位行列です。最後の `$2, $3, $4` が、X、Y、Z の移動量です。単位行列のままなので、形は変わりません。

### 2. 2 次元の呼び出しを 3 次元に広げる

```sql:line-numbers=2176
CREATE OR REPLACE FUNCTION ST_Translate(geometry,float8,float8)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_Translate($1, $2, $3, 0)'
```

2 つの値だけを渡す版は、Z の移動量を 0 にして、3 つの値を取る版を呼びます。利用者は、2 次元の図形なら 2 つの値だけで済みます。

## ここがすごい

- **変換の中身を見せる**: 単位行列に移動量を入れるだけなので、平行移動の仕組みが素直に分かります。
- **引数を省ける版を用意する**: 3 次元を使わない人にも、短く書ける形を用意しています。
- **同じ土台を使う**: 変換の計算を `ST_Affine` に任せているので、ほかの変換と計算の方法が揃っています。

## まとめ

- 平行移動は、単位行列の右側に移動量を入れて表せる。
- 省略できる引数の版は、上位の版を呼ぶ形で書くと重複がない。
- 変換は、同じ土台の関数に任せると、結果の扱い方が揃う。
