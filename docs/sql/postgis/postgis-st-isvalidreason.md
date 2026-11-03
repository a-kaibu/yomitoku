---
title: "不正な図形の理由を、展開した行から取り出す ST_IsValidReason"
description: "PostGIS の ST_IsValidReason。ST_isValidDetail が返す複合型の行を (関数).* で展開し、CASE で有効なら Valid Geometry、無効なら理由の文字列を返す。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [3992, 4000]
function: "ST_IsValidReason(geometry, integer)"
difficulty: 3
tags: [型システム, 防御的プログラミング]
format: 2
---

## ひとことで

`ST_IsValidReason` は、図形が正しい形かどうかを確かめ、正しくないときはその理由を文字列で返す関数です。内部では、有効性と理由を 2 つの値として返す関数を呼んでいて、その結果を行ごとに分けて使っています。

## コード

```sql:line-numbers=3992
CREATE OR REPLACE FUNCTION ST_IsValidReason(geometry, integer)
	RETURNS text
	AS $$
	SELECT CASE WHEN valid THEN 'Valid Geometry' ELSE reason END FROM (
		SELECT (@extschema@.ST_isValidDetail($1, $2)).*
	) foo
	$$
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_HIGH;
```

## 前提知識

- **妥当性（validity）**: 図形の形として正しいかどうか。たとえば、線が自分自身と交差していると無効になる。
- **複合型の値**: 複数の項目をまとめた 1 つの値。`(関数(...)).項目名` の形で、個々の項目を取り出せる。
- **`(...).*`**: 複合型の値の全項目を、列として展開する書き方。
- **`CASE WHEN ... THEN ... ELSE ... END`**: 条件で値を選ぶ式。
- **サブクエリの別名**: `foo` のように、`FROM` の中の結果に名前を付けること。

## 何をしているか

### 1. 妥当性の詳細を、列として展開する

`ST_isValidDetail` は、有効かどうか（`valid`）と、理由（`reason`）などを持つ複合型の値を返します。`(...).*` で、それらの項目を列として取り出します。

```sql:line-numbers=3995
	SELECT CASE WHEN valid THEN 'Valid Geometry' ELSE reason END FROM (
		SELECT (@extschema@.ST_isValidDetail($1, $2)).*
	) foo
```

### 2. 有効なら決まった文字、無効なら理由を返す

外側の `CASE` で、`valid` が真なら `Valid Geometry` を、そうでなければ理由の `reason` を返します。

```sql:line-numbers=3998
	$$
```

（この版は `SQL` の本体を `$$` で囲んで書かれています。文字列の中に引用符が多いときに、この書き方が読みやすくなります。）

## ここがすごい

- **1 回の検査で、2 つの情報を取る**: 有効かどうかと理由を、同じ関数の結果から一度に取り出しています。検査を 2 回行う必要がありません。
- **複合型をそのまま列に広げる**: `(...).*` によって、関数の結果を普通の表のように扱えます。
- **利用者に読める結果**: 無効のときは理由の文字列が返るので、どこが問題かがすぐ分かります。
- **トレードオフ**: 検査は計算が重いので、大量の図形に対して呼ぶと時間がかかります。`_COST_HIGH` の見積もりも、それを反映しています。

## まとめ

- 複数の情報を返す関数は、複合型で返し、`(...).*` で展開すると扱いやすい。
- 結果の表示を決める `CASE` は、判定の結果を利用者の言葉に変える役割を持つ。
- 重い検査は、1 回の呼び出しで必要な情報を全部取ると効率がよい。
