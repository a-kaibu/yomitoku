---
title: サイトの文字コードに合わせて、文字数を数え分ける
description: WordPress の _mb_strlen は、サイトの文字コードが UTF-8 なら、コードポイントの数で文字数を数えます。それ以外の場合は、バイト数の strlen に任せます。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "3faa577cea31af1dd8308b6688a9081e111d86a3"
file: wp-includes/compat.php
lines: [375, 379]
function: _mb_strlen
difficulty: 2
format: 2
tags: [Unicode, 文字列処理, 移植性]
---
## ひとことで

`_mb_strlen` は、文字列の長さを文字数として返す WordPress の内部関数です。文字コードが UTF-8 なら、コードポイント（Unicode の 1 文字）の数を数えます。UTF-8 以外のサイトでは、バイト数をそのまま返します。

## コード

```php:line-numbers=375
function _mb_strlen( $str, $encoding = null ) {
	return _is_utf8_charset( $encoding ?? get_option( 'blog_charset' ) )
		? _wp_utf8_codepoint_count( $str )
		: strlen( $str );
}
```

## 前提知識

- **文字数とバイト数**: 日本語の 1 文字は、UTF-8 では 3 バイトです。`strlen` はバイト数を返すので、文字数とは違います。
- **コードポイント**: Unicode が文字に割り振った番号で、1 つの文字に対応します。
- **文字コード（charset）**: 文字をバイトの並びで表す約束です。UTF-8 や EUC-JP などがあります。WordPress では、サイトの設定（`blog_charset`）で決まります。
- **`??`**: 左側が `null` なら右側を使う演算子です。`$encoding` が省略されたときに、サイトの設定を使うために使われています。
- **三項演算子 `? :`**: 条件によって 2 つの値のどちらかを返す書き方です。

## 何をしているか

### 1. 文字コードを決める

```php:line-numbers=376
	return _is_utf8_charset( $encoding ?? get_option( 'blog_charset' ) )
```

引数の文字コードが無ければ、サイトの設定 `blog_charset` を使います。そのうえで、それが UTF-8 かどうかを `_is_utf8_charset` で調べます。

### 2. UTF-8 なら文字単位で数える

```php:line-numbers=377
		? _wp_utf8_codepoint_count( $str )
```

UTF-8 なら、`_wp_utf8_codepoint_count` で、コードポイントの数を数えます。日本語の文字列は、バイト数ではなく、文字の数で数えられます。

### 3. それ以外はバイト数を返す

```php:line-numbers=378
		: strlen( $str );
```

UTF-8 でなければ、文字の境界が分からないことがあるので、`strlen` でバイト数を返します。

## ここがすごい

- **サイトの設定に合わせる**: 文字コードを、関数の外から決めずに、サイトの設定から取り出せます。同じコードでも、設定によって正しく動きます。
- **判定と数え方を分ける**: 「UTF-8 か」を調べる部分と、数える部分を分けています。数える処理は、それぞれ専用の関数に任せています。
- **既定の経路を安全に**: UTF-8 以外では、誤った数え方をしないように、バイト数に戻します。推測で文字数を数えないのが、この関数の安全策です。
- **アンダースコアの接頭辞**: `_` で始まる名前は、WordPress の内部向けの関数を表す慣習です。利用者が直接使うものではないことが分かります。

## まとめ

- 文字数を数えるには、文字コードを先に確かめ、対応する方法で数える。
- 文字コードの既定値を、サイトの設定から取ると、設定に合わせて動く。
- 知らない文字コードでは、推測せずにバイト数に戻すと安全。
