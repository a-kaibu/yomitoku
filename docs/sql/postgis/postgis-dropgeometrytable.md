---
title: "スキーマ名を省いて表を消す DropGeometryTable"
description: "PostGIS の DropGeometryTable。スキーマ名を省いた版は、空の文字列を渡して既定のスキーマを使う。表の削除と、geometry_columns の登録の削除をまとめて行う関数の薄いラッパー。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [2860, 2862]
function: "DropGeometryTable(schema_name varchar, table_name varchar)"
difficulty: 2
tags: [API設計, 防御的プログラミング]
format: 2
---

## ひとことで

`DropGeometryTable` は、空間データを持つ表を、関連する登録情報と一緒に削除する関数です。この記事の版は、スキーマ名と表名を受け取ります。表名だけを渡す版も用意されていて、それは既定のスキーマを使うように、この版を呼び出します。

## コード

```sql:line-numbers=2860
CREATE OR REPLACE FUNCTION DropGeometryTable(schema_name varchar, table_name varchar) RETURNS text AS
$$ SELECT @extschema@.DropGeometryTable('',$1,$2) $$
LANGUAGE 'sql' VOLATILE STRICT;
```

## 前提知識

- **`geometry_columns`**: PostGIS が、空間データの列を登録しておく表。どの表のどの列が図形を持つかを記録する。
- **スキーマ**: テーブルなどを入れる名前空間。
- **`varchar`**: 可変長の文字列の型。
- **空の文字列**: ここでは「スキーマ名を指定しない」ことを表すために使われる値。
- **`VOLATILE`**: 関数を呼ぶたびに、結果や副作用が変わりうるという性質。表の削除はこれにあたる。

## 何をしているか

### 1. 2 引数の版は、名前の 2 つで呼び出す

スキーマ名と表名を受け取る版は、`LANGUAGE 'sql'` で書かれた関数です。本体は、同じ名前の 3 引数版に、カタログの名前を空で渡して呼び出しています。

```sql:line-numbers=2860
CREATE OR REPLACE FUNCTION DropGeometryTable(schema_name varchar, table_name varchar) RETURNS text AS
$$ SELECT @extschema@.DropGeometryTable('',$1,$2) $$
LANGUAGE 'sql' VOLATILE STRICT;
```

ここでの空の文字列は、「カタログ（データベース名）は指定しない」という意味です。

### 2. 表名だけの版は、スキーマを省いて呼ぶ

表名だけを渡す版は、スキーマの名前を空の文字列にして、同じ関数を呼びます。空の値は、既定のスキーマ（現在のスキーマ）を表すことになります。


## ここがすごい

- **削除の本体は 1 か所にある**: 引数の違う版は、どれも同じ本体を呼ぶ薄い関数なので、削除の処理を変えるときは 1 か所で済みます。
- **空の値で既定の振る舞いを表す**: 「指定しない」を空の文字列で表し、本体が既定のスキーマを決めます。
- **`VOLATILE` の宣言**: 表を消す処理は、呼ぶたびに結果が変わる性質があるので、正しく `VOLATILE` と宣言されています。
- **トレードオフ**: 空の文字列を既定の意味として扱うため、誤って空の値を渡すと、意図しないスキーマを対象にする危険があります。削除の関数は、特に注意して使う必要があります。

## まとめ

- 削除の処理は、引数違いの薄い関数で包み、本体を 1 か所にまとめると保守しやすい。
- 「指定なし」を空の値で表すときは、その値の意味を関数の仕様として明記する。
- 副作用のある関数は、`VOLATILE` と正しく宣言する。
