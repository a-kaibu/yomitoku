---
title: "GML の文字列から図形を作る ST_GeomFromGML"
description: "PostGIS の ST_GeomFromGML(text)。GML 形式の文字列を、内部の _ST_GeomFromGML に渡し、座標系の番号を 0 として図形に変換する。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5090, 5094]
function: "ST_GeomFromGML(text)"
difficulty: 2
tags: [パース, 文字列処理]
format: 2
---

## ひとことで

`ST_GeomFromGML` は、GML という形式で書かれた文字列から図形を作る関数です。GML は、地理情報を XML の形で書くための規格です。この関数は、その文字列を読んで geometry の値にします。

## コード

```sql:line-numbers=5090
CREATE OR REPLACE FUNCTION ST_GeomFromGML(text)
	RETURNS geometry
	AS 'SELECT @extschema@._ST_GeomFromGML($1, 0)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **GML（Geography Markup Language）**: 地理情報を XML で表す規格。
- **XML**: タグで囲んで情報を書く形式。
- **座標系の番号（SRID）**: 図形がどの座標系で書かれているかを表す番号。0 は未指定を表す。
- **`_COST_MEDIUM`**: 計算の重さの目安を、計画に伝える指定。

## 何をしているか

### 1. 内部の関数を呼ぶ

```sql:line-numbers=5092
	AS 'SELECT @extschema@._ST_GeomFromGML($1, 0)'
```

文字列と、座標系の番号 0 を、内部の `_ST_GeomFromGML` に渡します。実際の読み取りは、内部の関数が行います。

### 2. 別の名前で同じことをする

```sql:line-numbers=5097
CREATE OR REPLACE FUNCTION ST_GMLToSQL(text)
	RETURNS geometry
	AS 'SELECT @extschema@._ST_GeomFromGML($1, 0)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
```

`ST_GMLToSQL` は、同じ内部関数を同じ引数で呼びます。古い名前の関数を残すための、別名の関数です。

## ここがすごい

- **読み取りを一か所にまとめる**: 関数の名前が違っても、中身は同じ内部の関数に任せています。
- **未指定の座標系を明示する**: 番号 0 を渡すことで、座標系が決まっていないことを示せます。
- **古い名前を残す**: 別名を並べて、古いアプリケーションも壊さずに使えるようにしています。

## まとめ

- 同じ処理の別名は、内部の関数に任せて重複を避ける。
- 座標系が未指定のときは、番号 0 を明示する。
- 古い名前は、新しい名前と同じ中身の関数で残すと保守しやすい。
