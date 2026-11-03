---
title: "図形を Z 軸のまわりに回す ST_RotateZ"
description: "PostGIS の ST_RotateZ(geometry, float8)。Z 軸のまわりの回転を、既存の ST_Rotate（角度だけを受け取る版）に任せて呼び出す薄い関数。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [2148, 2152]
function: "ST_RotateZ(geometry, float8)"
difficulty: 1
tags: [数値計算, 設計パターン]
format: 2
---

## ひとことで

`ST_RotateZ` は、図形を Z 軸のまわりに回転させる関数です。平面の図形を回すときによく使われます。中身は、角度だけを受け取る `ST_Rotate` を呼ぶだけの、短い関数です。平面の図形を原点のまわりに回すときは、この関数を使えば、回転の行列を自分で書く必要がありません。地図や図面のように、高さを変えずに向きだけを変えたい場面で、ほかの軸の回転と区別して使えます。回す角度はラジアンで渡すので、度で考えている場合は、事前に変換しておく必要があります。

## コード

```sql:line-numbers=2148
CREATE OR REPLACE FUNCTION ST_RotateZ(geometry,float8)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_Rotate($1, $2)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_LOW;
```

## 前提知識

- **Z 軸まわりの回転**: 上から見た平面の中で、図形を回す変換。
- **`ST_Rotate`**: 角度だけで平面の回転を行う関数。
- **薄いラッパー**: 別の関数を、名前を変えて呼ぶだけの関数。
- **ラジアン**: 角度の単位。

## 何をしているか

### 1. 既存の回転を呼ぶ

```sql:line-numbers=2150
	AS 'SELECT @extschema@.ST_Rotate($1, $2)'
```

図形と角度を、そのまま `ST_Rotate` に渡します。回転の計算は、その関数に任せています。

## ここがすごい

- **同じ計算を一つにまとめる**: 平面の回転の計算は `ST_Rotate` だけにあり、この関数はそれを軸の名前で呼び直しているだけです。
- **軸の名前で意図が伝わる**: X、Y、Z の軸ごとに関数名があるので、利用者は回す軸を名前で選べます。
- **中身が短く、直しやすい**: 呼ぶ先が一つなので、回転の仕組みを変えるときも、直す場所は一か所だけです。

## まとめ

- 関数の名前を揃えると、同じ処理でも利用者には分かりやすくなる。
- 薄いラッパーは、既存の関数を呼ぶだけにすると重複が無くなる。
- 計算の本体を一つに保つと、保守の手間が減る。
