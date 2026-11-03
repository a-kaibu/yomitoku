---
title: "文字列を複数の多角形の図形にする ST_MultiPolygonFromText（番号版）"
description: "PostGIS の ST_MultiPolygonFromText(text, integer)。WKT の文字列と座標系の番号から複数の多角形を作る別名。中身は ST_MPolyFromText を呼ぶだけ。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5986, 5990]
function: "ST_MultiPolygonFromText(text, integer)"
difficulty: 2
tags: [API設計, 型システム]
format: 2
---

## ひとことで

`ST_MultiPolygonFromText` は、WKT の文字列から、複数の多角形をまとめた図形を作る関数です。座標系の番号も一緒に渡せます。中身は、マルチポリゴンを作る `ST_MPolyFromText` を呼ぶだけの別名です。

## コード

```sql:line-numbers=5986
CREATE OR REPLACE FUNCTION ST_MultiPolygonFromText(text, integer)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_MPolyFromText($1, $2)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **マルチポリゴン（MULTIPOLYGON）**: 複数の多角形をまとめて一つの図形として扱う型。
- **座標系の番号（SRID）**: 図形の座標系を表す番号。
- **WKT**: 図形を文字列で書く標準の形式。
- **`ST_MPolyFromText`**: マルチポリゴンを、種類を確かめて作る本体の関数。

## 何をしているか

### 1. 本体の関数に番号を渡す

```sql:line-numbers=5988
	AS 'SELECT @extschema@.ST_MPolyFromText($1, $2)'
```

文字列と番号を、`ST_MPolyFromText` に渡します。番号は、作られる図形に付けられます。

### 2. 性質を揃える

```sql:line-numbers=5989
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

`STRICT` と `IMMUTABLE` の指定は、本体と同じです。`NULL` の入力を計算せず、同じ入力には同じ結果を返します。

## ここがすごい

- **番号付きの複数の面を一度に作れる**: 座標系を付けた面の集まりを、一つの関数で作れます。
- **名前の規則を揃える**: 単数の多角形と、複数の多角形の関数名が対応しています。
- **中身の変更が一か所**: 本体を直せば、この別名にも反映されます。

## まとめ

- 複数の面は、マルチポリゴンとして一つの値にまとめられる。
- 番号を一緒に渡すと、座標系の取り違えを防げる。
- 別名は本体の呼び出しだけにして、重複を避ける。
