---
title: "リンクに nofollow を付けて、検索エンジンへの評価を控える"
description: "WordPress の wp_rel_nofollow は、本文中の a タグを探して、rel 属性に nofollow を付け加える保存前のフィルターです。"
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "f73030e78d1af6c13f70a8825d0484d49230197a"
file: wp-includes/formatting.php
lines: [3388, 3399]
function: wp_rel_nofollow
difficulty: 2
format: 2
tags: [セキュリティ, 正規表現]
---

## ひとことで

コメント欄などに書かれたリンクに、検索エンジンへの評価を渡さないための印（`rel="nofollow"`）を付ける関数です。本文の中の `<a>` タグを探して、順番に書き換えます。

## コード

::: code-group

```php:line-numbers=3388 [日本語訳]
function wp_rel_nofollow( $text ) {
	// これは保存前のフィルターなので、テキストはすでにエスケープされている。
	$text = stripslashes( $text );
	$text = preg_replace_callback(
		'|<a (.+?)>|i',
		static function ( $matches ) {
			return wp_rel_callback( $matches, 'nofollow' );
		},
		$text
	);
	return wp_slash( $text );
}
```

```php:line-numbers=3388 [原文]
function wp_rel_nofollow( $text ) {
	// This is a pre-save filter, so text is already escaped.
	$text = stripslashes( $text );
	$text = preg_replace_callback(
		'|<a (.+?)>|i',
		static function ( $matches ) {
			return wp_rel_callback( $matches, 'nofollow' );
		},
		$text
	);
	return wp_slash( $text );
}
```

:::

## 前提知識

- **HTML の `<a>` タグ**: リンクを表すタグです。`href` で行き先を、`rel` で関係の情報を指定します。
- **`rel="nofollow"`**: 「このリンクを、評価の対象にしないでください」と検索エンジンに伝える印です。
- **正規表現**: 文字列の決まった形を探すための書き方です。`|<a (.+?)>|i` は、`<a` で始まるタグを大文字小文字を問わずに探します。
- **エスケープ**: HTML として危険な文字を、無害な形に置き換えることです。

## 何をしているか

### 1. バックスラッシュの付け足しを外す

```php:line-numbers=3390
	$text = stripslashes( $text );
```

`stripslashes` で、保存のときに付けられた `\` を取り除きます。

### 2. `<a` のタグを探して、rel を付け加える

```php:line-numbers=3391
	$text = preg_replace_callback(
		'|<a (.+?)>|i',
		static function ( $matches ) {
			return wp_rel_callback( $matches, 'nofollow' );
		},
		$text
	);
```

`preg_replace_callback` で、見つけた `<a ...>` のタグを 1 つずつ、無名関数（`static function`）で書き換えます。実際に `nofollow` を付ける処理は `wp_rel_callback` に任せています。

### 3. 保存できる形に戻して返す

```php:line-numbers=3398
	return wp_slash( $text );
```

`wp_slash` で、もう一度 `\` を付けて返します。保存の処理と整合させるためです。

## ここがすごい

### 正規表現は、タグの始まりだけを狙う

```php:line-numbers=3392
		'|<a (.+?)>|i',
```

`|<a (.+?)>|i` は、`<a` の後ろから `>` までを、できるだけ短く取ります。`i` を付けて、大文字の `<A` も扱えるようにしています。

### 保存前のフィルターだと、コメントで示している

::: code-group

```php:line-numbers=3389 [日本語訳]
	// これは保存前のフィルターなので、テキストはすでにエスケープされている。
```

```php:line-numbers=3389 [原文]
	// This is a pre-save filter, so text is already escaped.
```

:::

コメントには、この関数が保存の直前に使われ、テキストがすでにエスケープ済みであることが書かれています。だから、この関数の中では HTML の安全化を重ねてしていません。読み手が前提を誤解しないための注記です。

## まとめ

この関数は、文字の付け足しと取り除きを前後に挟みながら、リンクのタグだけに `nofollow` を付ける形で書き換えます。正規表現で対象を絞り、保存の前提をコメントで残している点が読みどころです。
