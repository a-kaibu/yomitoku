---
title: 配列の中の文字列を、奥まで URL エンコードする
description: WordPress の urlencode_deep は、配列の中の値を、入れ子の深さに関係なく URL エンコードします。map_deep という再帰の関数に任せ、この関数は呼び出す相手を決めるだけです。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "3faa577cea31af1dd8308b6688a9081e111d86a3"
file: wp-includes/formatting.php
lines: [2946, 2948]
function: urlencode_deep
difficulty: 1
format: 2
tags: [ネットワーク, 文字列処理, 再帰]
---
## ひとことで

`urlencode_deep` は、配列やその中の配列に入っているすべての文字列を、URL で使える形に変換する関数です。クエリのパラメータを組み立てるときに、値を安全に渡すために使われます。

## コード

```php:line-numbers=2946
function urlencode_deep( $value ) {
	return map_deep( $value, 'urlencode' );
}
```

## 前提知識

- **URL エンコード（`urlencode`）**: 空白や記号を `%20` などの形に変える処理です。URL の中で意味を持つ文字（`&` や `=` など）を、値として安全に渡せるようになります。
- **`map_deep`**: 配列の中のすべての値に、指定した関数を適用する WordPress の関数です。入れ子の配列を、奥まで再帰的にたどります。
- **コールバックの文字列 `'urlencode'`**: 関数名を文字列で渡すと、`map_deep` がその関数を各値に呼び出します。
- **再帰**: 関数が、同じ種類の処理を、データの中へ繰り返し適用する仕組みです。

## 何をしているか

### 1. 変換の相手を決める

```php:line-numbers=2947
	return map_deep( $value, 'urlencode' );
```

この関数の本体は、1 行だけです。`map_deep` に、値と変換の関数名を渡します。配列の入れ子をたどる処理は、すべて `map_deep` の仕事です。

たとえば `array( 'q' => 'a b', 'tags' => array( 'x&y' ) )` を渡すと、`q` の値は `a+b`、入れ子の `x&y` は `x%26y` になります。

### 2. 文字列以外の値は、そのまま残す

`map_deep` は、値が文字列のときだけ `urlencode` を適用します。数値や `null` などは、変換の対象にならずにそのまま残ります。

## ここがすごい

- **責任を分ける**: 「どう変換するか」と「どこまで適用するか」を分けています。`urlencode_deep` は前者を決め、後者は `map_deep` に任せています。
- **深さに依存しない**: 配列がいくら入れ子でも、同じ 1 行で処理されます。入れ子の深さを前提にしたループを、関数の中に書く必要がありません。
- **変換の差し替えが簡単**: 同じ仕組みで、`map_deep` に別の関数を渡せば、別の変換を奥まで適用できます。`wp_slash` や `wp_unslash` も同じ形で書かれています。
- **名前が動作を示す**: `urlencode` と `deep` という語が、「URL エンコードを奥まで」という動きを、そのまま表しています。

## まとめ

- 入れ子の配列の値を全部変換するには、再帰を担当する関数に任せると短く書ける。
- 「何をするか」と「どこまでするか」を別の関数に分けると、役割が明確になる。
- 変換の関数を引数で渡せる設計にすると、同じ仕組みを別の変換にも使える。
