---
title: "文字列を複数の線の図形にする ST_MultiLineStringFromText（番号版）"
description: "PostGIS の ST_MultiLineStringFromText(text, integer)。WKT の文字列と座標系の番号から複数の線を作る別名。中身は ST_MLineFromText(text, integer) を呼ぶだけ。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5928, 5932]
function: "ST_MultiLineStringFromText(text, integer)"
difficulty: 2
tags: [API設計, 型システム]
format: 2
---

## ひとことで

`ST_MultiLineStringFromText` は、WKT の文字列から複数の線の図形を作る関数です。座標系の番号も一緒に渡せます。働きは `ST_MLineFromText` と同じで、規格に近い名前で呼べるように、別名として用意されています。

## コード

```sql:line-numbers=5928
CREATE OR REPLACE FUNCTION ST_MultiLineStringFromText(text, integer)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_MLineFromText($1, $2)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **マルチライン（MULTILINESTRING）**: 複数の線をまとめて一つの図形として扱う型。
- **座標系の番号（SRID）**: 図形の座標系を表す番号。
- **別名（alias）**: 同じ働きを、別の名前で呼べるようにした関数。
- **`ST_MLineFromText`**: マルチラインを、種類を確かめて作る本体の関数。

## 何をしているか

### 1. 本体の関数に番号を渡す

```sql:line-numbers=5930
	AS 'SELECT @extschema@.ST_MLineFromText($1, $2)'
```

文字列と番号を、`ST_MLineFromText` にそのまま渡します。種類の確かめは本体の仕事です。

### 2. 性質を揃える

```sql:line-numbers=5931
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

`STRICT` と `IMMUTABLE` の指定は、本体と同じです。`NULL` の入力は計算されず、同じ入力には同じ結果が返ります。

## ここがすごい

- **規格に近い名前を用意する**: 利用者は、他の製品で覚えた名前をそのまま使えます。
- **中身を一か所に保つ**: 名前が増えても、確かめの処理は本体だけにあります。
- **番号付きで揃う**: 番号を付けた点や線の版と、同じ引数の形で呼べます。

## まとめ

- 別名は、本体を呼ぶだけにすると保守の手間が増えない。
- 規格に近い名前は、覚える負担を減らす。
- 性質は本体と揃えて、食い違いを防ぐ。
