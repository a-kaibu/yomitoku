---
title: "文字列を複数の多角形の図形にする ST_MultiPolygonFromText（番号省略版）"
description: "PostGIS の ST_MultiPolygonFromText(text)。WKT の文字列だけから複数の多角形を作る別名。中身は ST_MPolyFromText(text) を呼ぶだけ。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5993, 5997]
function: "ST_MultiPolygonFromText(text)"
difficulty: 1
tags: [API設計, 型システム]
format: 2
---

## ひとことで

`ST_MultiPolygonFromText` の一引数版は、WKT の文字列だけから複数の多角形を作る関数です。座標系の番号は省きます。中身は、同じ働きをする `ST_MPolyFromText` を呼ぶだけの別名です。

## コード

```sql:line-numbers=5993
CREATE OR REPLACE FUNCTION ST_MultiPolygonFromText(text)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_MPolyFromText($1)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **マルチポリゴン（MULTIPOLYGON）**: 複数の多角形をまとめて一つの図形として扱う型。
- **WKT（Well-Known Text）**: 図形を文字列で書く標準の形式。
- **別名（alias）**: 同じ働きを、規格に近い名前で呼べるようにした関数。
- **`ST_MPolyFromText`**: マルチポリゴンを、種類を確かめて作る本体の関数。

## 何をしているか

### 1. 本体の関数を呼ぶ

```sql:line-numbers=5995
	AS 'SELECT @extschema@.ST_MPolyFromText($1)'
```

文字列を、`ST_MPolyFromText` の一引数版にそのまま渡します。種類の確かめは本体の仕事です。

### 2. 性質を揃える

```sql:line-numbers=5996
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

`STRICT` と `IMMUTABLE` の指定は、本体と同じです。`NULL` の入力は計算されず、同じ入力には同じ結果が返ります。

## ここがすごい

- **規格に近い名前を用意する**: 他の製品で覚えた名前を、そのまま使えます。
- **中身を一か所に保つ**: 処理を直すのは本体だけで済みます。
- **番号を省く版と番号付きの版が対応する**: 名前の並びから、どちらを使えばよいかが分かります。

## まとめ

- 別名は、本体を呼ぶだけにすると保守の手間が増えない。
- 規格に近い名前は、覚える負担を減らす。
- 性質は本体と揃えて、食い違いを防ぐ。
