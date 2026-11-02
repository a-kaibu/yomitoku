---
title: パスの末尾の名前を、URLのように取り出す
description: WordPress の wp_basename は、パスの最後の部分を取り出します。URL エンコードしてから basename を使うことで、日本語や空白を含むファイル名でも正しく扱えます。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "3faa577cea31af1dd8308b6688a9081e111d86a3"
file: wp-includes/formatting.php
lines: [5827, 5829]
function: wp_basename
difficulty: 2
format: 2
tags: [文字列処理, ファイル, Unicode]
---
## ひとことで

`wp_basename` は、パスの最後の部分（ファイル名）を取り出す関数です。PHP の標準の `basename` は、日本語や空白を含む文字列では思わぬ結果になることがあるため、一度 URL エンコードしてから使います。

## コード

```php:line-numbers=5827
function wp_basename( $path, $suffix = '' ) {
	return urldecode( basename( str_replace( array( '%2F', '%5C' ), '/', urlencode( $path ) ), $suffix ) );
}
```

## 前提知識

- **`basename`**: パスの最後の部分を返す PHP の関数です。`basename('/a/b.txt')` は `b.txt` を返します。第 2 引数に拡張子を渡すと、その部分を取り除きます。
- **URL エンコード（`urlencode`）**: 文字を `%` と 16 進数の組み合わせに変える方法です。`/` は `%2F` に、空白は `+` に、日本語は `%E3%81%82` のような形になります。
- **`urldecode`**: URL エンコードを元に戻す関数です。
- **`str_replace`**: 文字列の一部を別の文字列に置き換える関数です。配列を渡すと、複数の文字列を一度に置き換えられます。
- **`%2F` と `%5C`**: それぞれ `/` と `\` を URL エンコードした形です。

## 何をしているか

### 1. パスを URL エンコードする

```php:line-numbers=5828
	return urldecode( basename( str_replace( array( '%2F', '%5C' ), '/', urlencode( $path ) ), $suffix ) );
```

処理は内側から外へ進みます。まず `urlencode( $path )` で、パス全体を URL エンコードします。たとえば `/var/www/a b.txt` は、`%2Fvar%2Fwww%2Fa+b.txt` になります。

エンコードすると、`/` も `\` も `%2F` と `%5C` という形になり、文字列として区切りでなくなります。

### 2. 区切りを `/` に戻す

同じ行の `str_replace( array( '%2F', '%5C' ), '/', ... )` は、`%2F` と `%5C` を `/` に置き換えます。Windows の `\` と Unix の `/` のどちらの区切りでも、同じ `/` の形にそろいます。

結果は `/var/www/a+b.txt` になります。

### 3. basename で最後の部分を取り出す

`basename( ..., $suffix )` が、最後の要素 `a+b.txt` を取り出します。`$suffix` を渡すと、その拡張子を取り除きます。

### 4. 元の文字に戻す

最後に `urldecode` で、`+` を空白に戻します。結果は `a b.txt` です。

## ここがすごい

- **区切り文字の違いを吸収する**: `/` と `\` の両方を、一度 `%2F` や `%5C` に変えてから `/` に戻すことで、どちらの区切りでも同じ処理が通ります。
- **空白や日本語で壊れにくい**: 標準の `basename` は、ロケールや文字の並びによって結果が揺れることがあります。URL エンコードという既知の形を通すことで、結果が安定します。
- **1 行の式で完結**: 変換、取り出し、戻し、という 3 段階が 1 行に並んでいるので、順番が追いやすくなっています。
- **型を揃える**: 最後に `urldecode` で元の文字列に戻すので、呼び出し側は普通の文字列として使えます。

## まとめ

- パスの末尾を取り出すとき、区切りの違いは `/` にそろえてから `basename` を使うと扱いやすい。
- 空白や日本語を含む場合は、URL エンコードを挟むと結果が安定する。
- 変換の順番（エンコード、区切りの統一、取り出し、デコード）を理解すると、式の意図が読める。
- 処理を 1 行にまとめる場合も、段階を名前で言い表せると読みやすい。
