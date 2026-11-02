---
title: script と style の中身ごと消してから、タグを外す
description: WordPress の wp_strip_all_tags は、HTML からタグを取り除いて文字だけを残します。script と style は中身の文字も消すように、先に正規表現で取り除いてから strip_tags を使います。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "3faa577cea31af1dd8308b6688a9081e111d86a3"
file: wp-includes/formatting.php
lines: [5697, 5704]
function: wp_strip_all_tags
difficulty: 2
format: 2
tags: [防御的プログラミング, 文字列処理, セキュリティ]
---
## ひとことで

`wp_strip_all_tags` は、HTML の文字列からタグを取り除き、文字の部分だけを返す関数です。`strip_tags` だけでは残ってしまう `script` や `style` の中身も、先に消しておきます。検索用の文章や、メールの本文を作るときに使われます。

## コード

```php:line-numbers=5697
	$text = preg_replace( '@<(script|style)[^>]*?>.*?</\\1>@si', '', $text );
	$text = strip_tags( $text );

	if ( $remove_breaks ) {
		$text = preg_replace( '/[\r\n\t ]+/', ' ', $text );
	}

	return trim( $text );
```

## 前提知識

- **`strip_tags`**: HTML の `<...>` で囲まれたタグを取り除く PHP の関数です。タグの中の文字は残るので、`<script>` の中のコードも残ってしまいます。
- **`script` と `style`**: ページに埋め込まれる JavaScript と CSS を入れる要素です。文字として見せたくない内容が、中に入っています。
- **`preg_replace`**: 正規表現に合う部分を、別の文字列に置き換える関数です。
- **後方参照 `\\1`**: 正規表現の中で、1 番目のグループ（ここでは `script` か `style`）と同じ文字列を指す書き方です。開始と終了の組が一致するように保ちます。
- **修飾子 `s` と `i`**: `s` は改行も `.` に含める指定、`i` は大文字と小文字を区別しない指定です。
- **`trim`**: 文字列の両端の空白を取り除く関数です。

## 何をしているか

### 1. script と style を中身ごと消す

```php:line-numbers=5697
	$text = preg_replace( '@<(script|style)[^>]*?>.*?</\\1>@si', '', $text );
```

`<script ...>` から対応する `</script>` までを、中身ごと探して消します。`\\1` が、開始タグと同じ名前の終了タグを指すので、`<script>` は `</script>` と組になります。

`s` の指定があるので、中身が複数行にわたっていても、途中で止まりません。

### 2. 残りのタグを外す

```php:line-numbers=5698
	$text = strip_tags( $text );
```

続いて `strip_tags` で、残りのタグを取り除きます。`<p>Hello</p>` は `Hello` になります。script の中身はすでに消えているので、コードが文字として混ざることはありません。

### 3. 必要なら改行や空白をまとめる

```php:line-numbers=5700
	if ( $remove_breaks ) {
		$text = preg_replace( '/[\r\n\t ]+/', ' ', $text );
	}
```

`$remove_breaks` が `true` のときは、改行、タブ、空白の並びを 1 つの空白にまとめます。一覧や検索の表示で、1 行に収めたいときに使います。

### 4. 両端を整える

```php:line-numbers=5704
	return trim( $text );
```

最後に、先頭と末尾の空白を取り除いて返します。

たとえば `<p>Hello <script>x()</script>World</p>` は、script が消えて `<p>Hello World</p>` になり、タグを外すと `Hello World` になります。

## ここがすごい

- **順番が結果を決める**: script を先に消しておかないと、`strip_tags` で文字だけが残り、コードが表示に混ざります。順番の工夫が安全性を支えています。
- **開始と終了の組を正規表現で保つ**: 後方参照で、`<script>` と `</script>` を正しく組にしています。別の要素の終了タグで誤って止まることがありません。
- **任意の処理は引数で切り替える**: 改行をまとめるかどうかを引数にして、呼び出し側が表示の形を選べます。
- **型の確認を先に行う**: 文字列以外の値は、警告を出して空文字を返します。後の処理が、想定外の型で壊れることを防ぎます。

## まとめ

- HTML から文字だけを取り出すときは、中身を持つタグを先に消してから、タグを外す。
- 後方参照を使うと、開始と終了のタグを正しく組にできる。
- 処理の順番を入れ替えると、埋め込みのコードが混ざるという問題が起きる。
- 表示用の整形は、引数で任意にすると呼び出し側が選べる。
