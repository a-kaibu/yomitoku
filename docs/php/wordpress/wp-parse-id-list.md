---
title: 文字の並びを、重複のない正の整数の一覧にする
description: WordPress の wp_parse_id_list は、カンマや空白で区切られた入力を、absint で整数にし、array_unique で重複を取り除きます。投稿 ID の一覧などを安全に受け取るための関数です。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "3faa577cea31af1dd8308b6688a9081e111d86a3"
file: wp-includes/functions.php
lines: [5128, 5132]
function: wp_parse_id_list
difficulty: 1
format: 2
tags: [防御的プログラミング, 文字列処理, データ構造]
---
## ひとことで

`wp_parse_id_list` は、`1,2,3` や `1 2 2 3` のような文字列を、整数の ID の配列に変える関数です。数字でない値は 0 になり、負の数は符号が外れ、重複は 1 つにまとめられます。URL のパラメータなどから ID の一覧を受け取るときに使われます。

## コード

```php:line-numbers=5128
function wp_parse_id_list( $input_list ): array {
	$input_list = wp_parse_list( $input_list );

	return array_unique( array_map( 'absint', $input_list ) );
}
```

## 前提知識

- **`wp_parse_list`**: カンマや空白で区切られた文字列を、要素の配列に分ける WordPress の関数です。すでに配列なら、そのまま返します。
- **`absint`**: 値を非負の整数（絶対値の整数）にする WordPress の関数です。`absint('-3')` は `3`、`absint('abc')` は `0` になります。
- **`array_map`**: 配列の各要素に関数を適用する PHP の関数です。
- **`array_unique`**: 配列の重複する値を、最初の 1 つだけ残して取り除く PHP の関数です。
- **戻り値の型 `: array`**: この関数は必ず配列を返す、という宣言です。

## 何をしているか

### 1. 文字列を要素の配列にする

```php:line-numbers=5129
	$input_list = wp_parse_list( $input_list );
```

たとえば `'1, 2, 2, abc, -3'` は、区切り文字で分けられて、`'1'`、`'2'`、`'2'`、`'abc'`、`'-3'` の配列になります。

### 2. 各要素を非負の整数にする

同じ行の `array_map( 'absint', ... )` が、各要素に `absint` を適用します。上の例なら、`1`、`2`、`2`、`0`、`3` になります。`abc` は数字でないので 0 に、`-3` は符号を外して 3 になります。

### 3. 重複を取り除く

`array_unique` が、重複した値を取り除きます。結果は、`1`、`2`、`0`、`3` の 4 つの値です。2 つめの 2 は残らず、最初の値が残ります。

## ここがすごい

- **読み込みと検査を 1 関数で**: 文字列の分解、型の揃え、重複の除去を、3 つの関数の組み合わせで済ませています。呼び出し側は、ID の一覧としての結果だけを受け取ります。
- **数字でない値を 0 にする**: 不正な入力で処理が止まるのではなく、0 という明確な値にします。0 はデータベースの ID としては存在しないので、後で弾きやすいです。
- **負の数を正に寄せる**: `absint` を使うので、`-3` のような入力を誤って負の ID として扱うことがありません。
- **型で結果を保証する**: 戻り値の型を `array` と宣言しているので、呼び出し側は必ず配列として扱えます。

## まとめ

- 区切られた ID の文字列は、要素に分けてから整数に揃えると扱いやすい。
- `absint` は、不正な値を 0 や正の数に寄せて安全にする。
- `array_unique` で重複を取り除くと、同じ ID の処理を繰り返さずに済む。
- 入力を受け取る関数は、戻り値の型を決めておくと呼び出し側が楽になる。
