---
title: "メールの件名に残る =?UTF-8?Q?...?= を日本語に戻す"
description: "WordPress の wp_iso_descrambler は、メールのヘッダにある「=?...?Q?...?=」の形式の文字列を読み、元の文字に戻します。16 進数の「=XX」を、正規表現のコールバックで 1 つずつ変換します。"
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "f73030e78d1af6c13f70a8825d0484d49230197a"
file: wp-includes/formatting.php
lines: [3766, 3774]
function: wp_iso_descrambler
difficulty: 3
format: 2
tags: [文字列処理, 正規表現, ネットワーク]
---

## ひとことで

`wp_iso_descrambler` は、メールの件名などに使われる **MIME の Q エンコーディング**（`=?ISO-8859-1?Q?Caf=E9?=` のような形）を、元の文字に戻す関数です。WordPress が受け取ったメールの件名を読むときに使われています。

## コード

::: code-group

```php:line-numbers=3766 [日本語訳]
function wp_iso_descrambler( $subject ) {
	/* iso-8859-1 でのみ動くかもしれません。申し訳ありません。 */
	if ( ! preg_match( '#\=\?(.+)\?Q\?(.+)\?\=#i', $subject, $matches ) ) {
		return $subject;
	}

	$subject = str_replace( '_', ' ', $matches[2] );
	return preg_replace_callback( '#\=([0-9a-f]{2})#i', '_wp_iso_convert', $subject );
}
```

```php:line-numbers=3766 [原文]
function wp_iso_descrambler( $subject ) {
	/* this may only work with iso-8859-1, I'm afraid */
	if ( ! preg_match( '#\=\?(.+)\?Q\?(.+)\?\=#i', $subject, $matches ) ) {
		return $subject;
	}

	$subject = str_replace( '_', ' ', $matches[2] );
	return preg_replace_callback( '#\=([0-9a-f]{2})#i', '_wp_iso_convert', $subject );
}
```

:::

## 前提知識

- **MIME エンコード**: メールのヘッダには ASCII 以外の文字をそのまま書けないため、特別な書き方（`=?文字コード?符号化方式?内容?=`）で表します。
- **Q エンコーディング**: 英数字はそのまま、それ以外は `=` と 16 進数 2 桁で表す方式です。`=E9` は 1 バイトの値 `0xE9` を表します。
- **正規表現の `#...#`**: `/` の代わりに `#` で囲むと、中に `/` があっても書きやすくなります。
- **`preg_replace_callback`**: 正規表現に一致した部分を、関数で 1 つずつ変換する関数です。
- **`str_replace`**: 文字列の一部を別の文字に置き換える関数です。ここでは `_` を空白にしています。

## 何をしているか

### 1. 形式に合うかを確かめる

```php:line-numbers=3768
	if ( ! preg_match( '#\=\?(.+)\?Q\?(.+)\?\=#i', $subject, $matches ) ) {
		return $subject;
	}
```

`=?...?Q?...?=` という形の文字列を探します。合わなければ、何もせずに元の文字列を返します。`$matches[2]` が、符号化された本体の部分です。

### 2. アンダースコアを空白にする

```php:line-numbers=3772
	$subject = str_replace( '_', ' ', $matches[2] );
```

Q エンコーディングでは、空白が `_` で表されます。そこで `str_replace('_', ' ', $matches[2])` で空白に戻します。

### 3. `=` の後の 16 進数を、1 バイトずつ元に戻す

```php:line-numbers=3773
	return preg_replace_callback( '#\=([0-9a-f]{2})#i', '_wp_iso_convert', $subject );
```

`#=([0-9a-f]{2})#i` は、`=` の後ろに 16 進数 2 桁が続く部分にマッチします。`_wp_iso_convert` という関数が、その 2 桁を 1 バイトの文字に変えます。

具体例として `=?ISO-8859-1?Q?Caf=E9?=` は、`Caf=E9` の部分の `=E9` が `é` に変わり、`Café` になります。

## ここがすごい

### 形式に合うものだけを、正規表現で切り出す

メールのヘッダは、この形式でないものも混ざります。この関数は、まず正規表現で形式を確かめ、合わなければそのまま返します。想定外の入力を壊さないことを、最初に保証しています。

### 「1 文字ずつ」の変換を、コールバックに任せる

16 進数の部分だけを、1 つずつ元の文字に変える処理は、`preg_replace_callback` が担当します。文字列全体を 1 回の処理で書き換えられるので、ループを書かずに済みます。

### 注意書きを、コードの近くに残す

コメントにある「iso-8859-1 でしか動かないかもしれない」という注意は、この関数の限界を正直に示しています。どの文字コードを前提にしているかを書いておくことは、後に使う人への親切です。

## まとめ

- メールの形式は、まず正規表現で形式に合うかを確かめると安全に扱える。
- 1 文字ずつ変換する処理は、コールバックにまとめると簡潔になる。
- 符号化された空白（`_`）のような規則は、先に元に戻しておく。
- 前提にしている文字コードは、コメントで明記しておくと後の人が困らない。
