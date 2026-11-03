---
title: "GML から図形を作る古い名前 ST_GMLToSQL"
description: "PostGIS の ST_GMLToSQL(text)。ST_GeomFromGML と同じ内部の関数を、同じ座標系の番号 0 で呼ぶ。古いアプリケーションのための別名として残されている。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5097, 5101]
function: "ST_GMLToSQL(text)"
difficulty: 2
tags: [パース, API設計]
format: 2
---

## ひとことで

`ST_GMLToSQL` は、GML の文字列から図形を作る関数です。`ST_GeomFromGML` と同じ働きをしますが、古い名前として残されています。新しく書くときは `ST_GeomFromGML` を使うのが勧められます。

## コード

```sql:line-numbers=5097
CREATE OR REPLACE FUNCTION ST_GMLToSQL(text)
	RETURNS geometry
	AS 'SELECT @extschema@._ST_GeomFromGML($1, 0)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **GML（Geography Markup Language）**: 地理情報を XML の形で書く規格。
- **別名（alias）**: 同じ働きを、別の名前で呼べるようにした関数。
- **座標系の番号 0**: 座標系が決まっていないことを表す番号。
- **`_COST_MEDIUM`**: 計算の重さの目安を、計画に伝える指定。

## 何をしているか

### 1. 内部の読み取りの関数を呼ぶ

```sql:line-numbers=5099
	AS 'SELECT @extschema@._ST_GeomFromGML($1, 0)'
```

文字列と番号 0 を、内部の `_ST_GeomFromGML` に渡します。読み取りの処理は、この内部の関数が一か所で行っています。

### 2. 性質の指定を確かめる

```sql:line-numbers=5100
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

`IMMUTABLE` と `STRICT` によって、同じ入力には同じ結果を返し、`NULL` の入力は計算しないことが分かります。`LANGUAGE 'sql'` は、本体が SQL であることを示します。

## ここがすごい

- **同じ中身を別の名前で残す**: 古い名前の利用者も、同じ結果を得られます。
- **読み取りを一か所にまとめる**: 別名が増えても、読み取りの処理を直すのは内部の関数だけです。
- **性質を明示する**: 関数の振る舞いを、指定の語で読み手に伝えています。

## まとめ

- 古い名前は、新しい名前と同じ内部の関数を呼ぶ別名として残すと、保守の負担が少ない。
- 新しく書くときは、勧められている名前を使う。
- 性質の指定は、関数が安全に使えるかを判断する材料になる。
