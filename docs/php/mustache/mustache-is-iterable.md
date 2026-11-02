---
title: 配列が「順番に回せる一覧」かどうかを判定する
description: mustache.php の isIterable は、値が区間（セクション）の中で繰り返せるかを判定します。配列は、キーが 0、1、2 と順番どおりに並んでいるときだけ一覧として扱い、連想配列は 1 つの文脈として扱います。
language: php
project: mustache.php
repo: https://github.com/bobthecow/mustache.php
license: MIT
copyright: Copyright (c) 2010-2026 Justin Hileman
commit: "c33d74b6dc5b83b6cecd23583b4085d1f4e25332"
file: src/Template.php
lines: [164, 183]
function: isIterable
difficulty: 3
format: 2
tags: [型システム, イテレータ, 再帰]
---
## ひとことで

`isIterable` は、Mustache の区間（セクション）に渡された値を、何度も繰り返せる一覧として扱ってよいかを判定する関数です。オブジェクトなら `Traversable` かどうかを見て、配列なら「キーが 0、1、2 と順番どおりに並んでいるか」を確かめます。

## コード

```php:line-numbers=164
    protected function isIterable($value)
    {
        switch (gettype($value)) {
            case 'object':
                return $value instanceof \Traversable;

            case 'array':
                $i = 0;
                foreach ($value as $k => $v) {
                    if ($k !== $i++) {
                        return false;
                    }
                }

                return true;

            default:
                return false;
        }
    }
```

## 前提知識

- **Mustache の区間（セクション）**: `{{#items}} ... {{/items}}` のように書く、繰り返しや条件の書き方です。値が一覧なら中を一回ずつ繰り返し、値が 1 つの文脈なら、中を一度だけ描画します。
- **配列のキー**: PHP の配列は、番号（0 から始まる数）や名前（文字列）でキーを持ちます。`[1, 2, 3]` の番号は 0、1、2 ですが、`['a' => 1]` は名前 `a` がキーです。
- **`Traversable`**: `foreach` で回せるものを表すインターフェースです。`Iterator` や `Generator` が、これを実装しています。
- **`gettype`**: 値の型を文字列で返す関数です。`'object'` や `'array'` などの文字列を返します。
- **`switch` と `default`**: 値に応じて処理を分ける書き方です。どの場合にも当てはまらないときは `default` の処理が動きます。

## 何をしているか

### 1. 型で分ける

```php:line-numbers=166
        switch (gettype($value)) {
            case 'object':
                return $value instanceof \Traversable;
```

`gettype($value)` の結果で、`switch` を分けます。オブジェクトなら、`$value instanceof \Traversable` で、`foreach` で回せるかを返します。配列以外の値（数値や文字列など）は、`default` で `false` になります。

### 2. 配列は、キーが順番どおりかを確かめる

```php:line-numbers=170
            case 'array':
                $i = 0;
                foreach ($value as $k => $v) {
                    if ($k !== $i++) {
                        return false;
                    }
                }

                return true;
```

配列の場合は、`$i = 0` から数え始め、`foreach` で各要素のキー `$k` を調べます。`$k !== $i++` の比較で、キーが 0、1、2 と順番どおりに並んでいるかを確かめます。途中で違うキーがあれば、`false` を返します。全部そろっていれば `true` です。

この判定が必要なのは、`['name' => 'Ann']` のような連想配列を、区間の中で一覧として扱わないようにするためです。連想配列は 1 人分のデータとして描画されます。

### 3. 空の配列は一覧として扱われる

```php:line-numbers=178
                return true;
```

`[]` の場合、`foreach` が 1 回も回らないので、そのまま `true` が返ります。空の一覧は、区間の中を 1 回も描画しない、という結果になります。

## ここがすごい

- 配列の判定に、`array_is_list` のような組み込みの関数を使わず、`$i++` と `!==` の比較だけで書いています。値を比べながら、順番を同時に数えられます。
- 型の判定を `gettype` の文字列に任せ、`switch` で分けています。どの型でも同じ形で読めるので、後から型を足すのが簡単です。
- オブジェクトは `Traversable` かどうかだけで判断し、配列と同じ扱いにしません。`foreach` で回せるものを一覧とみなす、という一貫した考え方です。
- 連想配列を一覧として誤って繰り返さない点が、テンプレートを書く人にとって安心できる動きになっています。データの形を見て、描画の仕方を決められます。

## まとめ

`isIterable` は、Mustache の区間に渡された値が、一覧として繰り返せるかを判定します。配列はキーが 0 から順に並んでいるかを確かめ、オブジェクトは `Traversable` かどうかを見ます。キーの並びを 1 つずつ数えるだけの短い比較で、連想配列と一覧を見分けている点が、この関数の要になっています。
