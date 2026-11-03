---
title: "変換の手順を一度に指定する ST_TransformPipeline"
description: "PostGIS の ST_TransformPipeline(geom, pipeline, to_srid)。PROJ の変換パイプラインを文字列で指定し、順方向に座標を変換する。内部の C 関数に forward を TRUE で渡す。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [3166, 3170]
function: "ST_TransformPipeline(geom geometry, pipeline text, to_srid integer DEFAULT 0)"
difficulty: 3
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`ST_TransformPipeline` は、座標の変換を、複数の手順をまとめた「パイプライン」として指定する関数です。PROJ の変換の手順を文字列で書き、その通りに座標を順番に変えます。

## コード

```sql:line-numbers=3166
CREATE OR REPLACE FUNCTION ST_TransformPipeline(geom geometry, pipeline text, to_srid integer DEFAULT 0)
	RETURNS geometry AS
	'SELECT @extschema@.postgis_transform_pipeline_geometry($1, $2, TRUE, $3)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_HIGH;
```

## 前提知識

- **変換パイプライン**: 一つの変換を、いくつかの手順に分けて順番に実行したもの。PROJ が扱う。
- **`DEFAULT 0`**: 変換先の番号を省いたときの既定値。0 は、番号を指定しないことを表す。
- **`TRUE`（順方向）**: 変換を定義どおりの向きに行うという指定。
- **内部関数**: 利用者が直接呼ばず、公開の関数から使われる関数。

## 何をしているか

### 1. 内部の C 関数を呼ぶ

```sql:line-numbers=3168
	'SELECT @extschema@.postgis_transform_pipeline_geometry($1, $2, TRUE, $3)'
```

`postgis_transform_pipeline_geometry` を呼び、パイプラインの文字列と変換先の番号を渡します。`TRUE` は、順方向に変換することを表します。

### 2. 既定の番号を使える形にする

```sql:line-numbers=3166
CREATE OR REPLACE FUNCTION ST_TransformPipeline(geom geometry, pipeline text, to_srid integer DEFAULT 0)
```

変換先の番号は省略でき、その場合は 0 になります。番号を後から付けるかどうかを、利用者が選べます。

## ここがすごい

- **手順をまとめて書ける**: 複数の変換を、一つの文字列にまとめて渡せます。
- **向きを明示する**: 順方向と逆方向を、別の関数として分けています。
- **内部の関数を薄く包む**: 公開の関数は、引数を決めて内部へ渡すだけなので、利用者が覚えることが少なくなります。

## まとめ

- 複数の変換は、一つの文字列のパイプラインとして渡せる。
- 向きは、公開の関数を分けて明示すると誤りが減る。
- 内部の関数は、公開の関数で包むと読み手が迷わない。
