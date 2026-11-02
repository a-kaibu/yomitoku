---
title: 文字列の引用符にバックスラッシュを付け、配列にも再帰的に適用する
description: WordPress の wp_slash は、文字列の ' と " の前に \ を付けて、データベースに安全に渡せる形にします。配列の中の値にも、自分自身を再帰的に呼んで同じ処理を行います。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "3faa577cea31af1dd8308b6688a9081e111d86a3"
file: wp-includes/formatting.php
lines: [5933, 5943]
function: wp_slash
difficulty: 2
format: 2
tags: [防御的プログラミング, 文字列処理, 再帰]
---
## ひとことで

`wp_slash` は、データベースへ保存する値に含まれる引用符（`'` や `"`）の前に、`\` を付ける関数です。値が配列なら、その中の各要素にも同じ処理を適用します。WordPress が内部で、古いエスケープの仕組みを前提にしている場面で使われます。

## コード

```php:line-numbers=5933
function wp_slash( $value ) {
	if ( is_array( $value ) ) {
		return array_map( 'wp_slash', $value );
	}

	if ( is_string( $value ) ) {
		return addslashes( $value );
	}

	return $value;
}
```

## 前提知識

- **エスケープ**: 文字列の中の特別な文字を、そのまま文字として扱えるように、前に `\` を付けることです。`'` は文字列の区切りに使われるので、そのままでは値として書けません。
- **`addslashes`**: 引用符（`'`、`"`）、バックスラッシュ、NUL 文字の前に `\` を付ける PHP の関数です。
- **`array_map`**: 配列の各要素に、指定した関数を適用して新しい配列を作る関数です。
- **再帰**: 関数の中で、自分自身を呼ぶことです。配列の中に配列があっても、同じ処理が深い所まで届きます。
- **`is_array` と `is_string`**: 値の型を調べる関数です。

## 何をしているか

### 1. 配列なら、要素ごとに同じ関数を呼ぶ

```php:line-numbers=5934
	if ( is_array( $value ) ) {
		return array_map( 'wp_slash', $value );
	}
```

値が配列なら、`array_map` で各要素に `wp_slash` を適用します。要素がまた配列なら、同じ処理がさらに中へ進みます。

`'wp_slash'` は関数名を文字列で渡しています。`array_map` は、この名前の関数を各要素に呼びます。

### 2. 文字列なら、エスケープする

```php:line-numbers=5938
	if ( is_string( $value ) ) {
		return addslashes( $value );
	}
```

文字列の値は、`addslashes` で引用符の前にバックスラッシュを付けます。`O'Reilly` は `O\'Reilly` になります。

### 3. 文字列以外は、そのまま返す

```php:line-numbers=5942
	return $value;
```

整数や `null` などは、エスケープが不要なので、変えずに返します。

## ここがすごい

- **配列を再帰で一気に処理**: 入れ子の配列の深さに関係なく、同じ 3 つの分岐で済みます。ループを深く書く必要がありません。
- **型で分ける**: 配列、文字列、それ以外の 3 つを型で分けています。数値や `null` を誤ってエスケープすることがありません。
- **元の配列を壊さない**: `array_map` は新しい配列を返すので、呼び出し元の値は変わりません。
- **名前が役割を表す**: `wp_slash` は「スラッシュを付ける」側の関数です。対になる `wp_unslash` が、その逆を行います。

## まとめ

- 文字列の引用符は、`addslashes` でバックスラッシュを付けると安全に扱える。
- 配列は `array_map` と再帰で、中身まで同じ処理を行える。
- 型で分けると、エスケープが不要な値を余計に変えずに済む。
- 対になる関数（`wp_unslash`）と並べると、どちらの役割か分かりやすい。
