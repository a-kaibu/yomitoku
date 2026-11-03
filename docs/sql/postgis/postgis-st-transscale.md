---
title: "移動と拡大を一度に行う ST_Transscale"
description: "PostGIS の ST_Transscale(geometry, float8, float8, float8, float8)。移動量に拡大率を掛けた値を平行移動に使い、ST_Affine で移動と拡大をまとめて行う。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [2212, 2217]
function: "ST_Transscale(geometry,float8,float8,float8,float8)"
difficulty: 3
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`ST_Transscale` は、図形の移動と拡大を一つの関数で行います。移動量と拡大率の四つの値を渡すと、拡大してから移動するのではなく、移動してから拡大する結果が得られます。

## コード

```sql:line-numbers=2212
CREATE OR REPLACE FUNCTION ST_Transscale(geometry,float8,float8,float8,float8)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_Affine($1,  $4, 0, 0,  0, $5, 0,
		0, 0, 1,  $2 * $4, $3 * $5, 0)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_LOW;
```

## 前提知識

- **平行移動と拡大の順序**: 先に移動するか、先に拡大するかで、結果が変わる。
- **行列の掛け算**: 拡大の行列と、移動の成分を組み合わせて、一度の変換にまとめられる。
- **`ST_Affine`**: 行列の成分を直接受け取って変換する関数。
- **`_COST_LOW`**: 計算が軽いことを表す指定。

## 何をしているか

### 1. 拡大率を行列の対角に入れ、移動量に掛ける

```sql:line-numbers=2214
	AS 'SELECT @extschema@.ST_Affine($1,  $4, 0, 0,  0, $5, 0,
		0, 0, 1,  $2 * $4, $3 * $5, 0)'
```

拡大率 `$4` と `$5` は、行列の対角の成分に入ります。移動量の `$2` と `$3` には、それぞれの拡大率を掛けた値を使います。

### 2. 式を読み直す

```sql:line-numbers=2214
	AS 'SELECT @extschema@.ST_Affine($1,  $4, 0, 0,  0, $5, 0,
		0, 0, 1,  $2 * $4, $3 * $5, 0)'
```

移動量に拡大率を掛けるのは、`(x + dx) × fx` と同じ結果を一度の変換で出すためです。先に移動してから拡大するという順序が、式の中に組み込まれています。

## ここがすごい

- **変換を一度で済ませる**: 移動と拡大を別々に呼ぶ代わりに、一つの行列にまとめています。
- **順序の違いを式で表す**: 移動量に倍率を掛けることで、望む順序の結果を得ています。
- **小さな式で読める**: 行列の成分を並べるだけなので、結果の意味を追いやすくなっています。

## まとめ

- 移動と拡大は、一つの行列にまとめると一度の計算で済む。
- 順序の違いは、移動量に倍率を掛けるという形で式に表せる。
- 複数の変換を組み合わせるときは、順序を式で確かめると誤りが減る。
