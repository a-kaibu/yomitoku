---
title: 単語の数で文章を切り、省略記号を付ける
description: WordPress の wp_trim_words は、文章を指定した単語数で切り、末尾に省略記号を付けます。空白で分けて先頭から数える、抜粋を作るための基本的な処理です。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "3faa577cea31af1dd8308b6688a9081e111d86a3"
file: wp-includes/formatting.php
lines: [4162, 4187]
function: wp_trim_words
difficulty: 2
format: 2
tags: [文字列処理, 正規表現, 日時]
---
## ひとことで

`wp_trim_words` は、文章を指定した単語数に切り詰め、切ったあとに省略記号を付ける関数です。記事の一覧で本文の冒頭だけを見せるときに使われます。HTML タグは先に取り除かれます。

## コード

```php:line-numbers=4162
function wp_trim_words( $text, $num_words = 55, $more = null ) {
	if ( null === $more ) {
		$more = __( '&hellip;' );
	}

	$original_text = $text;
	$text          = wp_strip_all_tags( $text );
	$num_words     = (int) $num_words;

	if ( str_starts_with( wp_get_word_count_type(), 'characters' ) && preg_match( '/^utf\-?8$/i', get_option( 'blog_charset' ) ) ) {
		$text = trim( preg_replace( "/[\n\r\t ]+/", ' ', $text ), ' ' );
		preg_match_all( '/./u', $text, $words_array );
		$words_array = array_slice( $words_array[0], 0, $num_words + 1 );
		$sep         = '';
	} else {
		$words_array = preg_split( "/[\n\r\t ]+/", $text, $num_words + 1, PREG_SPLIT_NO_EMPTY );
		$sep         = ' ';
	}

	if ( count( $words_array ) > $num_words ) {
		array_pop( $words_array );
		$text = implode( $sep, $words_array );
		$text = $text . $more;
	} else {
		$text = implode( $sep, $words_array );
	}
```

## 前提知識

- **省略記号 `&hellip;`**: 三点リーダー（…）を HTML で表す書き方です。`__()` は翻訳関数で、言語に合わせた文字列に変えられます。
- **`preg_split`**: 正規表現で文字列を分ける関数です。第 3 引数で、分ける最大の数を指定できます。
- **`PREG_SPLIT_NO_EMPTY`**: 分けたあとに、空の要素を取り除く指定です。
- **`array_pop`**: 配列の最後の要素を取り除く関数です。
- **`str_starts_with`**: 文字列が指定の語で始まるかを調べる PHP の関数です。
- **`implode`**: 配列の要素を、指定の区切りでつないで文字列にする関数です。

## 何をしているか

### 1. 本文から HTML を取り除く

```php:line-numbers=4167
	$original_text = $text;
	$text          = wp_strip_all_tags( $text );
	$num_words     = (int) $num_words;
```

元の文章は `$original_text` に残しておき、表示用の `$text` からは HTML タグを取り除きます。単語数は整数に揃えます。

### 2. 単語数の数え方を決める

```php:line-numbers=4171
	if ( str_starts_with( wp_get_word_count_type(), 'characters' ) && preg_match( '/^utf\-?8$/i', get_option( 'blog_charset' ) ) ) {
```

設定によって、単語で数えるか文字で数えるかが変わります。文字で数える設定で、文字コードが UTF-8 のときは、1 文字ずつ数えます。

### 3. 単語に分ける

```php:line-numbers=4177
		$words_array = preg_split( "/[\n\r\t ]+/", $text, $num_words + 1, PREG_SPLIT_NO_EMPTY );
		$sep         = ' ';
```

通常の設定では、空白や改行で分けます。分ける数を `$num_words + 1` にしているのがポイントです。1 つだけ余分に取ると、単語数が超えているかが分かります。

### 4. 超えていれば省略記号を付ける

```php:line-numbers=4181
	if ( count( $words_array ) > $num_words ) {
		array_pop( $words_array );
		$text = implode( $sep, $words_array );
		$text = $text . $more;
```

余分に取った 1 語を `array_pop` で捨て、残りを連結して、省略記号を付けます。超えていなければ、そのまま連結して返します。

たとえば `The quick brown fox` を 2 語に切ると、`The quick&hellip;` のような結果になります（英語の場合）。

## ここがすごい

- **余分に 1 つ取って判定する**: 単語数を超えているかを、余分な 1 語で確かめています。全部を数える必要がありません。
- **HTML を先に取り除く**: タグが単語として数えられることを防ぎます。抜粋の見た目が崩れません。
- **文字数と単語数を切り替える**: 日本語のように空白で区切らない言語にも、文字単位で対応できるように分岐しています。
- **省略記号を翻訳できる**: `__()` を通すので、サイトの言語に合わせた記号にできます。

## まとめ

- 単語数で切るときは、指定より 1 つ多く取ると超過を判定できる。
- 抜粋の前には、HTML を取り除いてから数えると、見た目が崩れにくい。
- 空白で区切れない言語のために、文字単位の分岐を用意すると扱いやすい。
- 省略記号のような表示の文字列も、翻訳の仕組みに通しておくと良い。
