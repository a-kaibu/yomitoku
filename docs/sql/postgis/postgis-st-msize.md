---
title: "図形の M 値の幅を、最大と最小の差で求める ST_MSize"
description: "PostGIS の ST_MSize(geometry)。図形の M 値（測定値の座標）の最大と最小の差を求める。3.7.0 で追加された、ST_XSize などと同じ形の関数。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [1244, 1248]
function: "ST_MSize(geometry)"
difficulty: 2
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`ST_MSize` は、図形の M 値の幅を返す関数です。M は、位置とは別に、距離や時刻などの測定値を持たせるための座標です。M の最大と最小の差は、その測定値の範囲を表します。

## コード

```sql:line-numbers=1244
CREATE OR REPLACE FUNCTION ST_MSize(geometry)
	RETURNS FLOAT8
	AS 'SELECT @extschema@.ST_MMax($1) - @extschema@.ST_MMin($1)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_DEFAULT;
```

## 前提知識

- **M 座標**: 位置の X、Y、Z と並べて、測定値を一つ持たせる座標。道のりや時刻などに使う。
- **`ST_MMin` と `ST_MMax`**: 図形の M の最小と最大を取り出す関数。C 言語で書かれている。
- **`geometry` 型**: PostGIS の図形を表す型。
- **箱（box）との違い**: `ST_XSize` などは箱を引数に取るが、この関数は図形そのものを受け取る。

## 何をしているか

### 1. M の最大と最小を取り出す

```sql:line-numbers=1246
	AS 'SELECT @extschema@.ST_MMax($1) - @extschema@.ST_MMin($1)'
```

`ST_MMax` と `ST_MMin` で、図形の M 値の最大と最小を取り出し、その差を返します。

## ここがすごい

- **測定値の範囲を一行で出す**: 移動の道のりや時刻の幅を、差として直接得られます。
- **箱の関数と同じ書き方**: 箱を扱う `ST_XSize` などと同じ形で揃えているので、覚えやすくなっています。
- **C の関数の結果を組み合わせる**: 実際の取り出しは C の関数が行い、この関数は差を取るだけです。

## まとめ

- 測定値の範囲は、最大と最小の差として求められる。
- 同じ形の関数を型ごとに用意すると、利用者が迷わない。
- 重い取り出しは内部の関数に任せ、公開の関数は組み合わせを担当する。
