---
title: 期間に、同じフィルターが登録されているかを調べる
description: Carbon の CarbonPeriod の hasFilter は、期間に登録されたフィルターの中から、指定したものがあるかを調べます。フィルターが関数なら関数として、名前なら名前として、登録された形のどちらと比べるかを決めています。
language: php
project: Carbon
repo: https://github.com/briannesbitt/Carbon
license: MIT
copyright: Copyright (C) Brian Nesbitt
commit: "16c07968d5d346424ae69c2ea7814c586f62d37d"
file: src/Carbon/CarbonPeriod.php
lines: [1278, 1289]
function: hasFilter
difficulty: 2
format: 2
tags: [イテレータ, 型システム, 探索]
---
## ひとことで

`hasFilter` は、期間（CarbonPeriod）に、指定したフィルターがすでに登録されているかを答える関数です。フィルターは、日付を一つずつ見て通すかどうかを決める条件です。同じフィルターを二重に登録しないように、事前に確かめるために使われます。

## コード

```php:line-numbers=1278
    public function hasFilter(callable|string $filter): bool
    {
        $key = \is_callable($filter) ? 0 : 1;

        foreach ($this->filters as $tuple) {
            if ($tuple[$key] === $filter) {
                return true;
            }
        }

        return false;
    }
```

## 前提知識

- **フィルター**: 期間の中の各日付を調べて、残すか捨てるかを決める条件です。関数として登録するか、名前の付いた条件として登録します。
- **`callable|string` 型**: 引数が、呼び出せる値（関数や無名関数）か、文字列のどちらかであることを示す型の書き方です。
- **`is_callable`**: 値が関数として呼び出せるかを調べる関数です。
- **タプル（組）**: 2 つの値を一組にした配列です。ここでは、登録ごとに「関数」と「名前」の組が入っています。
- **`foreach` と早い `return`**: 一覧を順に見て、見つかった時点で結果を返す書き方です。

## 何をしているか

### 1. 比べる場所を決める

```php:line-numbers=1280
        $key = \is_callable($filter) ? 0 : 1;
```

`is_callable` で、引数が関数かを調べます。関数なら、登録の組の 0 番目と比べるので `$key` を 0 にします。文字列なら、1 番目の名前と比べるので `1` にします。

### 2. 登録済みのフィルターを順に見る

```php:line-numbers=1282
        foreach ($this->filters as $tuple) {
            if ($tuple[$key] === $filter) {
                return true;
            }
        }
```

`$this->filters` の各組について、選んだ位置の値が指定したフィルターと同じかを `===` で比べます。同じものが見つかれば、すぐに `true` を返します。

### 3. 見つからなければ false

```php:line-numbers=1288
        return false;
```

一覧を最後まで見ても無ければ、`false` を返します。

## ここがすごい

- 引数の種類によって、比べる場所を一度だけ決めています。ループの中で型を調べ直さないので、無駄がありません。
- `===` で厳密に比べるので、同じ見た目でも別物の関数を、誤って同じと判定しません。
- 見つかった時点で返すので、一覧が長くても、必要な分だけ調べて済みます。
- 関数と名前を、同じ組の形で保持しているため、登録の仕組みを一つにまとめられています。この関数は、その形を読むだけで済みます。

## まとめ

`hasFilter` は、期間に指定のフィルターが登録済みかを、関数か名前かによって比べる場所を変えて調べる関数です。厳密な比較と早い返却によって、正しく素早く答えを出します。フィルターを重ねて使う CarbonPeriod の仕組みを、安全に扱うための小さな部品です。
