---
title: "変換の手順を逆向きにたどる ST_InverseTransformPipeline"
description: "PostGIS の ST_InverseTransformPipeline(geom, pipeline, to_srid)。ST_TransformPipeline と同じパイプラインを逆向きに実行する。内部の C 関数に forward を FALSE で渡す。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [3174, 3178]
function: "ST_InverseTransformPipeline(geom geometry, pipeline text, to_srid integer DEFAULT 0)"
difficulty: 3
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`ST_InverseTransformPipeline` は、座標の変換を逆向きにたどる関数です。前の記事の `ST_TransformPipeline` と同じパイプラインを使いますが、向きだけが反対になります。変換した座標を、元の座標系に戻したいときに使います。

## コード

```sql:line-numbers=3174
CREATE OR REPLACE FUNCTION ST_InverseTransformPipeline(geom geometry, pipeline text, to_srid integer DEFAULT 0)
	RETURNS geometry AS
	'SELECT @extschema@.postgis_transform_pipeline_geometry($1, $2, FALSE, $3)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_HIGH;
```

## 前提知識

- **変換パイプライン**: 一つの座標変換を、いくつかの手順に分けて順に行う仕組み。PROJ が扱う。
- **順方向と逆方向**: 同じ変換を、定義どおりに行うか、反対にたどるか。
- **`FALSE`（逆向き）**: 内部の関数に渡す真偽値。`TRUE` の順方向と対になる。
- **`DEFAULT 0`**: 変換先の番号を省いたときの既定値。

## 何をしているか

### 1. 逆向きのフラグを付けて内部を呼ぶ

```sql:line-numbers=3176
	'SELECT @extschema@.postgis_transform_pipeline_geometry($1, $2, FALSE, $3)'
```

内部の `postgis_transform_pipeline_geometry` に、パイプラインの文字列と番号を渡します。そのとき真偽の値を `FALSE` にして、逆向きに実行させます。

### 2. 順方向の版と並べて読む

```sql:line-numbers=3168
	'SELECT @extschema@.postgis_transform_pipeline_geometry($1, $2, TRUE, $3)'
```

順方向の `ST_TransformPipeline` は同じ内部関数を `TRUE` で呼びます。違いは、この一つの真偽の値だけです。

## ここがすごい

- **一つの内部関数で両方向を扱う**: 同じ仕組みを使うので、手順の定義が一か所にまとまります。
- **違いを一つの値に絞る**: 向きの違いを真偽の一つで表すので、読み手は違いをすぐに見つけられます。
- **公開の関数を分ける**: 利用者は、向きを名前で選べます。

## まとめ

- 逆向きの変換は、同じ手順を反対にたどるフラグで表せる。
- 向きの違いを一つの値にすると、読みやすく誤りが少ない。
- 順方向と逆方向を公開の名前で分けると、利用者が迷わない。
