---
title: 文字列の false も、真偽値として正しく読み取る
description: WordPress の wp_validate_boolean は、真偽値・文字列・数値を受け取り、true か false に直します。文字列の "false" を false として扱うのが、PHP の (bool) との違いです。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "f73030e78d1af6c13f70a8825d0484d49230197a"
file: wp-includes/functions.php
lines: [7944, 7954]
function: wp_validate_boolean
difficulty: 1
format: 2
tags: [防御的プログラミング, 型システム]
---

## ひとことで

`wp_validate_boolean` は、受け取った値を **真偽値（true か false）** に直す関数です。HTML のフォームや URL のクエリから来る値は、`"false"` のような文字列になりがちです。この関数は、その文字列を正しく `false` として扱います。

## コード

```php:line-numbers=7944
function wp_validate_boolean( $value ) {
	if ( is_bool( $value ) ) {
		return $value;
	}

	if ( is_string( $value ) && 'false' === strtolower( $value ) ) {
		return false;
	}

	return (bool) $value;
}
```

## 前提知識

- **真偽値（bool）**: `true` か `false` の 2 つだけを持つ型です。
- **`(bool)` キャスト**: 値を真偽値に変換する書き方です。`0`、`""`、`null`、空の配列は `false` になり、ほかは `true` になります。
- **`is_bool` / `is_string`**: 値の型を調べる関数です。
- **`strtolower`**: 文字列を小文字にする関数です。`"FALSE"` と `"false"` を同じに扱えます。

## 何をしているか

### 1. すでに真偽値なら、そのまま返す

```php:line-numbers=7945
	if ( is_bool( $value ) ) {
		return $value;
	}
```

値がもともと `true` か `false` なら、何もせずに返します。

### 2. 文字列の `"false"` だけを特別に扱う

```php:line-numbers=7949
	if ( is_string( $value ) && 'false' === strtolower( $value ) ) {
		return false;
	}
```

値が文字列で、小文字にすると `false` と一致するなら、`false` を返します。`strtolower` を使うので、`"FALSE"` や `"False"` も同じように扱います。

### 3. それ以外は `(bool)` で変換する

```php:line-numbers=7953
	return (bool) $value;
```

残りは `(bool) $value` で変換します。数値の `0`、空文字 `""`、`null` は `false`、それ以外は `true` になります。

具体例として、`"false"` は `false` に、`"0"` は `(bool)` の変換で `false` に、`"no"` は `true` になります。`"no"` が `true` になる点は、後の「ここがすごい」で説明します。

## ここがすごい

### PHP の `(bool)` が見落とす「"false"」だけを補っている

PHP で `(bool) "false"` と書くと、結果は `true` になります。空でない文字列はすべて `true` とみなされるからです。URL のクエリ `?enabled=false` のように、文字列の `"false"` が来る場面は多いので、この関数はそれを特別に扱っています。

### 「よくある入力だけ」を正確に扱う

`"no"` や `"off"` まで `false` にすると、予想外の値を変換してしまう恐れがあります。この関数は、`"false"` と、PHP の標準の `(bool)` で正しく変換できるものだけに絞っています。範囲を絞ることで、思いがけない挙動を防いでいます。

### 型の違いを 1 つの関数に集めている

呼び出し側は、真偽値でも文字列でも数値でも、この関数に渡せば真偽値が返ります。型の違いを受け口で吸収することで、後の処理は `if` の条件に直接使えます。

## まとめ

- 文字列の `"false"` は、`(bool)` では `true` になるので、別に扱う必要がある。
- 変換の範囲を広げすぎると、予想外の値まで変わってしまう。
- 受け口で型をそろえると、後の `if` がそのまま書ける。
- 大文字・小文字の違いは `strtolower` で吸収すると確実。
