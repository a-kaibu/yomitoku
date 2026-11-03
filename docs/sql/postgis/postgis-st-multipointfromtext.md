---
title: "文字列を複数の点の図形にする ST_MultiPointFromText"
description: "PostGIS の ST_MultiPointFromText(text)。WKT の文字列から複数の点（ST_MultiPoint）を作る別名。中身は ST_MPointFromText を呼ぶだけ。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5957, 5961]
function: "ST_MultiPointFromText(text)"
difficulty: 1
tags: [API設計, 型システム]
format: 2
---

## ひとことで

`ST_MultiPointFromText` は、WKT の文字列から、点をまとめた図形を作る関数です。一つの点ではなく、点の集まりを一つの値として扱いたいときに使います。中身は `ST_MPointFromText` を呼ぶだけの別名です。

## コード

```sql:line-numbers=5957
CREATE OR REPLACE FUNCTION ST_MultiPointFromText(text)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_MPointFromText($1)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **マルチポイント（MULTIPOINT）**: 複数の点をまとめて一つの図形として扱う型。
- **WKT**: 図形を文字列で書く標準の形式。`MULTIPOINT(0 0, 1 1)` のように書く。
- **`ST_MPointFromText`**: マルチポイントを、種類を確かめて作る本体の関数。
- **別名**: 同じ働きを、規格に近い名前で呼べるようにした関数。

## 何をしているか

### 1. 本体の関数を呼ぶ

```sql:line-numbers=5959
	AS 'SELECT @extschema@.ST_MPointFromText($1)'
```

文字列を、`ST_MPointFromText` にそのまま渡します。種類の確かめは、本体の仕事です。

### 2. 性質を揃える

```sql:line-numbers=5960
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

`STRICT` と `IMMUTABLE` の指定を、本体と同じに揃えています。`NULL` の入力は計算されず、同じ入力には同じ結果が返ります。

## ここがすごい

- **集まりを一つの値にする**: 点の列を別々に扱わず、一つの図形として渡せます。
- **名前の揃え方**: 単一の点の版と同じ仕組みで、複数の点を扱えるように名前が付けられています。
- **中身を一か所に保つ**: 処理の変更は本体だけで済みます。

## まとめ

- 点の集まりは、マルチポイントとして一つの値にまとめられる。
- 別名は本体を呼ぶだけにすると、重複が生まれない。
- 名前の揃え方は、単数と複数の関係を読み手に伝える。
