---
title: "2 次元の図形に高さの値を足す ST_Force3D"
description: "PostGIS の ST_Force3D。2 次元の図形に Z 座標を加える。Z の値を省くと 0.0 が使われ、中身は ST_Force3DZ を呼ぶだけの薄い関数。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [1600, 1604]
function: "ST_Force3D(geom geometry, zvalue float8 default 0.0)"
difficulty: 1
tags: [API設計, 数値計算]
format: 2
---

## ひとことで

`ST_Force3D` は、平面の図形（X と Y だけの座標）に、高さ（Z）の値を付けて 3 次元にする関数です。高さを省略すると `0.0` が使われます。内部では、同じ働きをする `ST_Force3DZ` を呼んでいます。

## コード

```sql:line-numbers=1600
CREATE OR REPLACE FUNCTION ST_Force3D(geom geometry, zvalue float8 default 0.0)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_Force3DZ($1, $2)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_LOW;
```

## 前提知識

- **座標の次元**: 平面の図形は X と Y の 2 次元、高さを含むと X、Y、Z の 3 次元になる。
- **`geometry`**: 点、線、面などの図形を表す PostGIS の型。
- **`default 0.0`**: 引数を省いたときの既定の値を、関数の定義の中で指定する書き方。
- **`float8`**: 倍精度の小数の型。
- **`_COST_LOW`**: 関数を呼ぶときの、計算の重さの見積もりを示す値。プランナーが計画を立てるのに使う。

## 何をしているか

### 1. 既定値付きの引数を定義する

引数は図形と Z の値です。Z の値は `default 0.0` なので、省略すると 0.0 になります。

```sql:line-numbers=1600
CREATE OR REPLACE FUNCTION ST_Force3D(geom geometry, zvalue float8 default 0.0)
	RETURNS geometry
```

### 2. ST_Force3DZ に渡す

本体は、Z の値を付けた 3 次元の図形を作る `ST_Force3DZ` を呼ぶだけです。

```sql:line-numbers=1602
	AS 'SELECT @extschema@.ST_Force3DZ($1, $2)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_LOW;
```

`STRICT` が付いているので、図形が `NULL` なら結果も `NULL` になります。

## ここがすごい

- **既定値で、よくある使い方を短くする**: 高さが不要なときは、図形だけを渡せば 3 次元になります。
- **同じ働きの関数を、名前で分ける**: 「Z を引数で受け取る版」と「既定値を使う版」を分け、利用者が使い分けられます。
- **計算の重さを宣言する**: `_COST_LOW` によって、プランナーがこの関数の計算量を見積もれます。
- **トレードオフ**: 既定の高さは 0.0 なので、本当の高さが分からないデータに使うと、誤った高さで 3 次元化されます。

## まとめ

- 既定値を付けた引数は、よくある使い方を短く書く助けになる。
- 薄いラッパーは、本体の関数を 1 か所に保つのに役立つ。
- 既定値が本当に意味のある値かを、データの性質で確かめる。
