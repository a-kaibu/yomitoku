---
title: 既存のメソッドを上書きしない、マクロの候補の絞り込み
description: Carbon の getMixableMethods は、外から取り込むクラスのメソッドのうち、Carbon が既に持っていないものだけを yield で 1 つずつ返します。既存の機能を壊さないための仕組みです。
language: php
project: Carbon
repo: https://github.com/briannesbitt/Carbon
license: MIT
copyright: Copyright (C) Brian Nesbitt
commit: "16c07968d5d346424ae69c2ea7814c586f62d37d"
file: src/Carbon/Traits/Mixin.php
lines: [199, 208]
function: Mixin::getMixableMethods
difficulty: 3
format: 2
tags: [メタプログラミング, イテレータ, API設計]
---
## ひとことで

`getMixableMethods` は、`Carbon::mixin()` で外からクラスを取り込むときに、取り込む候補のメソッド名を 1 つずつ返すジェネレーターです。Carbon にすでに同じ名前のメソッドがあるものは飛ばし、既存の動作を壊さないようにします。

## コード

```php:line-numbers=199
    private static function getMixableMethods(self $context): Generator
    {
        foreach (get_class_methods($context) as $name) {
            if (method_exists(static::class, $name)) {
                continue;
            }

            yield $name;
        }
    }
```

## 前提知識

- **mixin（ミックスイン）**: 別のクラスのメソッドを、あとから既存のクラスに組み込む仕組みです。Carbon では、ユーザーが自分で作ったクラスのメソッドを、日時の機能に加えられます。
- **`Generator`（ジェネレーター）**: `yield` を使って、値を 1 つずつ返せる仕組みです。全部を配列にしてから返すより、必要な分だけ作れます。
- **`yield`**: ジェネレーターの中で、値を 1 つ返して、一度そこで止まる文です。次に呼ばれたら、続きから再開します。
- **`get_class_methods`**: オブジェクトのクラスが持つメソッド名を、配列で返す PHP の関数です。
- **`method_exists`**: 指定したクラスに、そのメソッドが定義されているかを調べる関数です。
- **`static::class` と `self`**: `static::class` は実際に呼ばれたクラスの名前、`self` は関数を定義しているクラスを指します。

## 何をしているか

### 1. 取り込み元のメソッド名を全部見る

```php:line-numbers=201
        foreach (get_class_methods($context) as $name) {
```

`$context` は取り込み元のオブジェクトです。そのクラスのメソッド名を、1 つずつ `$name` に入れて調べます。

### 2. Carbon が既に持つものは飛ばす

```php:line-numbers=202
            if (method_exists(static::class, $name)) {
                continue;
            }
```

`method_exists(static::class, $name)` は、Carbon 側にすでに同じ名前のメソッドがあるかを確かめます。あれば `continue` で次の名前に進みます。これで、取り込み元の `format` や `add` のような名前が、Carbon 本来の機能を上書きすることを防ぎます。

### 3. 残った名前を 1 つずつ返す

```php:line-numbers=206
            yield $name;
```

Carbon に無い名前だけが `yield` で返されます。呼び出し側は、必要なところで `foreach` を使って 1 つずつ受け取ります。全候補をいったん配列にする必要はありません。

## ここがすごい

- **既存機能を守る**: 取り込みで名前が衝突すると、Carbon の基本動作が意図せず変わってしまいます。この関数は、衝突する名前を最初に取り除いているので、安全に機能を増やせます。
- **名前の判定が 1 行**: `method_exists` で判定しているので、衝突の一覧を別に管理する必要がありません。Carbon 側にメソッドを足したら、自動的に除外の対象に入ります。
- **遅延して返す**: `yield` を使うと、候補を全部メモリに置かずに済みます。取り込むメソッドが多くても、1 つずつ処理できます。
- **`static::class` を使う**: 同じ関数でも、呼ばれたクラスに合わせて判定するので、Carbon の派生クラスでも正しく動きます。

## まとめ

- 外部のメソッドを組み込むときは、既存の名前との衝突を先に取り除く。
- `method_exists` で既存の名前を調べると、衝突の一覧を別に持たずに済む。
- `yield` で候補を 1 つずつ返すと、大きな一覧を作らずに済む。
- `static::class` を使うと、派生クラスでも正しい判定になる。
