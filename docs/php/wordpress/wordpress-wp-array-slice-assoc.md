---
title: 必要なキーだけを、キーの順番どおりに取り出す
description: WordPress の wp_array_slice_assoc は、連想配列から指定したキーの値だけを取り出します。array_intersect_key では書けない「キーの順番」と「null の扱い」に注意した、小さな関数です。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "f73030e78d1af6c13f70a8825d0484d49230197a"
file: wp-includes/functions.php
lines: [5179, 5189]
function: wp_array_slice_assoc
difficulty: 1
format: 2
tags: [データ構造, イディオム, 防御的プログラミング]
---

## ひとことで

`wp_array_slice_assoc` は、連想配列から **欲しいキーだけ** を取り出して、新しい配列にする関数です。たとえば `['a' => 1, 'b' => 2, 'c' => 3]` から `['a', 'c']` を指定すると、`['a' => 1, 'c' => 3]` が返ります。

## コード

```php:line-numbers=5179
function wp_array_slice_assoc( $input_array, $keys ): array {
	$slice = array();

	foreach ( $keys as $key ) {
		if ( isset( $input_array[ $key ] ) ) {
			$slice[ $key ] = $input_array[ $key ];
		}
	}

	return $slice;
}
```

## 前提知識

- **連想配列**: キーに文字列を使える配列です。`$input['name']` のように、キーで値を取り出します。
- **`isset`**: 値が存在し、かつ `null` ではないかを調べる関数です。`null` の値は `false` になります。
- **`foreach`**: 配列の要素を 1 つずつ取り出して、順に処理する書き方です。
- **`array_intersect_key`**: 2 つの配列の共通のキーを取り出す PHP の関数です。この関数とよく比べられます。

## 何をしているか

### 1. 空の配列を用意する

```php:line-numbers=5180
	$slice = array();
```

結果を入れる `$slice` を空の配列で作ります。ここに欲しいキーの値を 1 つずつ入れていきます。

### 2. キーを 1 つずつ確かめて、値をコピーする

```php:line-numbers=5182
	foreach ( $keys as $key ) {
		if ( isset( $input_array[ $key ] ) ) {
			$slice[ $key ] = $input_array[ $key ];
		}
	}
```

`$keys` の各キーについて、`$input_array` にそのキーがあるかを `isset` で確かめます。あれば `$slice[$key] = $input_array[$key];` で結果に入れます。ない場合は、何もせずに次のキーへ進みます。

具体例として、`['a' => 1, 'b' => null]` からキー `['a', 'b', 'c']` を取り出すと、結果は `['a' => 1]` だけです。`b` は値が `null` なので `isset` が `false` になり、`c` は存在しないので無視されます。

### 3. 結果を返す

```php:line-numbers=5188
	return $slice;
```

キーを指定した順に並んだ配列を返します。元の配列の順番ではなく、`$keys` の順番で結果が並ぶ点に注意してください。

## ここがすごい

### `isset` を使うことで、存在しないキーと null をまとめて除く

この関数は、キーがないことと値が `null` であることを区別しません。どちらも `isset` が `false` を返すので、結果に含まれません。「値のないものは取り出さない」というルールを、1 行の `isset` だけで表しています。

### 順番を指定したキーの順にそろえる

`array_intersect_key` は元の配列の順番を残します。一方、この関数は `$keys` の並びを基準にします。そのため、呼び出し側が決めた順番で結果を受け取れます。HTML の属性や、フォームの項目のように順番が大事な場面で役立ちます。

### 短く、読むだけで意味がわかる

関数全体は 11 行で、ループと `isset` と代入だけです。PHP の組み込み関数を組み合わせなくても、ここまで単純に書けるのは、読み手にとってよい例です。

## まとめ

- 必要なキーだけを取り出すなら、`isset` で確かめながらループすると簡単に書ける。
- `isset` は「存在しない」と「null」を同じ扱いにするので、値のないものを一度に除ける。
- 結果の順番を呼び出し側で決めたいときは、基準のキーの配列を順に回すとよい。
- 組み込み関数に頼らず、小さなループで書けると理解しやすい。
