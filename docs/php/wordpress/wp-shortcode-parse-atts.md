---
title: 短いコードの属性を、名前と値の組に分ける
description: WordPress の shortcode_parse_atts は、[gallery id="5" size=large] のような属性の文字列を、名前と値の連想配列にします。引用符の有無や、名前なしの値も区別して扱います。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "3faa577cea31af1dd8308b6688a9081e111d86a3"
file: wp-includes/shortcodes.php
lines: [625, 644]
function: shortcode_parse_atts
difficulty: 3
format: 2
tags: [パース, 正規表現, 文字列処理]
---
## ひとことで

`shortcode_parse_atts` は、ショートコードの属性の部分、たとえば `id="5" size=large` のような文字列を、`['id' => '5', 'size' => 'large']` の連想配列に変える関数です。引用符の付け方が違っても、同じように読み取ります。

## コード

```php:line-numbers=625
function shortcode_parse_atts( $text ) {
	$atts    = array();
	$pattern = get_shortcode_atts_regex();
	$text    = preg_replace( "/[\x{00a0}\x{200b}]+/u", ' ', $text );
	if ( preg_match_all( $pattern, $text, $match, PREG_SET_ORDER ) ) {
		foreach ( $match as $m ) {
			if ( ! empty( $m[1] ) ) {
				$atts[ strtolower( $m[1] ) ] = stripcslashes( $m[2] );
			} elseif ( ! empty( $m[3] ) ) {
				$atts[ strtolower( $m[3] ) ] = stripcslashes( $m[4] );
			} elseif ( ! empty( $m[5] ) ) {
				$atts[ strtolower( $m[5] ) ] = stripcslashes( $m[6] );
			} elseif ( isset( $m[7] ) && strlen( $m[7] ) ) {
				$atts[] = stripcslashes( $m[7] );
			} elseif ( isset( $m[8] ) && strlen( $m[8] ) ) {
				$atts[] = stripcslashes( $m[8] );
			} elseif ( isset( $m[9] ) ) {
				$atts[] = stripcslashes( $m[9] );
			}
		}
```

## 前提知識

- **ショートコード**: WordPress の投稿に `[gallery]` のような短い記法を書くと、決まった出力に置き換えられる仕組みです。
- **属性**: ショートコードに渡す設定の値です。`名前="値"` や `名前=値` の形で書きます。
- **正規表現と `preg_match_all`**: 文字列の中から、決まった形の部分を全部探す関数です。`PREG_SET_ORDER` を指定すると、見つかった 1 件ごとに、グループの一覧を配列で返します。
- **キャプチャグループ**: 正規表現の `()` で囲んだ部分です。`$m[1]` のように、一致した中の部分を番号で取り出せます。
- **`stripcslashes`**: `\` でエスケープされた文字を元に戻す PHP の関数です。
- **`strtolower`**: 文字列を小文字にする関数です。属性の名前は、大文字と小文字を区別せずに扱います。

## 何をしているか

### 1. 特殊な空白を普通の空白にする

```php:line-numbers=628
	$text    = preg_replace( "/[\x{00a0}\x{200b}]+/u", ' ', $text );
```

見た目は空白でも、実際には別の文字（改行しない空白など）が混ざることがあります。それを普通の空白に変えておくと、後の正規表現が正しく動きます。

### 2. 属性を 1 つずつ読む

```php:line-numbers=629
	if ( preg_match_all( $pattern, $text, $match, PREG_SET_ORDER ) ) {
		foreach ( $match as $m ) {
```

`$pattern` は、属性の形を表す正規表現です。`preg_match_all` で、見つかった属性を 1 件ずつ `$m` に受け取ります。

### 3. 引用符の付け方で場合分けする

```php:line-numbers=631
			if ( ! empty( $m[1] ) ) {
				$atts[ strtolower( $m[1] ) ] = stripcslashes( $m[2] );
			} elseif ( ! empty( $m[3] ) ) {
				$atts[ strtolower( $m[3] ) ] = stripcslashes( $m[4] );
			} elseif ( ! empty( $m[5] ) ) {
				$atts[ strtolower( $m[5] ) ] = stripcslashes( $m[6] );
```

グループ 1 から 6 は、「名前」と「値」の組を表します。3 組は、ダブルクォート、シングルクォート、引用符なしの書き方に対応します。どれに当たるかは、空でないグループで判断します。

名前は `strtolower` で小文字にそろえ、値は `stripcslashes` でエスケープを外します。

### 4. 名前のない値は配列の末尾に足す

```php:line-numbers=637
			} elseif ( isset( $m[7] ) && strlen( $m[7] ) ) {
				$atts[] = stripcslashes( $m[7] );
```

名前がなく、値だけが書かれている場合は、`$atts[]` の形で配列の末尾に追加します。キーは数字の番号になります。

## ここがすごい

- **書き方の揺れを 1 つの正規表現で吸収する**: 引用符のあり・なし、名前の有無を、1 回の検索で読み取れるようにしています。書き手が多少ずれた書き方をしても、読み取れることが多いです。
- **名前と値を型で分ける**: 名前付きの属性は連想配列、名前のない値は通常の配列に入ります。呼び出し側は、どちらを使うかを明確に選べます。
- **結果の揺れを正規化する**: 名前は小文字、値はエスケープを外す、という処理を通すので、後の比較がしやすくなります。
- **空の値を扱う**: `! empty` と `strlen` で、空の値と「無い」を区別しています。

## まとめ

- 属性の文字列は、正規表現で書き方の種類ごとに読み分けると扱いやすい。
- 名前は小文字、値はエスケープを外す、と正規化しておくと比較がしやすい。
- 名前のない値は、数字のキーで配列の末尾に足すと、順番が保たれる。
- 見た目の空白を正規化すると、正規表現の結果が安定する。
