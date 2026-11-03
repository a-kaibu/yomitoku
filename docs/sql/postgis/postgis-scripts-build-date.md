---
title: "PostGIS のスクリプトのビルド日を返す postgis_scripts_build_date"
description: "PostGIS の postgis_scripts_build_date()。SQL スクリプトを作ったときの日付を、埋め込みの問い合わせの結果として text で返す。ライブラリのビルド日とは別に確かめられる。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [3257, 3259]
function: "postgis_scripts_build_date()"
difficulty: 1
tags: [日時, API設計]
format: 2
---

## ひとことで

`postgis_scripts_build_date` は、PostGIS の SQL スクリプトを作った日付を返す関数です。ライブラリ本体の日付は、別の関数の `postgis_lib_build_date` で分かります。二つを比べると、スクリプトとライブラリの版が合っているかを確かめられます。

## コード

```sql:line-numbers=3257
CREATE OR REPLACE FUNCTION postgis_scripts_build_date() RETURNS text
	AS _POSTGIS_SQL_SELECT_POSTGIS_BUILD_DATE
	LANGUAGE 'sql' IMMUTABLE;
```

## 前提知識

- **ビルド日**: ソフトウェアを組み立てた（ビルドした）日付。版の確認に使う。
- **SQL スクリプトとライブラリ**: 関数の定義（SQL）と、中身の計算（C 言語のライブラリ）は別のファイルで提供される。
- **ひな形の名前**: `_POSTGIS_SQL_SELECT_POSTGIS_BUILD_DATE` のように、ビルドの段階で中身が書き込まれる名前。
- **`IMMUTABLE`**: 同じ入力には、いつも同じ結果を返すという指定。

## 何をしているか

### 1. 日付の問い合わせを返す

```sql:line-numbers=3258
	AS _POSTGIS_SQL_SELECT_POSTGIS_BUILD_DATE
```

`AS` の後に、ビルド日を取り出す問い合わせのひな形を指定しています。ビルドの段階で、実際の日付を取り出す本文に置き換えられます。

### 2. 定義の性質を決める

```sql:line-numbers=3259
	LANGUAGE 'sql' IMMUTABLE;
```

`IMMUTABLE` は、この日付が途中で変わらないことを表します。`LANGUAGE 'sql'` は、関数の中身が SQL であることを示します。

## ここがすごい

- **版の確認が簡単に呼べる**: 日付を確かめたいときは、関数を一つ呼ぶだけです。
- **ひな形でビルド時の値を入れる**: 関数の定義を書き換えずに、正しい日付が返ります。
- **ライブラリの日付と分けて確かめる**: スクリプトとライブラリが別の時期に作られた場合の食い違いを見つけられます。

## まとめ

- ビルド日は、版の食い違いを見つける手がかりになる。
- ひな形を使うと、定義を変えずにビルド時の値を入れられる。
- 性質の指定は、関数が何をしないかを読み手に伝える。
