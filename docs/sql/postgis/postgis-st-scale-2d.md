---
title: "2 方向の拡大率で図形を広げる ST_Scale（2 つの拡大率版）"
description: "PostGIS の ST_Scale(geometry, float8, float8)。X と Y の拡大率を受け取り、Z の拡大率を 1 として 4 つの引数版の ST_Scale を呼ぶ。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [2205, 2209]
function: "ST_Scale(geometry,float8,float8)"
difficulty: 2
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`ST_Scale` は、図形を拡大または縮小する関数です。この版は、X と Y の拡大率の二つだけを渡せます。Z の拡大率は 1 として、三つ目の値を省いた形で書けるようにしています。平面の図形を扱うときは、Z の拡大率を気にせず、X と Y の倍率だけを渡せば十分です。拡大の中心は原点なので、図形の位置も一緒に倍率で動く点に注意してください。二つの倍率が同じなら、図形は相似のまま大きくなったり小さくなったりします。

## コード

```sql:line-numbers=2205
CREATE OR REPLACE FUNCTION ST_Scale(geometry,float8,float8)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_Scale($1, $2, $3, 1)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_LOW;
```

## 前提知識

- **拡大率（scale factor）**: 元の大きさに掛ける倍率。2 なら二倍、0.5 なら半分。
- **拡大の基準点**: 拡大の中心になる点。原点から拡大するとき、座標は倍率だけ広がる。
- **引数の省略版**: 同じ関数の呼び出しを、既定の値を補って短く書けるようにしたもの。
- **`_COST_LOW`**: 計算が軽いことを表す指定。

## 何をしているか

### 1. Z の拡大率を 1 として補う

```sql:line-numbers=2207
	AS 'SELECT @extschema@.ST_Scale($1, $2, $3, 1)'
```

二つの拡大率を受け取り、Z の拡大率に 1 を入れて、四つの引数の版を呼びます。Z の値は変わりません。

## ここがすごい

- **よく使う形を短く書ける**: 平面の図形では、Z の拡大率を書く必要がありません。
- **既定の値を一か所で決める**: 「1 なら変わらない」という既定を、この版の中だけに書いています。
- **上位の版に処理を任せる**: 実際の拡大は四つの引数の版が行い、この関数は引数を補うだけです。

## まとめ

- 省略できる引数は、既定の値を補って上位の版を呼ぶと書きやすい。
- 拡大率の 1 は、変化を起こさない値として既定にできる。
- 既存の版に処理を任せると、計算の仕組みが一箇所にまとまる。
