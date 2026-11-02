---
title: 文字列も配列も反復可能なものも、同じ slice で切り出す
description: Twig の slice フィルターの実装は、文字列、配列、イテレータのそれぞれに合った方法で、一部分だけを取り出します。反復可能な値は、必要な範囲だけを読む LimitIterator を使います。
language: php
project: Twig
repo: https://github.com/twigphp/Twig
license: BSD-3-Clause
copyright: Copyright (c) 2009-present by the Twig Team.
commit: "beb4b229784425ceb6514cec9c573b3e42b30703"
file: src/Extension/CoreExtension.php
lines: [760, 783]
function: CoreExtension::slice
difficulty: 3
format: 2
tags: [イテレータ, 文字列処理, 遅延評価]
---

## ひとことで

`slice` は、テンプレートで `{{ items|slice(1, 2) }}` のように、データの **一部分だけを取り出す** フィルターの中身です。文字列、配列、そしてイテレータという、性質の違う値を同じ書き方で切り出せます。

## コード

```php:line-numbers=760
    public static function slice(string $charset, $item, $start, $length = null, $preserveKeys = false)
    {
        if ($item instanceof \Traversable) {
            while ($item instanceof \IteratorAggregate) {
                $item = $item->getIterator();
            }

            if ($start >= 0 && $length >= 0 && $item instanceof \Iterator) {
                try {
                    return iterator_to_array(new \LimitIterator($item, $start, $length ?? -1), $preserveKeys);
                } catch (\OutOfBoundsException $e) {
                    return [];
                }
            }

            $item = iterator_to_array($item, $preserveKeys);
        }

        if (\is_array($item)) {
            return \array_slice($item, $start, $length, $preserveKeys);
        }

        return mb_substr((string) $item, $start, $length, $charset);
    }
```

## 前提知識

- **スライス**: 配列や文字列の一部を、開始位置と長さで取り出すことです。
- **イテレータ（Iterator）**: 値を 1 つずつ順番に取り出せるオブジェクトです。全部を一度に持たなくても回せます。
- **`LimitIterator`**: 元のイテレータから、指定した位置から指定した数だけ取り出す PHP の標準の部品です。
- **`mb_substr`**: 文字数を数えて、文字列の一部を取り出す関数です。日本語にも対応します。
- **`IteratorAggregate`**: 「イテレータを返す」ことを約束したオブジェクトです。

## 何をしているか

### 1. イテレータなら、本当のイテレータを取り出す

```php:line-numbers=762
        if ($item instanceof \Traversable) {
            while ($item instanceof \IteratorAggregate) {
                $item = $item->getIterator();
            }
```

`IteratorAggregate` は、中に別のイテレータを持っています。`getIterator()` を繰り返して、本当のイテレータに行き着くまで取り出します。

### 2. 範囲が正しければ、必要な分だけ読む

```php:line-numbers=767
            if ($start >= 0 && $length >= 0 && $item instanceof \Iterator) {
                try {
                    return iterator_to_array(new \LimitIterator($item, $start, $length ?? -1), $preserveKeys);
                } catch (\OutOfBoundsException $e) {
                    return [];
                }
            }
```

開始位置と長さが 0 以上で、イテレータとして読めるときは、`LimitIterator` で必要な範囲だけを取り出します。全部を読み込まずに済むのが利点です。範囲外になった場合は空の配列を返します。

### 3. それ以外は、配列にしてから切る

```php:line-numbers=775
            $item = iterator_to_array($item, $preserveKeys);
        }

        if (\is_array($item)) {
            return \array_slice($item, $start, $length, $preserveKeys);
```

範囲の指定が負の数だったり、イテレータが `Iterator` でなかったりするときは、全部を配列にしてから、`array_slice` で切り出します。

### 4. 文字列なら、文字数で切る

```php:line-numbers=782
        return mb_substr((string) $item, $start, $length, $charset);
```

配列でもなければ、文字列として扱い、`mb_substr` で文字数を基準に切り出します。

## ここがすごい

### 必要な分だけを読む、遅延の工夫

イテレータは、全部の要素を持たずに 1 つずつ取り出せます。`LimitIterator` を使うと、指定した範囲以外は読みません。大きなデータベースの結果を一部だけ表示する場面などで、無駄な読み込みを防げます。

### 性質の違いを、分岐の順番で扱う

最初にイテレータの場合を扱い、次に配列、最後に文字列の順に判定しています。どれにも当てはまらない値は、文字列に変換してから切ります。順番に判定する形なので、どの型がどう扱われるかが読み取りやすくなっています。

### 負の数の指定は、全部読んでから切る

負の位置は、イテレータの途中からの読み方では扱いにくいので、いったん配列にします。特殊な場合を分けて、通常の場合を速く保つ書き方です。

## まとめ

- 種類の違う値を一つの関数で扱うときは、型ごとに分岐して順番に判定すると分かりやすい。
- 大きなデータは、必要な範囲だけ読む部品（`LimitIterator`）を使うと無駄が減る。
- 特殊な指定は、全部を配列にしてから処理すると、通常の場合の速さを保てる。
- 文字列は、文字数を基準に切らないと日本語で崩れる。
