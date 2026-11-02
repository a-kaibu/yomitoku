---
title: 入れ子の配列を、深さを指定して平らにする
description: Laravel の Arr::flatten は、入れ子の配列を指定した深さまで平らにします。深さを 1 減らしながら再帰し、深さ 1 の場合だけ特別な書き方にしているのが見どころです。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Collections/Arr.php
lines: [378, 399]
function: Arr::flatten
difficulty: 2
format: 2
tags: [再帰, データ構造, イディオム]
---

## ひとことで

`Arr::flatten` は、入れ子になった配列を **1 本の配列** に平らにします。`[1, [2, [3]]]` は `[1, 2, 3]` になります。`$depth` を指定すると、どこまで潜るかを決められます。

## コード

```php:line-numbers=378
    public static function flatten($array, $depth = INF)
    {
        $result = [];

        foreach ($array as $item) {
            $item = $item instanceof Enumerable ? $item->all() : $item;

            if (! is_array($item)) {
                $result[] = $item;
            } else {
                $values = $depth === 1
                    ? array_values($item)
                    : static::flatten($item, $depth - 1);

                foreach ($values as $value) {
                    $result[] = $value;
                }
            }
        }

        return $result;
    }
```

## 前提知識

- **再帰**: 関数が自分自身を呼び出して、同じ処理を小さい単位で繰り返す書き方です。
- **`instanceof`**: 値が特定のクラスのオブジェクトかを調べる PHP の演算子です。
- **`Enumerable`**: Laravel のコレクションの共通の型です。`all()` で中身の配列を取り出せます。
- **`array_values`**: 配列の添字を 0 から振り直す関数です。
- **`INF`**: 無限大です。既定値にすると、深さの制限がなくなります。

## 何をしているか

### 1. コレクションなら、配列に直す

```php:line-numbers=382
        foreach ($array as $item) {
            $item = $item instanceof Enumerable ? $item->all() : $item;
```

要素がコレクション（`Enumerable`）なら、`all()` で中身の配列を取り出します。以降はすべて配列として扱えます。

### 2. 配列でない要素は、そのまま結果に入れる

```php:line-numbers=385
            if (! is_array($item)) {
                $result[] = $item;
```

数値や文字列のような普通の値は、潜る必要がないので、そのまま結果の末尾に入れます。

### 3. 配列なら、深さに応じて平らにする

```php:line-numbers=387
            } else {
                $values = $depth === 1
                    ? array_values($item)
                    : static::flatten($item, $depth - 1);

                foreach ($values as $value) {
                    $result[] = $value;
                }
```

深さが 1 のときは、`array_values` で 1 段だけ平らにします。深さがそれ以外（`INF` を含む）なら、`$depth - 1` を渡して自分を再帰的に呼びます。こうすると、潜るたびに残りの深さが減っていきます。

最後に、平らになった値を 1 つずつ `$result` に入れて返します。

具体例として `[1, [2, [3, [4]]]]` を深さ 2 で平らにすると、`[1, 2, 3, [4]]` になります。深さが 2 段分だけ潜られ、3 段目の `[4]` は残ります。

## ここがすごい

### 深さの減算で、「残りの回数」を数えている

関数の引数に深さを持たせ、潜るたびに 1 ずつ減らす書き方は、再帰の終わりを表す典型的な形です。深さが 1 のとき、再帰をせずに `array_values` で済ませるのは、再帰の最後の一段を効率よく終わらせるための分岐です。

### `INF` を既定値にして、上限のない場合も同じ式で書ける

既定値の `INF` は、`$depth - 1` を何度繰り返しても `INF` のままです。そのため、「深さの制限なし」の場合も、「深さ 2 まで」の場合も、同じ再帰の式で扱えます。特別な分岐を増やさずに済む工夫です。

### オブジェクトの扱いを、最初の 1 行で決めている

コレクションが入っていても平らにできるように、最初に `all()` で配列へ直しています。これで、後の処理は配列だけを考えればよくなります。

## まとめ

- 入れ子の平らな化は、深さを 1 ずつ減らしながら再帰すると、終わりが明確になる。
- 深さが 1 の場合は再帰を止めて、1 段だけ平らにすると効率がよい。
- 既定値を `INF` にすると、制限なしと制限ありを同じ式で書ける。
- 入力の型は最初に配列へ直すと、後の処理が単純になる。
