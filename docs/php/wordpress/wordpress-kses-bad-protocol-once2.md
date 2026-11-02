---
title: "javascript: などの危ない URL の書き方を、許可リストで止める"
description: "WordPress の wp_kses_bad_protocol_once2 は、HTML の URL に書かれた「javascript:」のような scheme を検査します。許可されていない scheme は取り除き、空白や大文字小文字の回避も防ぎます。"
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "f73030e78d1af6c13f70a8825d0484d49230197a"
file: wp-includes/kses.php
lines: [3216, 3229]
function: wp_kses_bad_protocol_once2
difficulty: 2
format: 2
tags: [セキュリティ, 防御的プログラミング, 文字列処理]
---

## ひとことで

`wp_kses_bad_protocol_once2` は、HTML の `href` などに書かれた URL の **scheme**（`https:` や `javascript:` の部分）を調べて、許可されていないものを取り除く関数です。悪意のあるスクリプトが URL を通して動くのを防ぎます。

## コード

```php:line-numbers=3216
function wp_kses_bad_protocol_once2( $scheme, $allowed_protocols ) {
	$scheme = wp_kses_decode_entities( $scheme );
	$scheme = preg_replace( '/\s/', '', $scheme );
	$scheme = wp_kses_no_null( $scheme );
	$scheme = strtolower( $scheme );

	$allowed = array_any( (array) $allowed_protocols, fn( $protocol ) => strtolower( $protocol ) === $scheme );

	if ( $allowed ) {
		return "$scheme:";
	} else {
		return '';
	}
}
```

## 前提知識

- **scheme（スキーム）**: URL の先頭にある `https:` `mailto:` などの部分です。ブラウザがどう扱うかを決めます。
- **`javascript:` の危険性**: `javascript:` で始まる URL は、リンクを押したときに JavaScript を実行してしまいます。そのため、サイトへの攻撃に使われることがあります。
- **許可リスト**: 使ってよいものだけを列挙した一覧です。
- **`array_any`**: 配列の中に、条件を満たす要素が 1 つでもあるかを調べる PHP の関数です。
- **大文字小文字**: `JavaScript:` と `javascript:` は同じ scheme として扱う必要があります。

## 何をしているか

### 1. scheme を、比べやすい形にそろえる

```php:line-numbers=3217
	$scheme = wp_kses_decode_entities( $scheme );
	$scheme = preg_replace( '/\s/', '', $scheme );
	$scheme = wp_kses_no_null( $scheme );
	$scheme = strtolower( $scheme );
```

まず HTML の実体参照（`&#106;` のような書き方）を元に戻し、空白を取り除き、ヌル文字を消して、小文字にします。こうすると、`java&#09;script:` や `JaVaScRiPt:` のような回避の書き方も、同じ形になります。

### 2. 許可リストにあるかを調べる

```php:line-numbers=3222
	$allowed = array_any( (array) $allowed_protocols, fn( $protocol ) => strtolower( $protocol ) === $scheme );
```

`array_any` で、許可された scheme の一覧の中に、今の scheme と一致するものがあるかを調べます。比べるときも小文字にそろえておきます。

### 3. 許可されていれば残し、そうでなければ空にする

```php:line-numbers=3224
	if ( $allowed ) {
		return "$scheme:";
	} else {
		return '';
	}
```

許可されていれば `scheme:` を返します。許可されていなければ空の文字列を返し、その scheme は消えます。

具体例として `javascript:alert(1)` は、`javascript` が許可リストになければ、空になります。`https://` は許可されていれば残ります。

## ここがすごい

### 「書き方の揺れ」を、先に正規の形にする

攻撃者は、大文字を混ぜたり、空白や実体参照を挟んだりして、検査をすり抜けようとします。この関数は、比べる前に実体参照、空白、ヌル文字、大文字小文字を正規化します。正規化してから比べることで、見た目が違う同じ scheme を一つにまとめて判定できます。

### 拒否リストではなく許可リストで守る

「危ないものだけ消す」より、「許可したものだけ残す」のほうが安全です。新しい危ない scheme が生まれても、リストにないものは自動的に消えます。

### 一致の判定を、関数の中で完結させる

許可リストとの比較は、`array_any` の 1 行で書かれています。何を許可しているかは、リストを見ればわかり、処理の流れも短く読めます。

## まとめ

- URL の検査は、比べる前に書き方の揺れを正規化すると回避されにくい。
- 危ないものを消すより、許可したものだけを残すほうが安全。
- 大文字小文字や空白の扱いは、比較の前にそろえると確実。
- 許可リストを 1 か所に書いておくと、方針が見えやすくなる。
