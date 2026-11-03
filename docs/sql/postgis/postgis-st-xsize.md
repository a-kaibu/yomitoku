---
title: "箱の幅を、最大と最小の差で求める ST_XSize"
description: "PostGIS の ST_XSize(box3d)。3 次元の箱（box3d）の X 方向の幅を、XMax から XMin を引いて求める。関数の中身は、別の 2 つの関数の差だけ。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [1209, 1213]
function: "ST_XSize(box3d)"
difficulty: 1
tags: [数値計算, API設計]
format: 2
---

## ひとことで

`ST_XSize` は、空間データを囲む箱（`box3d`）の横方向の長さを返す関数です。箱の最も大きい X 座標から、最も小さい X 座標を引くだけで求まります。PostGIS では、これと同じ形の関数が Y 方向と Z 方向にも並んでいます。

## コード

```sql:line-numbers=1209
CREATE OR REPLACE FUNCTION ST_XSize(box3d)
	RETURNS FLOAT8
	AS 'SELECT @extschema@.ST_XMax($1) - @extschema@.ST_XMin($1)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
	_COST_DEFAULT;
```

## 前提知識

- **空間データ**: 点や線、面など、地図上の形を表すデータ。PostGIS は PostgreSQL にこれを扱う型を追加する拡張機能。
- **`box3d`**: 形を囲む直方体の範囲。X、Y、Z の最小と最大の値を持つ。
- **`XMin` / `XMax`**: 箱の X 方向の最小値と最大値を返す関数。
- **`FLOAT8`**: 倍精度の小数の型。座標の値に使われる。
- **`STRICT`**: 引数に `NULL` があれば、結果を `NULL` にする指定。

## 何をしているか

### 1. 関数の型と性質を宣言する

戻り値は `FLOAT8`、引数は `box3d` です。`IMMUTABLE` は同じ入力に同じ結果を返すこと、`STRICT` は `NULL` を返すことを表します。

```sql:line-numbers=1210
	RETURNS FLOAT8
	AS 'SELECT @extschema@.ST_XMax($1) - @extschema@.ST_XMin($1)'
	LANGUAGE 'sql' IMMUTABLE STRICT PARALLEL SAFE
```

### 2. 最大と最小の差を返す

本体は、SQL の文字列として書かれた 1 行の式です。`$1` が箱の引数です。

```sql:line-numbers=1211
	AS 'SELECT @extschema@.ST_XMax($1) - @extschema@.ST_XMin($1)'
```

`ST_XMax($1) - ST_XMin($1)` の形で、幅を直接計算しています。ここで `@extschema@` は、インストール先のスキーマ名に置き換わる目印です。

## ここがすごい

- **意味がそのまま式になる**: 「幅 = 最大 − 最小」という定義が、コードの形と一致しているので、読んで意味が分かります。
- **関数の再利用**: 座標の値を取り出す関数を組み合わせるだけで、幅を求めています。新しい計算の仕組みは要りません。
- **同じ形の並び**: `ST_YSize` や `ST_ZSize` も、軸だけを変えた同じ形です。新しい軸を足すときの型が決まっています。
- **トレードオフ**: 箱が空のときは、`NULL` の扱いに注意が必要です。`STRICT` によって、入力が `NULL` のときは結果も `NULL` になります。

## まとめ

- 幅や高さは、最大と最小の差で表すと分かりやすい。
- 座標を取り出す関数を組み合わせると、短い定義で済む。
- 同じ形の関数を軸ごとに並べると、規則を揃えやすい。
