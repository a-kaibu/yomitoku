---
title: "PostgreSQL の版番号を取り出す内部関数 _postgis_scripts_pgsql_version"
description: "PostGIS の内部関数 _postgis_scripts_pgsql_version()。PostgreSQL の版番号を、ひな形の問い合わせの結果として text で返す。PostGIS の互換性の確認に使われる。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [3265, 3267]
function: "_postgis_scripts_pgsql_version()"
difficulty: 1
tags: [API設計, 標準ライブラリ]
format: 2
---

## ひとことで

`_postgis_scripts_pgsql_version` は、PostGIS の内部で使われる関数です。接続している PostgreSQL の版番号を返します。PostGIS の SQL スクリプトが、どの PostgreSQL の版に作られたかを確かめるための道具です。

## コード

```sql:line-numbers=3265
CREATE OR REPLACE FUNCTION _postgis_scripts_pgsql_version() RETURNS text
	AS _POSTGIS_SQL_SELECT_POSTGIS_PGSQL_VERSION
	LANGUAGE 'sql' IMMUTABLE;
```

## 前提知識

- **PostgreSQL の版番号**: サーバーの版を表す番号。メジャー版の数字で比べることが多い。
- **内部関数**: 利用者が直接呼ばず、ほかの関数から使われる関数。先頭の `_` で区別される。
- **ひな形**: ビルドの段階で、問い合わせの本文に置き換えられる名前。
- **`IMMUTABLE`**: 同じ入力には、いつも同じ結果を返すという指定。

## 何をしているか

### 1. 版番号の問い合わせを指定する

```sql:line-numbers=3266
	AS _POSTGIS_SQL_SELECT_POSTGIS_PGSQL_VERSION
```

`AS` の後のひな形は、PostgreSQL の版番号を取り出す問い合わせに置き換えられます。実際の値は、この関数を呼んだときに得られます。

### 2. 性質と言語を決める

```sql:line-numbers=3267
	LANGUAGE 'sql' IMMUTABLE;
```

`LANGUAGE 'sql'` は、本体が SQL であることを示します。`IMMUTABLE` は、同じサーバーでは結果が変わらないことを表します。

## ここがすごい

- **内部の確認を一つの関数に集める**: 版番号の取り出しを一か所にまとめ、ほかの関数はこれを呼ぶだけで済みます。
- **ひな形でビルド時の情報を入れる**: 利用者の目に見えない部分でも、正しい版番号を使えます。
- **互換性を前もって確かめる**: 版が合わないと動かない関数を、事前に見分けられます。

## まとめ

- 内部の確認は、一つの関数にまとめて呼び出し側を簡単にする。
- ひな形を使うと、定義を変えずにビルド時の情報を入れられる。
- 内部関数の名前の先頭に `_` を付けると、利用者向けでないと読み手に伝わる。
