---
title: 投稿の項目を、表示に使える形で取り出す
description: WordPress の get_post_field は、投稿の指定した項目（タイトルや本文など）を取り出し、表示や保存に使える形に整えて返します。投稿が無いときや項目が無いときは、エラーにせず空の文字列を返します。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "3faa577cea31af1dd8308b6688a9081e111d86a3"
file: wp-includes/post.php
lines: [1252, 1264]
function: get_post_field
difficulty: 2
format: 2
tags: [防御的プログラミング, API設計, 文字列処理]
---
## ひとことで

`get_post_field` は、投稿の中から一つの項目（たとえば `post_title`）を取り出して返す関数です。取り出した値は、そのまま表示せず、項目に合わせた整えるための処理を通します。投稿が見つからないときや、項目が無いときは、空の文字列を返します。

## コード

```php:line-numbers=1252
function get_post_field( $field, $post = null, $context = 'display' ) {
	$post = get_post( $post );

	if ( ! $post ) {
		return '';
	}

	if ( ! isset( $post->$field ) ) {
		return '';
	}

	return sanitize_post_field( $field, $post->$field, $post->ID, $context );
}
```

## 前提知識

- **投稿（post）**: WordPress の記事やページのことです。タイトル、本文、作成日などの項目（フィールド）を持ちます。
- **`get_post`**: 投稿の ID や投稿のオブジェクトから、投稿の情報を取り出す関数です。見つからなければ `null` になります。
- **`sanitize_post_field`**: 項目の値を、用途に合うように整える関数です。文脈（`display` や `edit` など）によって、整え方が変わります。
- **`isset`**: プロパティや配列の要素があり、かつ `null` でないかを調べる関数です。
- **既定値 `null` の引数**: `$post = null` のように書くと、呼び出し側が省略できます。省略時は現在の投稿を使う、という約束になっています。

## 何をしているか

### 1. 投稿を取り出す

```php:line-numbers=1253
	$post = get_post( $post );

	if ( ! $post ) {
		return '';
	}
```

`get_post` で、引数から投稿を取り出します。投稿が無ければ、`''` を返して終わります。

### 2. 項目が無ければ空文字

```php:line-numbers=1259
	if ( ! isset( $post->$field ) ) {
		return '';
	}
```

`isset` で、指定の項目が投稿に存在するかを確かめます。項目名は変数として `$post->$field` と書かれているので、名前を文字列で受け取れます。存在しなければ、空文字を返します。

### 3. 表示用に整えて返す

```php:line-numbers=1263
	return sanitize_post_field( $field, $post->$field, $post->ID, $context );
```

項目の値を、投稿の ID と文脈と一緒に `sanitize_post_field` に渡します。文脈の `display` は、画面に表示するための整え方を表します。その結果を返します。

## ここがすごい

- 投稿が無い、項目が無い、の 2 つの場合を、エラーにせず空の文字列で受け止めています。テーマのテンプレートが、存在しない項目を指定しても画面が壊れません。
- 項目の名前を文字列で受け取り、`$post->$field` で動的に参照しています。どの項目でも、同じ一つの関数で取り出せます。
- 取り出した値を、直接返さずに `sanitize_post_field` に通しています。項目ごとに、安全で適切な形にする仕組みを、一か所にまとめています。
- 文脈の引数を持つので、同じ項目でも、表示と編集で整え方を切り替えられます。

## まとめ

`get_post_field` は、投稿の項目を名前で取り出し、文脈に合わせて整えてから返す関数です。見つからないときは空文字で受け止め、画面を壊さない作りになっています。WordPress のテーマの中で、投稿の情報を安全に表示するための、中心的な入口の一つです。
