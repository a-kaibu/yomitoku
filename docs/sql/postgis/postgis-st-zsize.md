---
title: "箱の奥行きを、最大と最小の差で求める ST_ZSize"
description: "PostGIS の ST_ZSize(box3d)。3 次元の箱の Z 方向の幅を、ZMax から ZMin を引いて求める。ST_YSize と同じ形の関数。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [1223, 1227]
function: "ST_ZSize(box3d)"
difficulty: 1
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`ST_ZSize` は、3 次元の箱（box3d）の Z 方向の幅を返す関数です。Z は高さや標高を表すことが多いので、高さの範囲を知りたいときに使います。箱の中で Z の最大と最小を取り、その差を返すので、図形がどれだけ上下に広がっているかが一つの数で分かります。Z を持たない 2 次元の図形でも、箱を作れば同じ形で値を取り出せます。ほかの方向の幅を求める関数と並べて読むと、箱の仕組みがよく分かります。

## コード

```sql:line-numbers=1223
CREATE OR REPLACE FUNCTION ST_ZSize(box3d)
	RETURNS FLOAT8
	AS 'SELECT @extschema@.ST_ZMax($1) - @extschema@.ST_ZMin($1)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_DEFAULT;
```

## 前提知識

- **Z 座標**: 3 次元の図形の高さや標高を表す座標。
- **`ST_ZMax` と `ST_ZMin`**: 箱の Z 方向の最大と最小を取り出す関数。
- **`FLOAT8`**: 倍精度の小数の型。
- **`IMMUTABLE`**: 同じ入力には、いつも同じ結果を返すという指定。

## 何をしているか

### 1. 最大と最小を取り出して引く

```sql:line-numbers=1225
	AS 'SELECT @extschema@.ST_ZMax($1) - @extschema@.ST_ZMin($1)'
```

Z の最大と最小を別々に取り出し、その差を幅として返します。

## ここがすごい

- **方向ごとに同じ書き方を繰り返す**: X、Y、Z で同じ形なので、読み手は一度理解すれば済みます。
- **既存の部品を再利用する**: 最大と最小の関数は別の場所にあり、この関数はそれを組み合わせるだけです。
- **欠けた値は計算しない**: `STRICT` で、`NULL` の引数は先に弾かれます。

## まとめ

- 方向ごとの幅は、最大と最小の差として統一して書ける。
- 基礎の関数を組み合わせると、読みやすい小さな関数になる。
- 同じ形の関数は、まとめて覚えると効率がよい。
