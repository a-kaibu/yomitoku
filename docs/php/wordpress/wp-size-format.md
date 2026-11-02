---
title: バイト数を、1024の累乗で大きい単位から選ぶ
description: WordPress の size_format は、バイト数を KB から YB までの単位に直し、桁数を指定して表示します。大きい単位から順に確かめて、最初に当たった単位で割るという考え方です。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "3faa577cea31af1dd8308b6688a9081e111d86a3"
file: wp-includes/functions.php
lines: [508, 515]
function: size_format
difficulty: 2
format: 2
tags: [数値計算, 入出力, 文字列処理]
---
## ひとことで

`size_format` は、ファイルの大きさを「1.5 KB」や「3 MB」のような、人が読みやすい形に変える関数です。メディアライブラリの容量表示などに使われます。単位は大きいものから順に確かめ、最初に当たったもので割ります。

## コード

```php:line-numbers=508
	foreach ( $quant as $unit => $mag ) {
		if ( $bytes >= $mag ) {
			return number_format_i18n( $bytes / $mag, $decimals ) . ' ' . $unit;
		}
	}

	return false;
}
```

## 前提知識

- **`$quant` の表**: 「単位の記号」と「その単位が何バイトか」の組を、大きい順に並べた配列です。`YB_IN_BYTES` などの定数は、1024 の累乗を表します。
- **1024 の累乗**: コンピュータのバイト数は、1000 ではなく 1024 を 1 単位として数えるのが、WordPress の表示の基準です。1 KB は 1024 バイト、1 MB は 1024 KB です。
- **`number_format_i18n`**: 数字を、サイトの言語の書式（小数点の記号など）で表示する WordPress の関数です。
- **`foreach` の `=>`**: 配列の鍵（ここでは単位の記号）と値（バイト数）を同時に取り出す書き方です。
- **`return false`**: 単位に当たらなかった場合の戻り値です。

## 何をしているか

### 1. 大きい単位から順に確かめる

```php:line-numbers=508
	foreach ( $quant as $unit => $mag ) {
		if ( $bytes >= $mag ) {
```

`$quant` は大きい単位から並んでいます。最初の単位から、「このバイト数はこの単位以上か」を確かめます。

### 2. 当たった単位で割って表示する

```php:line-numbers=510
			return number_format_i18n( $bytes / $mag, $decimals ) . ' ' . $unit;
```

最初に当たった単位で割り、桁数 `$decimals` を指定して書式を整えます。最後に単位の記号を空白で付けます。

たとえば `1536` バイトに `decimals` を 1 にすると、`1536 / 1024` の `1.5` が表示され、`1.5 KB` になります。

### 3. 最後まで当たらなければ false

```php:line-numbers=514
	return false;
```

どの単位にも当たらないのは、バイト数が 1 未満（0 より小さいなど）の場合です。そのときは `false` を返します。

## ここがすごい

- **大きい単位から見る**: 大きい単位から確かめるので、最初に当たった単位が、最も適切な単位になります。割り算は 1 回だけです。
- **表の形で単位を管理する**: 単位を配列にしておくと、YB から B まで、1 行ずつ増やしたり減らしたりできます。
- **表示の言語に合わせる**: `number_format_i18n` を使うので、小数点が「.」か「,」かといった地域の違いを、関数の中で吸収できます。
- **桁数を呼び出し側が決める**: 整数の容量を表示したい場合は `decimals` を 0 にすると、小数点のない表示になります。

## まとめ

- 単位の変換は、大きい単位から順に比べると、最も適切な単位が見つかる。
- 単位の定義を表にすると、単位を増やしたり、順番を読んだりしやすい。
- 表示の書式は、言語に合わせた関数に任せると地域の違いに強い。
- 割り切れない場合の表示の桁数は、引数で呼び出し側が決められるようにする。
