---
title: 一覧を条件で絞り込み、必要ならキーの値だけを取り出す
description: WordPress の wp_filter_object_list は、配列やオブジェクトの一覧を条件で絞り込み、指定したフィールドの値だけを取り出します。並べ替えと同じく、処理の本体を WP_List_Util に任せています。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "3faa577cea31af1dd8308b6688a9081e111d86a3"
file: wp-includes/functions.php
lines: [5492, 5506]
function: wp_filter_object_list
difficulty: 2
format: 2
tags: [API設計, 防御的プログラミング, データ構造]
---
## ひとことで

`wp_filter_object_list` は、投稿や設定などのオブジェクトの一覧から、条件に合うものだけを選び、必要ならその中の 1 つのフィールドの値だけを返す関数です。たとえば、公開中の投稿だけを選び、そのタイトルの一覧を作るような処理に使われます。

## コード

```php:line-numbers=5492
function wp_filter_object_list( $input_list, $args = array(), $operator = 'and', $field = false ) {
	if ( ! is_array( $input_list ) ) {
		return array();
	}

	$util = new WP_List_Util( $input_list );

	$util->filter( $args, $operator );

	if ( $field ) {
		$util->pluck( $field );
	}

	return $util->get_output();
}
```

## 前提知識

- **条件の配列 `$args`**: 「フィールド名 => 値」の組で、絞り込みの条件を書きます。`array( 'status' => 'publish' )` は、status が publish のものだけを選ぶという意味です。
- **`$operator`**: 複数の条件を、すべて満たす（`and`）か、どれか 1 つを満たす（`or`）かを決めます。
- **`$field`**: 残った各要素から取り出す、フィールドの名前です。`false` なら、要素全体を返します。
- **`WP_List_Util`**: 一覧の絞り込みや取り出しを行う WordPress のクラスです。前の記事の並べ替えでも使われています。
- **`get_output`**: 処理を終えた結果を取り出すメソッドです。

## 何をしているか

### 1. 配列でなければ空の配列を返す

```php:line-numbers=5493
	if ( ! is_array( $input_list ) ) {
		return array();
	}
```

入力が配列でなければ、絞り込めないので空の配列を返します。並べ替えの関数と同じ方針です。

### 2. 条件で絞り込む

```php:line-numbers=5497
	$util = new WP_List_Util( $input_list );

	$util->filter( $args, $operator );
```

一覧を `WP_List_Util` に渡し、条件と、条件の組み合わせ方（`and` か `or`）で絞り込みます。絞り込みの途中の状態は、このオブジェクトが持ちます。

### 3. フィールドを指定されたときだけ取り出す

```php:line-numbers=5501
	if ( $field ) {
		$util->pluck( $field );
	}

	return $util->get_output();
```

`$field` が指定されていれば、各要素からその値だけを取り出します。指定がなければ、絞り込まれた要素全体を返します。最後に `get_output` で結果を受け取ります。

## ここがすごい

- **絞り込みと取り出しを 1 つの関数で**: 「選んで、必要な値だけを残す」という、よくある 2 段階の処理を、引数の指定だけで切り替えられます。
- **同じ部品を再利用**: 並べ替えと絞り込みは、同じ `WP_List_Util` を使います。新しい操作を足すときも、同じ部品に機能を足せば済みます。
- **条件の組み合わせを引数で選ぶ**: `and` と `or` を切り替えられるので、呼び出し側が、条件の意味を明示できます。
- **型の不正を空で返す**: 配列でない入力は、例外にせず空の結果にします。後の処理が、結果を配列として扱えます。

## まとめ

- 一覧の絞り込みは、条件の配列と、組み合わせ方の指定を引数にすると使いやすい。
- 絞り込みのあとに、必要な値だけを取り出す処理を、任意の段階として付けられる。
- 同じ部品（ここでは `WP_List_Util`）を並べ替えと絞り込みで使うと、機能の追加が楽になる。
