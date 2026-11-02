---
title: Windows と Linux のパスの書き方を、スラッシュにそろえる
description: WordPress の wp_normalize_path は、Windows の「\\」区切りのパスを「/」にそろえ、連続する区切りを 1 つにまとめます。結果を静的な配列に覚えておくキャッシュも使っています。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "f73030e78d1af6c13f70a8825d0484d49230197a"
file: wp-includes/functions.php
lines: [2229, 2259]
function: wp_normalize_path
difficulty: 2
format: 2
tags: [文字列処理, キャッシュ, 移植性]
---

## ひとことで

`wp_normalize_path` は、Windows と Linux で違うパスの書き方を、**スラッシュ（/）だけの形にそろえる** 関数です。プラグインやテーマが、同じファイルを異なる書き方で指定しても、比べられるようにします。

## コード

::: code-group

```php:line-numbers=2229 [日本語訳]
function wp_normalize_path( $path ): string {
	$path = (string) $path;

	static $cache = array();
	if ( isset( $cache[ $path ] ) ) {
		return $cache[ $path ];
	}

	$original_path = $path;
	$wrapper       = '';

	if ( wp_is_stream( $path ) ) {
		list( $wrapper, $path ) = explode( '://', $path, 2 );

		$wrapper .= '://';
	}

	// '/' に統一する。
	$path = str_replace( '\\', '/', $path );

	// 連続したスラッシュを 1 つにまとめる。ネットワーク共有のために、先頭の 2 つは残す。
	$path = (string) preg_replace( '|(?<=.)/+|', '/', $path );

	// Windows のパスは、ドライブ文字を大文字にする。
	if ( ':' === substr( $path, 1, 1 ) ) {
		$path = ucfirst( $path );
	}

	$cache[ $original_path ] = $wrapper . $path;
	return $cache[ $original_path ];
}
```

```php:line-numbers=2229 [原文]
function wp_normalize_path( $path ): string {
	$path = (string) $path;

	static $cache = array();
	if ( isset( $cache[ $path ] ) ) {
		return $cache[ $path ];
	}

	$original_path = $path;
	$wrapper       = '';

	if ( wp_is_stream( $path ) ) {
		list( $wrapper, $path ) = explode( '://', $path, 2 );

		$wrapper .= '://';
	}

	// Standardize all paths to use '/'.
	$path = str_replace( '\\', '/', $path );

	// Replace multiple slashes down to a singular, allowing for network shares having two slashes.
	$path = (string) preg_replace( '|(?<=.)/+|', '/', $path );

	// Windows paths should uppercase the drive letter.
	if ( ':' === substr( $path, 1, 1 ) ) {
		$path = ucfirst( $path );
	}

	$cache[ $original_path ] = $wrapper . $path;
	return $cache[ $original_path ];
}
```

:::

## 前提知識

- **パスの区切り**: Windows は `\`、Linux や macOS は `/` を使います。PHP は両方を受け付けます。
- **ネットワーク共有**: Windows の `\\server\share` のように、先頭に区切りを 2 つ置くパスです。
- **`preg_replace`（後読み）**: `(?<=.)` は「直前に 1 文字ある」という条件です。先頭の区切りは対象外になります。
- **`static` 変数**: 関数の中に残る変数です。ここではキャッシュとして使っています。
- **ストリームのラッパー**: `phar://` や `http://` のように、パスの前に付く「ラッパー」の名前です。

## 何をしているか

### 1. 結果があれば、すぐに返す

```php:line-numbers=2232
	static $cache = array();
	if ( isset( $cache[ $path ] ) ) {
		return $cache[ $path ];
	}
```

`static $cache` は、この関数の結果を覚えておく配列です。同じパスが 2 回目以降に来たら、計算せずに結果を返します。

### 2. ラッパーの部分を、先に分けておく

```php:line-numbers=2237
	$original_path = $path;
	$wrapper       = '';

	if ( wp_is_stream( $path ) ) {
		list( $wrapper, $path ) = explode( '://', $path, 2 );

		$wrapper .= '://';
	}
```

`phar://` や `http://` のようなストリームの場合は、`://` より前の部分を `$wrapper` に分けておきます。残りのパスだけを整えて、最後に付け直します。

### 3. 区切りを `/` に統一し、連続をまとめる

::: code-group

```php:line-numbers=2246 [日本語訳]
	// '/' に統一する。
	$path = str_replace( '\\', '/', $path );

	// 連続したスラッシュを 1 つにまとめる。ネットワーク共有のために、先頭の 2 つは残す。
	$path = (string) preg_replace( '|(?<=.)/+|', '/', $path );
```

```php:line-numbers=2246 [原文]
	// Standardize all paths to use '/'.
	$path = str_replace( '\\', '/', $path );

	// Replace multiple slashes down to a singular, allowing for network shares having two slashes.
	$path = (string) preg_replace( '|(?<=.)/+|', '/', $path );
```

:::

`str_replace('\\', '/', $path)` で、Windows の区切りを `/` に変えます。そのあと `preg_replace('|(?<=.)/+|', '/', $path)` で、先頭以外の連続したスラッシュを 1 つにまとめます。先頭の `//` はネットワーク共有のために残します。

### 4. Windows のドライブ文字を大文字にする

::: code-group

```php:line-numbers=2252 [日本語訳]
	// Windows のパスは、ドライブ文字を大文字にする。
	if ( ':' === substr( $path, 1, 1 ) ) {
		$path = ucfirst( $path );
	}
```

```php:line-numbers=2252 [原文]
	// Windows paths should uppercase the drive letter.
	if ( ':' === substr( $path, 1, 1 ) ) {
		$path = ucfirst( $path );
	}
```

:::

2 文字目が `:` なら、`C:` のようなドライブ名です。`ucfirst` で先頭を大文字にします。

具体例として `c:\\Users\\\\me` は、`C:/Users/me` になります。

## ここがすごい

### 「同じ場所」を、同じ文字列にする

同じファイルでも、`C:\\Users` と `c:/Users` と書かれると、文字列としては別物です。この関数で書き方をそろえれば、パスの比較や、キャッシュの鍵として安心して使えます。

### 計算結果を、静的な配列に覚えておく

パスの変換は、ファイルの読み込みのたびに行われるので、同じ入力が何度も来ます。`static $cache` で結果を覚えておけば、2 回目以降は正規表現の処理を省けます。

### 例外的な場所を、わざわざ残す

先頭の `//` を消してしまうと、ネットワーク共有のパスが壊れます。`(?<=.)` の後読みで、先頭の区切りを対象外にしたのは、この例外を守るためです。一般的なルールの中で、例外を丁寧に扱う良い例です。

## まとめ

- パスの区切りは、1 つの記号にそろえると比べやすくなる。
- 正規表現の後読み `(?<=.)` で、先頭だけを対象外にできる。
- 同じ入力が多い変換は、静的な配列に覚えておくと速くなる。
- ネットワーク共有のような例外は、一般ルールの中で守ると壊れにくい。
