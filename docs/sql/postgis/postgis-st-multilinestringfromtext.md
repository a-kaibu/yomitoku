---
title: "文字列を複数の線の図形にする ST_MultiLineStringFromText"
description: "PostGIS の ST_MultiLineStringFromText(text)。WKT の文字列から複数の線（ST_MultiLineString）を作る別名。中身は ST_MLineFromText を呼ぶだけ。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [5921, 5925]
function: "ST_MultiLineStringFromText(text)"
difficulty: 1
tags: [API設計, 型システム]
format: 2
---

## ひとことで

`ST_MultiLineStringFromText` は、WKT の文字列から、線をまとめた図形を作る関数です。一つの線ではなく、複数の線の集まりを扱うときに使います。中身は `ST_MLineFromText` を呼ぶだけの別名です。

## コード

```sql:line-numbers=5921
CREATE OR REPLACE FUNCTION ST_MultiLineStringFromText(text)
	RETURNS geometry
	AS 'SELECT @extschema@.ST_MLineFromText($1)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

## 前提知識

- **マルチライン（MULTILINESTRING）**: 複数の線をまとめて一つの図形として扱う型。
- **WKT**: 図形を文字列で書く標準の形式。`MULTILINESTRING((0 0, 1 1), (2 2, 3 3))` のように書く。
- **`ST_MLineFromText`**: マルチラインを、種類を確かめて作る本体の関数。
- **別名（alias）**: 同じ働きを、規格に近い名前で呼べるようにした関数。

## 何をしているか

### 1. 本体の関数を呼ぶ

```sql:line-numbers=5923
	AS 'SELECT @extschema@.ST_MLineFromText($1)'
```

文字列を、`ST_MLineFromText` にそのまま渡します。種類を確かめる処理は本体に任せています。

### 2. 性質を揃える

```sql:line-numbers=5924
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_MEDIUM;
```

`STRICT` と `IMMUTABLE` の指定は、本体と揃っています。`NULL` の入力を計算せず、同じ入力には同じ結果を返します。

## ここがすごい

- **規格に近い名前を用意する**: 利用者は、他の製品で覚えた名前をそのまま使えます。
- **中身を一か所に保つ**: 名前が増えても、処理を直すのは本体だけで済みます。
- **種類の確かめは本体の仕事**: 別名は、受け渡しだけをするので、読み手が迷いません。

## まとめ

- 複数の線の図形は、マルチラインの型で一つにまとめて扱える。
- 別名は本体を呼ぶだけにすると、保守の手間が増えない。
- 規格に近い名前は、覚える負担を減らす。
