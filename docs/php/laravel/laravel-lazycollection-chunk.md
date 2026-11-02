---
title: "大きなデータを、全部読み込まずに少しずつ区切る"
description: "Laravel の LazyCollection::chunk は、データを指定した個数のかたまりに区切ります。ジェネレータで 1 かたまりずつ作るので、巨大なデータでもメモリを使い切らずに処理できます。"
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Collections/LazyCollection.php
lines: [1402, 1438]
function: LazyCollection::chunk
difficulty: 3
format: 2
tags: [イテレータ, 遅延評価, アルゴリズム]
---

## ひとことで

`LazyCollection::chunk` は、データを **指定した個数ずつのかたまり** に区切ります。ふつうの配列の `chunk` と違い、全部を先に作らず、必要になった分だけ作ります。大きなファイルやデータベースの結果を分けて処理するときに向いています。

## コード

```php:line-numbers=1402
    public function chunk($size, $preserveKeys = true)
    {
        if ($size <= 0) {
            return static::empty();
        }

        $add = match ($preserveKeys) {
            true => fn (array &$chunk, Traversable $iterator) => $chunk[$iterator->key()] = $iterator->current(),
            false => fn (array &$chunk, Traversable $iterator) => $chunk[] = $iterator->current(),
        };

        return new static(function () use ($size, $add) {
            $iterator = $this->getIterator();

            while ($iterator->valid()) {
                $chunk = [];

                while (true) {
                    $add($chunk, $iterator);

                    if (count($chunk) < $size) {
                        $iterator->next();

                        if (! $iterator->valid()) {
                            break;
                        }
                    } else {
                        break;
                    }
                }

                yield new static($chunk);

                $iterator->next();
            }
        });
    }
```

## 前提知識

- **遅延評価（レイジー）**: 値が本当に必要になるまで計算や読み込みを後回しにすることです。
- **ジェネレータ（`yield`）**: 値を 1 つずつ返して、途中で止められる PHP の仕組みです。関数の途中で値を外へ渡し、続きは次に呼ばれたときに再開します。
- **イテレータ**: 値を 1 つずつ順番に取り出せるオブジェクトです。`valid()`、`current()`、`next()` の 3 つのメソッドで読みます。
- **`match`**: 条件に応じて値を選ぶ PHP の書き方です。ここでは関数を選ぶのに使っています。
- **無名関数の `use`**: 外側の変数を取り込んで、関数の中で使えるようにする書き方です。

## 何をしているか

### 1. 個数が不正なら、空のコレクションを返す

```php:line-numbers=1404
        if ($size <= 0) {
            return static::empty();
        }
```

大きさが 0 以下なら、かたまりは作れないので空を返します。

### 2. キーを残すかどうかで、追加の方法を選ぶ

```php:line-numbers=1408
        $add = match ($preserveKeys) {
            true => fn (array &$chunk, Traversable $iterator) => $chunk[$iterator->key()] = $iterator->current(),
            false => fn (array &$chunk, Traversable $iterator) => $chunk[] = $iterator->current(),
        };
```

`$preserveKeys` が `true` なら、元のキーをかたまりに入れます。`false` なら、番号を振って入れます。どちらの追加方法も、関数として `$add` に入れておきます。

### 3. ジェネレータで、かたまりを 1 つずつ作る

```php:line-numbers=1413
        return new static(function () use ($size, $add) {
            $iterator = $this->getIterator();

            while ($iterator->valid()) {
                $chunk = [];

                while (true) {
                    $add($chunk, $iterator);

                    if (count($chunk) < $size) {
                        $iterator->next();

                        if (! $iterator->valid()) {
                            break;
                        }
                    } else {
                        break;
                    }
                }

                yield new static($chunk);

                $iterator->next();
            }
        });
```

`new static(function () use (...) { ... })` は、ジェネレータを持つ遅延コレクションを作ります。中で `$iterator` を使って、元のデータを 1 つずつ読みます。

内側の `while (true)` で、かたまりが `$size` 個になるまで要素を追加します。そのたびに `$iterator->next()` で次へ進みます。かたまりが完成したら `yield new static($chunk);` で外へ渡し、次のかたまりへ進みます。

具体例として 5 件のデータを 2 件ずつ区切ると、`[1, 2]`、`[3, 4]`、`[5]` の 3 つのかたまりが、必要になった順に 1 つずつ作られます。

## ここがすごい

### 「必要になった分だけ」作る

ふつうの `chunk` は、全部のかたまりを一度に作ります。データが何百万件あると、メモリが足りなくなることがあります。この関数は `yield` を使うので、外側が 1 かたまりを受け取るたびに、次のかたまりだけを作ります。読み込みも処理も、少しずつ進みます。

### 途中で止めても、無駄な読み込みが出ない

ジェネレータは、使われなくなった時点で止まります。最初の 2 件だけ欲しいなら、残りのデータは読まれません。この性質が、大きなデータを扱うときの効率につながっています。

### 「次へ進む」を、ループの中に 1 か所にまとめる

`$iterator->next()` を、かたまりを作るループと、かたまりの終わりの 2 か所で呼んでいます。読み忘れや二重読みを防ぐため、位置の進め方を丁寧に決めている書き方です。

## まとめ

- 大きなデータは、ジェネレータで 1 かたまりずつ作ると、メモリを節約できる。
- 遅延の処理は、途中で止められるので、必要な分だけ読める。
- イテレータの位置の進め方を、1 つの流れにまとめると読み間違いが減る。
- キーを残すかどうかは、後で参照するかどうかで選ぶ。
