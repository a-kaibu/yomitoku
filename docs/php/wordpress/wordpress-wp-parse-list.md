---
title: "カンマや空白で区切られた文字列を配列にほどく"
description: "WordPress の wp_parse_list は、\"a, b c\" のようなカンマと空白で区切られた文字列を配列にします。配列が渡されたときは、中身が文字列や数値かだけを確かめます。"
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "f73030e78d1af6c13f70a8825d0484d49230197a"
file: wp-includes/functions.php
lines: [5101, 5113]
function: wp_parse_list
difficulty: 2
format: 2
tags: [文字列処理, 正規表現, 防御的プログラミング]
---

## ひとことで

`wp_parse_list` は、`"news, sports  politics"` のように **カンマや空白で区切られた文字列** を、`['news', 'sports', 'politics']` という配列にする関数です。WordPress の設定やショートコードの属性で、「カテゴリ ID のリスト」のような値を読むときに使われます。

## コード

::: code-group

```php:line-numbers=5101 [日本語訳]
function wp_parse_list( $input_list ): array {
	if ( is_int( $input_list ) ) {
		$input_list = array( (string) $input_list );
	} elseif ( ! is_array( $input_list ) ) {
		$parsed_list = preg_split( '/[\s,]+/', $input_list, -1, PREG_SPLIT_NO_EMPTY );
		return is_array( $parsed_list ) ? $parsed_list : array();
	}

	// 配列の中身がすべてスカラー（文字列や数値など）かを確かめる。
	$input_list = array_filter( $input_list, 'is_scalar' );

	return $input_list;
}
```

```php:line-numbers=5101 [原文]
function wp_parse_list( $input_list ): array {
	if ( is_int( $input_list ) ) {
		$input_list = array( (string) $input_list );
	} elseif ( ! is_array( $input_list ) ) {
		$parsed_list = preg_split( '/[\s,]+/', $input_list, -1, PREG_SPLIT_NO_EMPTY );
		return is_array( $parsed_list ) ? $parsed_list : array();
	}

	// Validate all entries of the list are scalar.
	$input_list = array_filter( $input_list, 'is_scalar' );

	return $input_list;
}
```

:::

## 前提知識

- **正規表現**: 文字の並びのパターンを表す書き方です。`/[\s,]+/` は「空白文字またはカンマが 1 つ以上続く部分」を表します。
- **`preg_split`**: 正規表現で文字列を区切って配列にする PHP の関数です。
- **`PREG_SPLIT_NO_EMPTY`**: 区切った結果のうち、空の文字列を取り除くオプションです。
- **`is_scalar`**: 値が文字列・整数・小数・真偽値のどれかかを調べる関数です。配列やオブジェクトは `false` です。
- **`array_filter`**: 配列の要素を条件で絞り込む関数です。

## 何をしているか

### 1. 整数なら、文字列の配列にする

```php:line-numbers=5102
	if ( is_int( $input_list ) ) {
		$input_list = array( (string) $input_list );
```

`"5"` のような整数は、まず文字列にして 1 要素の配列にします。

### 2. 文字列なら、正規表現で区切る

```php:line-numbers=5104
	} elseif ( ! is_array( $input_list ) ) {
		$parsed_list = preg_split( '/[\s,]+/', $input_list, -1, PREG_SPLIT_NO_EMPTY );
		return is_array( $parsed_list ) ? $parsed_list : array();
	}
```

配列でもない文字列なら、`preg_split('/[\s,]+/', ...)` でカンマと空白の塊を区切りに使います。`PREG_SPLIT_NO_EMPTY` を指定しているので、先頭や末尾の区切りで生まれた空の要素は入りません。`"a,,b"` のように区切りが続いても、`a` と `b` だけが残ります。

### 3. 配列なら、中身が単純な値かだけを確かめる

::: code-group

```php:line-numbers=5109 [日本語訳]
	// 配列の中身がすべてスカラー（文字列や数値など）かを確かめる。
	$input_list = array_filter( $input_list, 'is_scalar' );

	return $input_list;
```

```php:line-numbers=5109 [原文]
	// Validate all entries of the list are scalar.
	$input_list = array_filter( $input_list, 'is_scalar' );

	return $input_list;
```

:::

すでに配列なら、`array_filter($input_list, 'is_scalar')` で、文字列や数値以外の要素を取り除きます。配列やオブジェクトが混じっていても、そこだけ除かれて残りは返ります。

具体例として `"news, sports  politics"` は、`['news', 'sports', 'politics']` になります。

## ここがすごい

### 区切りを 1 つの正規表現にまとめている

区切り文字がカンマ、空白、タブ、改行などさまざまでも、`[\s,]+` の 1 つのパターンで扱えます。`+` が「続く限りまとめて 1 つの区切り」にしてくれるので、「カンマと空白が混ざった区切り」も自然に処理されます。

### 型の違いを、入口で整えている

入力は、整数でも、文字列でも、配列でもありえます。関数の最初で、それぞれの形を「配列」か「文字列の処理」に分けています。そのため、呼び出し側は値の型を気にせずに済みます。

### 配列の中身を無理に変換しない

配列が渡されたときは、中身を変換せず、単純な値だけを残しています。文字列にしてしまうと、配列の構造が壊れることがあるからです。「危ないものだけ取り除く」という控えめな方針が、読みやすさと安全さを両立させています。

## まとめ

- 区切りの種類が複数あるときは、正規表現の `[...]+` で 1 つにまとめられる。
- `PREG_SPLIT_NO_EMPTY` を付けると、区切りが続いても空の要素が残らない。
- 入力の型は、関数の入口で配列にそろえると後の処理が楽になる。
- 配列の中の「危ない値」だけを取り除くと、構造を壊さずに済む。
