---
title: "インストール済みの PostGIS スクリプトの版を返す postgis_scripts_installed"
description: "PostGIS の postgis_scripts_installed()。データベースに入っている SQL スクリプトの版を、埋め込みの問い合わせの結果として text で返す。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [3217, 3219]
function: "postgis_scripts_installed()"
difficulty: 1
tags: [標準ライブラリ, API設計]
format: 2
---

## ひとことで

`postgis_scripts_installed` は、データベースに入っている PostGIS の SQL スクリプトの版を返す関数です。版を確かめると、ライブラリの版と SQL の版が合っているかが分かります。合っていないと、関数が正しく動かないことがあります。

## コード

```sql:line-numbers=3217
CREATE OR REPLACE FUNCTION postgis_scripts_installed() RETURNS text
	AS _POSTGIS_SQL_SELECT_POSTGIS_SCRIPTS_VERSION
	LANGUAGE 'sql' IMMUTABLE;
```

## 前提知識

- **SQL スクリプトの版**: PostGIS の関数の定義を書いた SQL ファイルの版。ライブラリの版と組み合わせて使う。
- **`AS` の後の名前**: ここでは、版を埋め込む問い合わせのひな形の名前。ビルドの段階で中身が書き込まれる。
- **`IMMUTABLE`**: 同じ入力には、いつも同じ結果を返すという指定。
- **`LANGUAGE 'sql'`**: 本体を SQL で書いた関数であることを示す。

## 何をしているか

### 1. 版の問い合わせを返す

```sql:line-numbers=3218
	AS _POSTGIS_SQL_SELECT_POSTGIS_SCRIPTS_VERSION
```

`AS` の後で、版を取り出す問い合わせを指定しています。ここには実際の問い合わせの本文が入り、関数を呼ぶとその結果が返ります。

### 2. 定義の性質を決める

```sql:line-numbers=3219
	LANGUAGE 'sql' IMMUTABLE;
```

`IMMUTABLE` は、版が途中で変わらないことを表します。`LANGUAGE 'sql'` は、関数の中身が SQL であることを示します。

## ここがすごい

- **確認の関数が簡単に呼べる**: 版を調べたいとき、関数を一つ呼ぶだけで済みます。
- **ひな形で版を埋め込む**: 版の値はビルドの段階で書き込まれるので、関数の定義は一つのままでも正しい版が返ります。
- **版の食い違いを見つけられる**: ライブラリの版と合わせて見ると、アップデートし忘れを発見できます。

## まとめ

- 版を返す関数は、ライブラリの版との食い違いを確かめる道具になる。
- ビルド時に値を入れるひな形は、定義を変えずに正しい値を返せる。
- 性質の指定は、関数が何をしないかを読み手に伝える。
