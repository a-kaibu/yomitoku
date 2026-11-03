---
title: "番号付きの多角形の生成を、既存の関数に任せる ST_PolygonFromText（番号版）"
description: "PostGIS の ST_PolygonFromText(text, integer)。ST_PolyFromText と同じ働きを、名前を変えて呼ぶ別名。WKT と座標系の番号から多角形を作る。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5884, 5888]
function: "ST_PolygonFromText(text, integer)"
difficulty: 1
tags: [API設計, 型システム]
format: 2
---

## ひとことで

`ST_PolygonFromText` は、WKT の文字列から多角形を作る関数です。働きは `ST_PolyFromText` とまったく同じで、名前だけが長い形になっています。SQL 標準の名前に近い形を、別名として用意しています。

## コード

```sql:line-numbers=5884
CREATE OR REPLACE FUNCTION ST_PolygonFromText(text, integer)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_PolyFromText($1, $2)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **別名（alias）**: 同じ働きを、別の名前で呼べるようにした関数。
- **SQL 標準の名前**: 規格で決められた関数の名前の形。ここでは `PolygonFromText`。
- **座標系の番号（SRID）**: 図形の座標系を表す番号。
- **`STRICT`**: どれかの引数が `NULL` なら、計算せずに `NULL` を返す指定。

## 何をしているか

### 1. 本体の関数を呼ぶ

```sql:line-numbers=5886
	AS 'SELECT @extschema@.ST_PolyFromText($1, $2)'
```

文字列と番号を、そのまま `ST_PolyFromText` に渡します。種類の確認や `NULL` の処理は、その関数に任せています。

### 2. 性質を決める

```sql:line-numbers=5887
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

`STRICT` と `IMMUTABLE` の指定は、本体と同じです。引数の扱いも、結果の性質も、本体と揃っています。

## ここがすごい

- **名前を揃えて覚えやすくする**: 規格に近い名前があると、他の製品の経験をそのまま使えます。
- **中身を一か所に保つ**: 名前が増えても、処理を直すのは本体の関数だけで済みます。
- **性質を本体と揃える**: 別名が違う振る舞いをしないように、同じ指定を付けています。

## まとめ

- 別名は、本体の関数を呼ぶだけにすると重複が無くなる。
- 規格に近い名前を用意すると、覚える負担が減る。
- 別名の性質は、本体と同じに揃えて食い違いを防ぐ。
