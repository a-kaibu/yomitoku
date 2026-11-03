---
title: "包含の向きを入れ替える内部関数 _ST_Within"
description: "PostGIS の内部関数 _ST_Within(geom1, geom2)。_ST_Contains の引数の順番を入れ替えて呼び、「geom1 が geom2 に含まれる」という判定を作る。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [4786, 4789]
function: "_ST_Within(geom1 geometry, geom2 geometry)"
difficulty: 1
tags: [設計パターン, API設計]
format: 2
---

## ひとことで

`_ST_Within` は、一つの図形が、もう一つの図形の中に入っているかを判定する内部関数です。判定の計算は、`_ST_Contains` にすでにあるので、引数の順番を入れ替えて呼ぶだけで済ませています。

## コード

```sql:line-numbers=4786
CREATE OR REPLACE FUNCTION _ST_Within(geom1 geometry, geom2 geometry)
	RETURNS boolean
	AS 'SELECT @extschema@._ST_Contains($2,$1)'
	LANGUAGE 'sql' IMMUTABLE PARALLEL SAFE;
```

## 前提知識

- **含む（contains）と含まれる（within）**: 「A が B を含む」と「B が A に含まれる」は、同じ関係を逆から見た言い方。
- **引数の入れ替え**: 関数に渡す順番を変えることで、逆向きの判定を作る方法。
- **内部関数の名前**: 先頭の `_` は、利用者が直接使うものではないことを示す慣習。
- **`IMMUTABLE`**: 同じ入力には、いつも同じ結果を返すという指定。

## 何をしているか

### 1. 判定の本体を呼ぶ

```sql:line-numbers=4787
	RETURNS boolean
	AS 'SELECT @extschema@._ST_Contains($2,$1)'
```

戻り値は `boolean`（真か偽）です。本体は `_ST_Contains` で、ここでは引数を入れ替えて渡しています。

## ここがすごい

- **同じ計算を二度書かない**: 逆向きの判定を、新しい計算として書かずに、既存の計算を借ります。
- **意味の違いを引数の順番で表す**: 「含む」と「含まれる」の違いは、引数の順番だけに現れます。
- **内部名で役割を隠す**: 利用者は、わかりやすい公開の名前から使えるようにし、内部の関数は `_` で区別しています。

## まとめ

- 逆向きの判定は、引数の順番を入れ替えて既存の計算を呼ぶと書ける。
- 同じ関係を逆から見た判定は、一つの計算で済ませると誤りが減る。
- 内部の関数は、先頭の記号で区別すると役割が明確になる。
