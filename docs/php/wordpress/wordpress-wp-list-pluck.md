---
title: "配列の各要素から、同じ名前の値だけを取り出す"
description: "WordPress の wp_list_pluck は、配列の中の各要素から指定した項目だけを取り出して、新しい配列にまとめます。"
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "f73030e78d1af6c13f70a8825d0484d49230197a"
file: wp-includes/functions.php
lines: [5558, 5566]
function: wp_list_pluck
difficulty: 1
format: 2
tags: [データ構造, イディオム]
---

## ひとことで

投稿の一覧から「タイトルだけの一覧」を作りたいとき、この関数が役に立ちます。各要素の `title` のような項目を、順番どおりに取り出して並べます。

## コード

```php:line-numbers=5558
function wp_list_pluck( $input_list, $field, $index_key = null ) {
	if ( ! is_array( $input_list ) ) {
		return array();
	}

	$util = new WP_List_Util( $input_list );

	return $util->pluck( $field, $index_key );
}
```

## 前提知識

- **配列**: 値を順番に並べた入れ物です。PHP では `array()` や `[]` で作ります。
- **連想配列**: `'title' => 'Hello'` のように、名前（キー）と値の組で持つ配列です。
- **オブジェクト**: 関連する値と処理をまとめた入れ物です。`new` で作ります。
- **`is_array`**: 値が配列かどうかを調べる関数です。

## 何をしているか

### 1. 配列でなければ、空の配列を返す

```php:line-numbers=5559
	if ( ! is_array( $input_list ) ) {
		return array();
	}
```

渡されたものが配列でなければ、取り出すものがないので、空の配列を返します。

### 2. 実際の取り出しは、別のクラスに任せる

```php:line-numbers=5563
	$util = new WP_List_Util( $input_list );

	return $util->pluck( $field, $index_key );
```

`WP_List_Util` というクラスを作り、その `pluck` メソッドで、指定した項目を取り出します。

## ここがすごい

### 間違った入力を、早めに返す

```php:line-numbers=5559
	if ( ! is_array( $input_list ) ) {
		return array();
	}
```

配列でないときに、後の処理で失敗しないよう、先頭で空の配列を返しています。関数を使う側は、いつも配列が返ると考えて書けます。

### 関数は、呼び出すだけの薄い形になっている

```php:line-numbers=5563
	$util = new WP_List_Util( $input_list );

	return $util->pluck( $field, $index_key );
```

本当の仕事は `WP_List_Util` が受け持ちます。この関数は、入口として引数を受け取り、クラスに渡すだけです。よく使う処理を、短い関数名で呼べるようにしています。

## まとめ

この関数は、配列から同じ項目だけを集める、よくある処理の入り口です。入力の確認をしてから、専用のクラスに仕事を渡す、という 2 段構えになっています。
