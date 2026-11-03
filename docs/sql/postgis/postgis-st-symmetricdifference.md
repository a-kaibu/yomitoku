---
title: "2 つの図形の重ならない部分を求める ST_SymmetricDifference"
description: "PostGIS の ST_SymmetricDifference。ST_SymDifference を、格子の丸めを行わない値 -1.0 を付けて呼ぶ。どちらか一方にだけある部分の図形を返す。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [4075, 4078]
function: "ST_SymmetricDifference(geom1 geometry, geom2 geometry)"
difficulty: 2
tags: [数値計算, 型システム]
format: 2
---

## ひとことで

`ST_SymmetricDifference` は、2 つの図形のうち、どちらか一方だけに含まれる部分を求める関数です。両方に重なっている部分は取り除かれます。集合の対称差（XOR）を、図形の形で計算したものです。

## コード

```sql:line-numbers=4075
CREATE OR REPLACE FUNCTION ST_SymmetricDifference(geom1 geometry, geom2 geometry)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_SymDifference(geom1, geom2, -1.0);'
	LANGUAGE 'sql';
```

## 前提知識

- **対称差**: 2 つの集合の、どちらか一方にだけ含まれる要素の集まり。重なる部分を除く。
- **図形の演算**: 図形どうしの和、差、重なりなどを計算する操作。
- **格子への丸め（grid size）**: 図形の計算の途中で、座標を一定の格子に丸めて、計算を安定させる設定。
- **`LANGUAGE 'sql'`**: 関数の本体を SQL で書く指定。
- **`SELECT ... ;`**: 本体の問い合わせ。ここでは、別の関数を 1 回呼ぶだけ。

## 何をしているか

### 1. 型と本体を宣言する

戻り値は `geometry`、引数は 2 つの図形です。本体は SQL で書かれていて、特別な性質の宣言（`IMMUTABLE` など）は付いていません。

```sql:line-numbers=4075
CREATE OR REPLACE FUNCTION ST_SymmetricDifference(geom1 geometry, geom2 geometry)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_SymDifference(geom1, geom2, -1.0);'
	LANGUAGE 'sql';
```

### 2. 格子の大きさに −1.0 を渡して、対称差を計算する

本体は、`ST_SymDifference` を、2 つの図形と、格子の大きさ `-1.0` で呼び出します。

（`ST_SymDifference` の 3 つ目の引数は格子の大きさです。負の値は、格子への丸めを行わないという指定として使われています。）

## ここがすごい

- **名前を、集合の言葉に合わせる**: 数学の対称差の名前をそのまま関数名にして、利用者が意味を迷わないようにしています。
- **既存の演算の上に薄く乗せる**: 本体は 1 行で、計算そのものは `ST_SymDifference` に任せています。
- **丸めを行わない指定を、既定の値で書く**: 利用者は格子の設定を知らなくても、正確な対称差を得られます。
- **トレードオフ**: 丸めを行わないと、計算が不安定になる図形があります。大きさの違う座標を扱う場合は、丸めの値を変えて計算する版を使う必要があります。

## まとめ

- 集合の演算は、名前をそのまま関数名にすると意味が伝わりやすい。
- 既存の関数に特別な値を渡して、薄い関数として名前を付けられる。
- 数値計算の細かい設定は、既定値として隠すと、利用者の負担を減らせる。
