---
title: "キーがすべて数字かで、リストか辞書かを見分ける"
description: "WordPress の wp_is_numeric_array は、配列のキーが文字列を一つも含まないかを調べます。JSON に変換するときにリストになるか、オブジェクトになるかを決める判定として使えます。"
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "f73030e78d1af6c13f70a8825d0484d49230197a"
file: wp-includes/functions.php
lines: [5454, 5460]
function: wp_is_numeric_array
difficulty: 2
format: 2
tags: [データ構造, 関数型, 防御的プログラミング]
---

## ひとことで

`wp_is_numeric_array` は、配列の **キーがすべて数字（整数）か** を調べる関数です。`['a', 'b']` のような「番号だけの配列」なら `true`、`['name' => 'x']` のような「名前つきの配列」なら `false` を返します。

## コード

```php:line-numbers=5454
function wp_is_numeric_array( $data ): bool {
	if ( ! is_array( $data ) ) {
		return false;
	}

	return array_all( $data, fn( $value, $key ) => ! is_string( $key ) );
}
```

## 前提知識

- **連想配列と番号配列**: PHP の配列は、キーが 0, 1, 2 のような番号なら「番号配列（リスト）」、文字列のキーなら「連想配列」です。PHP では同じ型で、中身の見た目だけが違います。
- **`is_string`**: 値が文字列かどうかを調べる関数です。
- **`array_all`**: 配列のすべての要素が条件を満たすかを調べる関数です。1 つでも満たさなければ `false` になります。
- **アロー関数 `fn`**: 1 行の無名関数です。`fn($value, $key) => ...` の形で、引数としてそのまま渡せます。

## 何をしているか

### 1. 配列でなければ、すぐに `false`

```php:line-numbers=5455
	if ( ! is_array( $data ) ) {
		return false;
	}
```

値が配列ではないなら、キーを持たないので `false` を返します。最初にこの確認をすると、後の処理を安全に進められます。

### 2. すべてのキーが文字列ではないかを確かめる

```php:line-numbers=5459
	return array_all( $data, fn( $value, $key ) => ! is_string( $key ) );
```

`array_all($data, fn($value, $key) => ! is_string($key))` で、すべての要素について「キーが文字列ではない」が成り立つかを調べます。1 つでも文字列のキーがあれば、結果は `false` です。

ここでは値（`$value`）は使わず、キー（`$key`）だけを調べています。引数の並び `($value, $key)` は、`array_all` がキーと値を両方渡す仕組みに合わせたものです。

具体例として、`[10, 20]` のキーは `0, 1` なので `true`、`['name' => 'Ami', 0 => 5]` は `name` が文字列なので `false` になります。空の配列 `[]` は、要素がないので `true` です。

## ここがすごい

### 「全部満たすか」をそのまま関数にしている

以前の書き方では、`foreach` で 1 つでも文字列のキーが見つかったら `false` を返す、と書くのが普通でした。この関数は `array_all` に条件を渡すだけなので、「すべてのキーが数字」という意味が 1 行で読めます。関数を引数に渡す書き方（関数型の考え方）の良い例です。

### 空の配列を `true` と判定する

空の配列は、「すべての要素が数字のキー」を満たすので `true` になります。これは論理の約束として正しい結果です。もしここを `false` にすると、空の配列を受け取った呼び出し側が、リストかどうかを別に判定する必要が出てしまいます。

### JSON に変換するときの判断に使える

PHP の `json_encode` は、キーが 0 から順番に並んでいる配列を JSON の配列にし、それ以外を JSON のオブジェクトにします。このような判定を事前に行うと、出力がどちらになるかを予測できます。

## まとめ

- 配列がリストか連想配列かは、キーの型を調べると判定できる。
- 「すべてが条件を満たす」は、`array_all` のような関数に条件を渡すと 1 行で書ける。
- 空の配列をどちらに判定するかは、約束として決めておくと読み手が迷わない。
- 値ではなくキーだけを見るなら、関数の引数で使うものを絞れる。
