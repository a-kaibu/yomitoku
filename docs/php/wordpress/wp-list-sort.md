---
title: 配列を、指定したキーの値で並べ替える
description: WordPress の wp_list_sort は、オブジェクトや配列の一覧を、指定したキーの値で並べ替えます。並べ替えの処理を WP_List_Util クラスに任せ、この関数は入力の確認だけを行います。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "3faa577cea31af1dd8308b6688a9081e111d86a3"
file: wp-includes/functions.php
lines: [5582, 5590]
function: wp_list_sort
difficulty: 2
format: 2
tags: [アルゴリズム, API設計, 防御的プログラミング]
---
## ひとことで

`wp_list_sort` は、配列の中の各要素（配列またはオブジェクト）を、指定したキーの値の順に並べ替える関数です。たとえば、投稿の一覧を `title` の順に並べるような場面で使われます。並べ替えの本体は `WP_List_Util` クラスが担当します。

## コード

```php:line-numbers=5582
function wp_list_sort( $input_list, $orderby = array(), $order = 'ASC', $preserve_keys = false ) {
	if ( ! is_array( $input_list ) ) {
		return array();
	}

	$util = new WP_List_Util( $input_list );

	return $util->sort( $orderby, $order, $preserve_keys );
}
```

## 前提知識

- **`$orderby`**: 並べ替えに使うキーを指定する引数です。キーの名前を文字列で渡すと、その値で並べます。複数のキーを配列で渡すこともできます。
- **`$order`**: `ASC`（昇順）か `DESC`（降順）を指定します。
- **`$preserve_keys`**: 並べ替えのあとに、元の配列のキーを残すかどうかを決めます。`false` なら、番号が 0 から振り直されます。
- **`new WP_List_Util(...)`**: クラスからオブジェクトを作る書き方です。並べ替えの処理をまとめたオブジェクトを作り、その `sort` メソッドを呼びます。
- **`!` と `is_array`**: 「配列でない」を確かめる書き方です。`!` は否定の記号です。

## 何をしているか

### 1. 配列でなければ空の配列を返す

```php:line-numbers=5583
	if ( ! is_array( $input_list ) ) {
		return array();
	}
```

入力が配列でない場合は、並べ替えできないので空の配列を返します。関数の戻り値が常に配列になるように、ここで保証しています。

### 2. 並べ替えの担当オブジェクトを作る

```php:line-numbers=5587
	$util = new WP_List_Util( $input_list );
```

一覧を `WP_List_Util` に渡して、並べ替えの準備をします。並べ替えの処理は、このクラスの中にまとまっています。

### 3. 指定の条件で並べ替える

```php:line-numbers=5589
	return $util->sort( $orderby, $order, $preserve_keys );
```

`sort` に、キー、順番、キーの扱いを渡します。並べ替えられた配列が、この関数の結果になります。

## ここがすごい

- **入口で型を確かめる**: 配列でない値が来ても、警告や例外にせず、空の配列を返します。呼び出し側は、結果を必ず配列として扱えます。
- **仕事を分ける**: 関数は入力の確認と受け渡しだけを行い、並べ替えは専用のクラスに任せています。並べ替えの仕組みを変えるときも、この関数は変更しなくて済みます。
- **引数の既定値が使いやすい**: 順番は昇順、キーの保持はしない、が既定です。よく使う形を、引数を省略して呼べます。
- **表の見た目と対応**: `orderby` と `order` という名前が、SQL の並べ替えと似ています。WordPress の他の API と同じ感覚で使えます。

## まとめ

- 一覧の並べ替えは、キーと順番を引数で指定する形にすると使いやすい。
- 入口で型を確かめると、呼び出し側が結果の形を心配しなくてよい。
- 並べ替えの本体を専用のクラスに分けると、仕組みを変えやすい。
- 既定値を決めておくと、よく使う呼び出しが短く書ける。
