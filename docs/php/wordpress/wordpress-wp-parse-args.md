---
title: 既定値と受け取った値を、1 行でマージする
description: WordPress の wp_parse_args は、オプションの配列や文字列を受け取り、既定値とマージして返します。オブジェクト、配列、クエリ文字列のどれでも同じように扱えるのが特徴です。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "f73030e78d1af6c13f70a8825d0484d49230197a"
file: wp-includes/functions.php
lines: [5071, 5084]
function: wp_parse_args
difficulty: 2
format: 2
tags: [イディオム, 標準ライブラリ, 文字列処理]
---

## ひとことで

`wp_parse_args` は、WordPress の関数に渡される「オプション」を整える関数です。引数が配列でもオブジェクトでも、`a=1&b=2` のようなクエリ文字列でも受け付け、既定値とマージして返します。ほとんどの WordPress のテンプレート関数の最初で使われている、非常に大事な小道具です。

## コード

```php:line-numbers=5071
function wp_parse_args( $args, $defaults = array() ): array {
	if ( is_object( $args ) ) {
		$parsed_args = get_object_vars( $args );
	} elseif ( is_array( $args ) ) {
		$parsed_args =& $args;
	} else {
		wp_parse_str( $args, $parsed_args );
	}

	if ( is_array( $defaults ) && $defaults ) {
		return array_merge( $defaults, $parsed_args );
	}
	return $parsed_args;
}
```

## 前提知識

- **既定値（デフォルト）**: オプションを省略したときに使う値です。`$defaults` 配列に入れておきます。
- **`array_merge`**: 2 つの配列をつなぐ関数です。同じキーがあると、後ろの配列の値が勝ちます。
- **参照 `=&`**: 変数どうしを同じ値に結ぶ代入です。`$parsed_args =& $args;` では、コピーを作らずに同じ配列を指します。
- **クエリ文字列**: `title=Hello&count=3` のように、キーと値を `&` で並べた文字列です。URL の後ろによく付きます。
- **`is_object` と `get_object_vars`**: オブジェクトかどうかを調べ、そのプロパティを配列として取り出す関数です。

## 何をしているか

### 1. 受け取った形を、配列に変える

```php:line-numbers=5072
	if ( is_object( $args ) ) {
		$parsed_args = get_object_vars( $args );
	} elseif ( is_array( $args ) ) {
		$parsed_args =& $args;
	} else {
		wp_parse_str( $args, $parsed_args );
	}
```

引数がオブジェクトなら `get_object_vars` で、プロパティを連想配列にします。配列ならそのまま使い、それ以外（クエリ文字列）なら `wp_parse_str` で解析して `$parsed_args` に入れます。どの形でも、あとは配列として扱えます。

`$parsed_args =& $args;` の `&` は、コピーではなく同じ配列を指すという意味です。この時点では両方が同じ中身を持つので、無駄なコピーが起きません。

### 2. 既定値とマージする

```php:line-numbers=5080
	if ( is_array( $defaults ) && $defaults ) {
		return array_merge( $defaults, $parsed_args );
	}
	return $parsed_args;
```

既定値が配列で、空ではなければ `array_merge($defaults, $parsed_args)` で結合します。後ろの `$parsed_args` の値が優先されるので、利用者が指定した値だけが既定値を上書きします。指定がなければ、既定値がそのまま残ります。

具体例として、既定値が `['count' => 10, 'title' => '']` で、引数が `title=Hello` のクエリ文字列だったとしましょう。結果は `['count' => 10, 'title' => 'Hello']` になります。

## ここがすごい

### 形の違いを、先頭の分岐だけで吸収している

WordPress には、オプションを配列で渡す関数、文字列で渡す関数、オブジェクトで渡す関数が混在しています。この関数は最初の 3 分岐で、どの形も「配列」に変換します。その後の処理は、形を気にせず書けます。呼び出し側の柔軟さと、関数の中の単純さを両立しています。

### 参照代入で、無駄なコピーを避けている

`$parsed_args =& $args;` は、配列を丸ごとコピーしないための書き方です。ただし、この関数の中では `$args` を書き換えないので、参照である必要は実は小さいです。それでも参照にしているのは、大きな配列を受け取ったときに、コピーの回数を減らすためです。

### 既定値を先に置く、マージの順番

`array_merge($defaults, $parsed_args)` の順番が肝心です。既定値を先、利用者の値を後にすることで、利用者の指定が勝ちます。逆にすると、既定値が常に勝ってしまい、オプションが効きません。

## まとめ

- 形の違う引数は、最初に 1 つの形にそろえると後が楽になる。
- 既定値とマージするときは、既定値を先・利用者の値を後にすると、指定が勝つ。
- 参照代入（`=&`）は、大きな配列を扱うときに、コピーの回数を減らすのに使える。
- クエリ文字列も、同じ関数で受け付けると呼び出し側が楽になる。
