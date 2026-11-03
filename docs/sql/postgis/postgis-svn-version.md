---
title: "廃止された postgis_svn_version の警告付きの呼び出し"
description: "PostGIS の postgis_svn_version()。廃止された名前の関数で、呼ばれると _postgis_deprecate で警告を出してから postgis_lib_revision() の結果を返す。"
language: sql
project: "PostGIS"
repo: https://github.com/postgis/postgis
license: "GPL-2.0-or-later"
copyright: "Copyright 2001-2003 Refractions Research Inc."
commit: "358ee965988ba72ecd47601205c99b9e91cc037e"
file: postgis/postgis.sql.in
lines: [3243, 3249]
function: "postgis_svn_version()"
difficulty: 2
tags: [エラー処理, 防御的プログラミング]
format: 2
---

## ひとことで

`postgis_svn_version` は、古い名前の関数です。今は `postgis_lib_revision` を使うように決められており、この関数を呼ぶと、まず廃止の警告を出します。そのうえで、新しい関数の結果を返します。

## コード

```sql:line-numbers=3243
CREATE OR REPLACE FUNCTION postgis_svn_version()
RETURNS text AS $$
	SELECT @extschema@._postgis_deprecate(
		'postgis_svn_version', 'postgis_lib_revision', '3.1.0');
	SELECT @extschema@.postgis_lib_revision();
$$
LANGUAGE 'sql' IMMUTABLE SECURITY INVOKER;
```

## 前提知識

- **廃止（deprecated）**: 将来は使われなくなる予定の機能。すぐには動かなくならないが、新しい方法への移行が勧められる。
- **`_postgis_deprecate`**: 廃止の警告を出す内部の関数。古い名前、新しい名前、廃止の版を受け取る。
- **SVN の版**: 以前は、ソースの版管理のための番号を返していた。
- **`SECURITY INVOKER`**: 関数を呼んだ人の権限で実行するという指定。

## 何をしているか

### 1. 廃止の警告を出す

```sql:line-numbers=3245
	SELECT @extschema@._postgis_deprecate(
		'postgis_svn_version', 'postgis_lib_revision', '3.1.0');
```

`_postgis_deprecate` に、古い名前、新しい名前、廃止された版を渡します。警告は、利用者が移行するきっかけになります。

### 2. 新しい関数の結果を返す

```sql:line-numbers=3247
	SELECT @extschema@.postgis_lib_revision();
```

最後の `SELECT` で、`postgis_lib_revision()` の結果を返します。古い名前の利用者にも、同じ種類の値が返ります。

### 3. 関数の性質を決める

```sql:line-numbers=3249
LANGUAGE 'sql' IMMUTABLE SECURITY INVOKER;
```

`IMMUTABLE` と `SECURITY INVOKER` は、結果が変わらないことと、呼んだ人の権限で動くことを表します。

## ここがすごい

- **警告と動作を両立する**: 古い利用者を急に壊さず、警告を出しながら動きは続けます。
- **移行先の名前を警告に書く**: 読み手は、どの関数に替えればよいかを警告から知れます。
- **複数の `SELECT` を一つの関数に**: 警告と結果を、一つの本体の中で順に実行しています。

## まとめ

- 廃止する関数は、警告を出してから新しい関数の結果を返すと移行しやすい。
- 警告の中に、移行先の名前と版を書くと読み手が迷わない。
- 古い名前の関数は、動きを残しつつ警告で移行を促す。
