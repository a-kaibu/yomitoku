---
title: "「javascript:」を、何重に隠されていても取り除く"
description: "WordPress の wp_kses_bad_protocol は、URL の scheme を、繰り返し読み直して危ない形が残らないか確かめます。実体参照で何重に隠されていても、最大 6 回までくり返して取り除きます。"
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "f73030e78d1af6c13f70a8825d0484d49230197a"
file: wp-includes/kses.php
lines: [3078, 3101]
function: wp_kses_bad_protocol
difficulty: 3
format: 2
tags: [セキュリティ, 防御的プログラミング, イテレータ]
---

## ひとことで

`wp_kses_bad_protocol` は、URL の **scheme**（`https:` などの部分）を調べて、許可されていない危ない scheme（`javascript:` など）を取り除く関数です。攻撃者が実体参照で何重にも隠しても、くり返して見つけ出します。

## コード

::: code-group

```php:line-numbers=3078 [日本語訳]
function wp_kses_bad_protocol( $content, $allowed_protocols ) {
	$content = wp_kses_no_null( $content );

	// https:// や http:// で始まる、よくある場合はすぐに返す。
	if (
		( str_starts_with( $content, 'https://' ) && in_array( 'https', $allowed_protocols, true ) ) ||
		( str_starts_with( $content, 'http://' ) && in_array( 'http', $allowed_protocols, true ) )
	) {
		return $content;
	}

	$iterations = 0;

	do {
		$original_content = $content;
		$content          = wp_kses_bad_protocol_once( $content, $allowed_protocols );
	} while ( $original_content !== $content && ++$iterations < 6 );

	if ( $original_content !== $content ) {
		return '';
	}

	return $content;
}
```

```php:line-numbers=3078 [原文]
function wp_kses_bad_protocol( $content, $allowed_protocols ) {
	$content = wp_kses_no_null( $content );

	// Short-circuit if the string starts with `https://` or `http://`. Most common cases.
	if (
		( str_starts_with( $content, 'https://' ) && in_array( 'https', $allowed_protocols, true ) ) ||
		( str_starts_with( $content, 'http://' ) && in_array( 'http', $allowed_protocols, true ) )
	) {
		return $content;
	}

	$iterations = 0;

	do {
		$original_content = $content;
		$content          = wp_kses_bad_protocol_once( $content, $allowed_protocols );
	} while ( $original_content !== $content && ++$iterations < 6 );

	if ( $original_content !== $content ) {
		return '';
	}

	return $content;
}
```

:::

## 前提知識

- **scheme**: URL の先頭にある `https:` や `javascript:` などの部分です。ブラウザがどう扱うかを決めます。
- **実体参照**: `&#106;` のように、文字をコードの番号で表す HTML の書き方です。ブラウザは、これを元の文字として解釈します。
- **`do ... while`**: 先に 1 回実行してから、条件を調べて繰り返す書き方です。
- **`$original_content !== $content`**: 変化したかどうかを比べる判定です。変化がなくなったら、安定したとみなします。
- **`str_starts_with`**: 文字列が指定した文字で始まるかを調べる PHP の関数です。

## 何をしているか

### 1. よくある安全な形は、すぐに返す

::: code-group

```php:line-numbers=3081 [日本語訳]
	// https:// や http:// で始まる、よくある場合はすぐに返す。
	if (
		( str_starts_with( $content, 'https://' ) && in_array( 'https', $allowed_protocols, true ) ) ||
		( str_starts_with( $content, 'http://' ) && in_array( 'http', $allowed_protocols, true ) )
	) {
		return $content;
	}
```

```php:line-numbers=3081 [原文]
	// Short-circuit if the string starts with `https://` or `http://`. Most common cases.
	if (
		( str_starts_with( $content, 'https://' ) && in_array( 'https', $allowed_protocols, true ) ) ||
		( str_starts_with( $content, 'http://' ) && in_array( 'http', $allowed_protocols, true ) )
	) {
		return $content;
	}
```

:::

`https://` や `http://` で始まり、その scheme が許可されていれば、ここで終わりです。大半の URL はこの形なので、くり返しの処理を省けます。

### 2. 変化がなくなるまで、取り除きを続ける

```php:line-numbers=3089
	$iterations = 0;

	do {
		$original_content = $content;
		$content          = wp_kses_bad_protocol_once( $content, $allowed_protocols );
	} while ( $original_content !== $content && ++$iterations < 6 );
```

`wp_kses_bad_protocol_once` で、scheme を 1 回ずつ調べて取り除きます。結果が変わらなくなるか、6 回に達するまで繰り返します。変わった間は、実体参照を解いた後の文字が、また危ない形になっているかもしれないからです。

### 3. まだ変わり続けるなら、空にする

```php:line-numbers=3096
	if ( $original_content !== $content ) {
		return '';
	}

	return $content;
```

6 回たっても変化が続くなら、判定できない複雑な形です。そのときは安全のため、空の文字列を返します。変化がなければ、残った内容を返します。

具体例として `javascript&#58;alert(1)` のように隠された scheme は、1 回目の処理で `javascript:` の形が取り出され、許可されていなければ取り除かれます。

## ここがすごい

### 「安定するまで」読み直す

攻撃者は、`&amp;#106;` のように、実体参照を二重に書くことがあります。1 回だけ調べると、解いた後の形を見落とします。この関数は、結果が変わらなくなるまで同じ検査を繰り返します。解く順番を気にせず、見た目を読み切る工夫です。

### 回数の上限で、無限に続けない

同じ処理をいつまでも続けると、悪意のある入力で処理が止まってしまいます。6 回という上限を決めて、それ以上は「危ない」とみなします。安全の判断と、処理時間の両方を守っています。

### よくある形を、先に通す

```php:line-numbers=3082
	if (
		( str_starts_with( $content, 'https://' ) && in_array( 'https', $allowed_protocols, true ) ) ||
		( str_starts_with( $content, 'http://' ) && in_array( 'http', $allowed_protocols, true ) )
	) {
		return $content;
	}
```

大半の URL は `https://` か `http://` です。その場合は、くり返しを省いて早く返します。「普通のものは速く、怪しいものは丁寧に」という使い分けです。

## まとめ

- 隠された文字列は、結果が安定するまで同じ検査をくり返すと見落としにくい。
- くり返しには上限を決めて、悪意のある入力でも止まらないようにする。
- 上限を超えても変化が続くなら、安全側に倒して空にする。
- よくある安全な入力は、早く返して処理を省くと速い。
