---
title: "座標系の番号を省いて多角形を作る ST_PolygonFromText"
description: "PostGIS の ST_PolygonFromText(text)。WKT の文字列だけから多角形を作る別名。中身は ST_PolyFromText を呼ぶだけで、番号は省いた形で渡される。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5891, 5895]
function: "ST_PolygonFromText(text)"
difficulty: 1
tags: [API設計, 型システム]
format: 2
---

## ひとことで

`ST_PolygonFromText` の一引数版は、WKT の文字列だけを受け取って多角形を作ります。座標系の番号は指定しません。番号を付けたいときは、二引数の版を使います。

## コード

```sql:line-numbers=5891
CREATE OR REPLACE FUNCTION ST_PolygonFromText(text)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_PolyFromText($1)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **多角形（POLYGON）**: 閉じた輪郭で囲まれた面。
- **WKT**: 図形を文字列で書く標準の形式。
- **引数の省略版**: 同じ名前の関数で、引数を一つ減らした版。
- **`ST_PolyFromText`**: 種類を確かめて多角形を返す、本体の関数。

## 何をしているか

### 1. 本体の関数を呼ぶ

```sql:line-numbers=5893
	AS 'SELECT @extschema@.ST_PolyFromText($1)'
```

文字列だけを、`ST_PolyFromText` に渡します。番号を省いた形で呼ぶので、本体側では番号が決められていない図形になります。

### 2. 性質を確かめる

```sql:line-numbers=5894
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

`STRICT` と `IMMUTABLE` で、`NULL` の入力は計算されず、同じ入力には同じ結果が返ります。本体と性質が揃っています。

## ここがすごい

- **引数を減らして書きやすくする**: 座標系が関係ない場面では、文字列だけで済みます。
- **二つの版を同じ本体に任せる**: 番号の有無に関係なく、種類の確かめ方は一つにまとまっています。
- **性質が本体と揃う**: 省略版でも、扱いが変わらないように作られています。

## まとめ

- 引数を省いた版は、上位の版へ既定の値を補って渡す形にすると揃えやすい。
- 同じ本体に任せると、確かめ方の食い違いが起きない。
- 省略版の性質は、本体と同じにしておくと安心して使える。
