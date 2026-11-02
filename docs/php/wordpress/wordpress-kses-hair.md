---
title: "HTML タグの属性を読み取り、安全な形に組み直す"
description: "WordPress の wp_kses_hair は、HTML タグの属性文字列を解析して、名前と値の一覧にします。URL の属性は危ない scheme を取り除き、特殊な文字を実体参照に直して組み直します。"
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "f73030e78d1af6c13f70a8825d0484d49230197a"
file: wp-includes/kses.php
lines: [2803, 2843]
function: wp_kses_hair
difficulty: 3
format: 2
tags: [パース, セキュリティ, 防御的プログラミング]
---

## ひとことで

`wp_kses_hair` は、HTML のタグの中の **属性**（`href="..."` や `disabled` のような部分）を読み取って、安全な形に組み直す関数です。投稿の HTML をサイトに出す前の、掃除の一部として使われます。

## コード

::: code-group

```php:line-numbers=2803 [日本語訳]
function wp_kses_hair( $attr, $allowed_protocols ) {
	$attributes = array();
	$uris       = wp_kses_uri_attributes();

	$processor = new WP_HTML_Tag_Processor( "<wp {$attr}>" );
	$processor->next_token();

	$attribute_names = $processor->get_attribute_names_with_prefix( '' );
	if ( null === $attribute_names || 0 === count( $attribute_names ) ) {
		return $attributes;
	}

	$syntax_characters = array(
		'&' => '&amp;',
		'<' => '&lt;',
		'>' => '&gt;',
		"'" => '&apos;',
		'"' => '&quot;',
	);

	foreach ( $attribute_names as $name ) {
		$value   = $processor->get_attribute( $name );
		$is_bool = true === $value;
		if ( is_string( $value ) && in_array( $name, $uris, true ) ) {
			$value = wp_kses_bad_protocol( $value, $allowed_protocols );
		}

		// 属性の値を組み直して、正規化する。
		$recoded = $is_bool ? '' : strtr( $value, $syntax_characters );
		$whole   = $is_bool ? $name : "{$name}=\"{$recoded}\"";

		$attributes[ $name ] = array(
			'name'  => $name,
			'value' => $recoded,
			'whole' => $whole,
			'vless' => $is_bool ? 'y' : 'n',
		);
	}

	return $attributes;
}
```

```php:line-numbers=2803 [原文]
function wp_kses_hair( $attr, $allowed_protocols ) {
	$attributes = array();
	$uris       = wp_kses_uri_attributes();

	$processor = new WP_HTML_Tag_Processor( "<wp {$attr}>" );
	$processor->next_token();

	$attribute_names = $processor->get_attribute_names_with_prefix( '' );
	if ( null === $attribute_names || 0 === count( $attribute_names ) ) {
		return $attributes;
	}

	$syntax_characters = array(
		'&' => '&amp;',
		'<' => '&lt;',
		'>' => '&gt;',
		"'" => '&apos;',
		'"' => '&quot;',
	);

	foreach ( $attribute_names as $name ) {
		$value   = $processor->get_attribute( $name );
		$is_bool = true === $value;
		if ( is_string( $value ) && in_array( $name, $uris, true ) ) {
			$value = wp_kses_bad_protocol( $value, $allowed_protocols );
		}

		// Reconstruct and normalize the attribute value.
		$recoded = $is_bool ? '' : strtr( $value, $syntax_characters );
		$whole   = $is_bool ? $name : "{$name}=\"{$recoded}\"";

		$attributes[ $name ] = array(
			'name'  => $name,
			'value' => $recoded,
			'whole' => $whole,
			'vless' => $is_bool ? 'y' : 'n',
		);
	}

	return $attributes;
}
```

:::

## 前提知識

- **属性**: HTML のタグに付けられる情報です。`<a href="https://example.com">` の `href` が属性名、`https://...` が値です。
- **真偽属性**: 値を持たず、名前だけで意味を持つ属性です。`disabled` や `checked` などが該当します。
- **実体参照**: `&amp;`、`&lt;` のように、HTML で特別な意味を持つ文字を表す書き方です。
- **WP_HTML_Tag_Processor**: WordPress が持つ、HTML のタグを 1 つずつ読むためのクラスです。
- **`strtr`**: 文字列の中の文字を、対応表に従ってまとめて置き換える PHP の関数です。

## 何をしているか

### 1. 属性の名前を、読み取る

```php:line-numbers=2805
	$uris       = wp_kses_uri_attributes();

	$processor = new WP_HTML_Tag_Processor( "<wp {$attr}>" );
	$processor->next_token();

	$attribute_names = $processor->get_attribute_names_with_prefix( '' );
	if ( null === $attribute_names || 0 === count( $attribute_names ) ) {
		return $attributes;
	}
```

`WP_HTML_Tag_Processor` に、`<wp 属性>` という仮のタグを渡して、属性の名前の一覧を取り出します。属性がなければ、空の結果を返します。

### 2. URL の属性は、危ない scheme を除く

```php:line-numbers=2823
	foreach ( $attribute_names as $name ) {
		$value   = $processor->get_attribute( $name );
		$is_bool = true === $value;
		if ( is_string( $value ) && in_array( $name, $uris, true ) ) {
			$value = wp_kses_bad_protocol( $value, $allowed_protocols );
		}
```

各属性の値を取り出します。値が文字列で、`href` のような URL の属性なら、`wp_kses_bad_protocol` で許可されていない scheme を取り除きます。真偽属性（値が `true`）は、そのまま扱います。

### 3. 特殊な文字を実体参照にして、組み直す

::: code-group

```php:line-numbers=2830 [日本語訳]
		// 属性の値を組み直して、正規化する。
		$recoded = $is_bool ? '' : strtr( $value, $syntax_characters );
		$whole   = $is_bool ? $name : "{$name}=\"{$recoded}\"";
```

```php:line-numbers=2830 [原文]
		// Reconstruct and normalize the attribute value.
		$recoded = $is_bool ? '' : strtr( $value, $syntax_characters );
		$whole   = $is_bool ? $name : "{$name}=\"{$recoded}\"";
```

:::

`strtr` で、`&`、`<`、`>`、`'`、`"` を実体参照に直します。真偽属性は値を持たないので、名前だけを残します。そうでなければ、`name="値"` の形に組み直します。

```php:line-numbers=2834
		$attributes[ $name ] = array(
			'name'  => $name,
			'value' => $recoded,
			'whole' => $whole,
			'vless' => $is_bool ? 'y' : 'n',
		);
	}
```

名前、値、組み直した文字列、真偽かどうかを 1 つの配列にまとめて、属性の一覧に入れます。

## ここがすごい

### 解析に、HTML の専用の部品を使っている

HTML の属性は、引用符の使い方や空白の入り方が、人によって様々です。正規表現で書こうとすると、抜け道が出やすくなります。この関数は、HTML を読むための専用の部品（`WP_HTML_Tag_Processor`）に解析を任せています。

### 出力は、必ず「組み直し」を通す

読み取った値を、そのまま出力に使うと、引用符を閉じて別の属性を追加されるおそれがあります。`strtr` で特殊な文字を実体参照に変えてから組み直すので、値は必ず 1 つの属性の中に収まります。入力の形に頼らず、出力の形で安全を作る考え方です。

### 真偽属性を、別に扱う

値のない属性は、`name=""` と書くと意味が変わることがあります。`vless`（値なしの印）を付けて、組み直しでも値なしのまま残す工夫があります。

## まとめ

- HTML の解析は、正規表現ではなく専用の部品に任せると抜け道が減る。
- 出力は、特殊な文字を実体参照にしてから組み直すと、安全な形になる。
- 値のない属性は、その形を保つ印を付けておくと書き直しで壊れない。
- 危ない値は、属性の種類（URL かどうか）に応じて個別に処理する。
