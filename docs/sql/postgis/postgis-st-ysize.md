---
title: "箱の高さを、最大と最小の差で求める ST_YSize"
description: "PostGIS の ST_YSize(box3d)。3 次元の箱の Y 方向の幅を、YMax から YMin を引いて求める。ST_XSize と同じ形の関数。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [1216, 1220]
function: "ST_YSize(box3d)"
difficulty: 1
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`ST_YSize` は、3 次元の箱（box3d）の Y 方向の幅を返す関数です。図形の大きさを縦方向で知りたいときに使います。中身は、Y の最大値から最小値を引くだけです。箱はすでに図形の外側を囲んだ値なので、この関数は箱の情報を読み直すだけで答えを出します。地図上の図形がどれくらい南北に広がっているかを確かめたいときは、この幅の値がそのまま答えになります。箱を一度求めておけば、同じ箱から何度でも高さを取り出せるので、繰り返しの計算にも向いています。

## コード

```sql:line-numbers=1216
CREATE OR REPLACE FUNCTION ST_YSize(box3d)
	RETURNS FLOAT8
	AS 'SELECT @extschema@.ST_YMax($1) - @extschema@.ST_YMin($1)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_DEFAULT;
```

## 前提知識

- **box3d**: 図形を囲む、3 次元の直方体。各方向の最小と最大を持つ。
- **Y 方向**: 座標の縦の方向。
- **`FLOAT8`**: 倍精度の小数の型。幅の値は小数で返る。
- **`_COST_DEFAULT`**: 計算の重さの目安を、計画に伝える指定。

## 何をしているか

### 1. 最大と最小の差を取る

```sql:line-numbers=1218
	AS 'SELECT @extschema@.ST_YMax($1) - @extschema@.ST_YMin($1)'
```

`ST_YMax` と `ST_YMin` を呼び、差を取ります。どちらも、別の関数で箱から取り出した値です。

## ここがすごい

- **既存の関数だけで作る**: 新しい計算を書かず、最大と最小の関数を組み合わせるだけです。
- **同じ形を三方向で揃える**: `ST_XSize` と `ST_ZSize` も同じ形なので、一つを読めば残りも分かります。
- **`STRICT` で欠けた値を弾く**: 引数に `NULL` があれば、計算せずに `NULL` を返します。

## まとめ

- 幅は、最大から最小を引くだけで求められる。
- 同じ形の関数を方向ごとに揃えると、覚える量が減る。
- 基礎の関数を組み合わせると、新しい関数を小さく書ける。
