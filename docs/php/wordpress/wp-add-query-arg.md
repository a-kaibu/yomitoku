---
title: URLのクエリに、値を1つ足すか上書きする
description: WordPress の add_query_arg は、URL の ? 以降のパラメータに値を追加したり、同じ名前の値を書き換えたりします。引数の数で 2 通りの呼び方を受け付け、最後に順番をそろえて組み立て直します。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "3faa577cea31af1dd8308b6688a9081e111d86a3"
file: wp-includes/functions.php
lines: [1167, 1210]
function: add_query_arg
difficulty: 3
format: 2
tags: [ネットワーク, 文字列処理, API設計]
---
## ひとことで

`add_query_arg` は、URL のクエリ文字列（`?page=2` のような部分）に、新しいパラメータを足したり、同じ名前の値を置き換えたりする関数です。ページ送りのリンクや、絞り込みのリンクを作るときに使われます。

## コード

```php:line-numbers=1167
function add_query_arg( ...$args ) {
	if ( is_array( $args[0] ) ) {
		if ( count( $args ) < 2 || false === $args[1] ) {
			$uri = $_SERVER['REQUEST_URI'];
		} else {
			$uri = $args[1];
		}
	} else {
		if ( count( $args ) < 3 || false === $args[2] ) {
			$uri = $_SERVER['REQUEST_URI'];
		} else {
			$uri = $args[2];
		}
	}

	$frag = strstr( $uri, '#' );
	if ( $frag ) {
		$uri = substr( $uri, 0, -strlen( $frag ) );
	} else {
		$frag = '';
	}

	if ( 0 === stripos( $uri, 'http://' ) ) {
		$protocol = 'http://';
		$uri      = substr( $uri, 7 );
	} elseif ( 0 === stripos( $uri, 'https://' ) ) {
		$protocol = 'https://';
		$uri      = substr( $uri, 8 );
	} else {
		$protocol = '';
	}

	if ( str_contains( $uri, '?' ) ) {
		list( $base, $query ) = explode( '?', $uri, 2 );
		$base                .= '?';
	} elseif ( $protocol || ! str_contains( $uri, '=' ) ) {
		$base  = $uri . '?';
		$query = '';
	} else {
		$base  = '';
		$query = $uri;
	}

	wp_parse_str( $query, $qs );
```

## 前提知識

- **クエリ文字列**: URL の `?` 以降で、`名前=値` の組を `&` でつないだ部分です。`?page=2&sort=new` のように書きます。
- **フラグメント**: URL の `#` 以降の部分です。ブラウザ内の位置を表し、サーバーには送られません。
- **可変長引数 `...$args`**: 引数を配列としてまとめて受け取る書き方です。呼び出し方によって、引数の数が変わる関数に使われます。
- **`stripos`**: 大文字と小文字を区別しない位置検索の関数です。
- **`list(...)`**: 配列の要素を、複数の変数に一度に入れる書き方です。

## 何をしているか

### 1. 引数の形から URL を決める

```php:line-numbers=1168
	if ( is_array( $args[0] ) ) {
		if ( count( $args ) < 2 || false === $args[1] ) {
			$uri = $_SERVER['REQUEST_URI'];
```

この関数は、2 通りの呼び方を受け付けます。1 つは、連想配列で複数の値を一度に渡す形、もう 1 つは、名前と値を 1 組ずつ渡す形です。どちらの形かは、最初の引数が配列かどうかで判断します。

URL を省略すると、現在のページの `REQUEST_URI` が使われます。

### 2. フラグメントを外しておく

```php:line-numbers=1182
	$frag = strstr( $uri, '#' );
	if ( $frag ) {
		$uri = substr( $uri, 0, -strlen( $frag ) );
```

`#` 以降を取り出して、いったん `$frag` に退避します。クエリの処理が終わったら、最後に戻します。こうしないと、`#` より後ろの部分がクエリとして扱われてしまいます。

### 3. プロトコルとクエリを分ける

```php:line-numbers=1199
	if ( str_contains( $uri, '?' ) ) {
		list( $base, $query ) = explode( '?', $uri, 2 );
		$base                .= '?';
```

`?` があれば、そこで URL を 2 つに分けます。`https://example.com/?page=2` は、基底が `example.com/`、クエリが `page=2` になります。

最後に `wp_parse_str( $query, $qs )` で、クエリを連想配列 `$qs` にします。ここまでで、既存のパラメータが配列として手に入ります。

## ここがすごい

- **引数の形を自動で判別する**: 呼び出し側は、1 組の値でも複数の値でも、同じ関数名で書けます。
- **フラグメントを退避する**: `#` より後ろを先に切り離すので、クエリの解析が誤らずに済みます。
- **既存のパラメータを壊さない**: いったん配列にしてから値を足すので、他のパラメータはそのまま残ります。
- **記号の揺れを整える**: `http` と `https` を分けて扱い、最後に組み立て直すので、URL の形が崩れにくくなります。

## まとめ

- URL にパラメータを足す処理は、基底、クエリ、フラグメントに分けると整理できる。
- クエリを連想配列にすると、既存の値を残したまま値だけを変えられる。
- 引数の形を判別すると、同じ名前で複数の呼び方を提供できる。
- 途中の処理で退避したものは、最後に戻す約束を守る。
