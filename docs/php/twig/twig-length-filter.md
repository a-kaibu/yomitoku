---
title: "文字列も配列もオブジェクトも、同じ length で数える"
description: "Twig の length フィルターは、文字列の文字数、配列の要素数、反復可能なオブジェクトの件数を、一つの関数で数えます。値の種類を順番に調べて、適した数え方を選びます。"
language: php
project: Twig
repo: https://github.com/twigphp/Twig
license: BSD-3-Clause
copyright: Copyright (c) 2009-present by the Twig Team.
commit: "beb4b229784425ceb6514cec9c573b3e42b30703"
file: src/Extension/CoreExtension.php
lines: [1288, 1311]
function: CoreExtension::length
difficulty: 2
format: 2
tags: [型システム, 文字列処理, イテレータ]
---

## ひとことで

`length` は、テンプレートの `{{ items|length }}` で使われる関数です。文字列なら文字数、配列なら要素数を返します。値の種類が違っても、同じ書き方で長さを取れるように作られています。

## コード

```php:line-numbers=1288
    public static function length(string $charset, $thing): int
    {
        if (null === $thing) {
            return 0;
        }

        if (\is_scalar($thing)) {
            return mb_strlen($thing, $charset);
        }

        if ($thing instanceof \Countable || \is_array($thing) || $thing instanceof \SimpleXMLElement) {
            return \count($thing);
        }

        if ($thing instanceof \Traversable) {
            return iterator_count($thing);
        }

        if ($thing instanceof \Stringable) {
            return mb_strlen((string) $thing, $charset);
        }

        return 1;
    }
```

## 前提知識

- **スカラー値**: 1 つの値だけを表す型です。文字列、数値、真偽値などが該当します。
- **`Countable`**: `count()` で要素数を数えられることを約束したインターフェースです。
- **`Traversable`**: `foreach` で回せるものの総称です。配列やイテレータが該当します。
- **`Stringable`**: 文字列に変換できるオブジェクトの約束です。
- **`iterator_count`**: イテレータの要素数を数える PHP の関数です。

## 何をしているか

### 1. 空なら 0

```php:line-numbers=1290
        if (null === $thing) {
            return 0;
        }
```

値が `null` なら、長さは 0 です。

### 2. 文字列や数値なら、文字数を数える

```php:line-numbers=1294
        if (\is_scalar($thing)) {
            return mb_strlen($thing, $charset);
        }
```

スカラー値（文字列や数値）は、`mb_strlen` で文字数を数えます。日本語を含む文字列でも、文字単位で正しく数えられます。

### 3. 配列や `Countable` なら、`count` で数える

```php:line-numbers=1298
        if ($thing instanceof \Countable || \is_array($thing) || $thing instanceof \SimpleXMLElement) {
            return \count($thing);
        }
```

配列や `Countable` のオブジェクトは、`count` で要素数を取ります。SimpleXML の要素もここに含まれます。

### 4. 反復できるものは、回して数える

```php:line-numbers=1302
        if ($thing instanceof \Traversable) {
            return iterator_count($thing);
        }

        if ($thing instanceof \Stringable) {
            return mb_strlen((string) $thing, $charset);
        }
```

`Traversable` のものは、`iterator_count` で件数を数えます。`Stringable` なオブジェクトは、文字列に変えてから文字数を数えます。

### 5. どれにも当てはまらなければ 1

```php:line-numbers=1310
        return 1;
```

ほかの種類のオブジェクトは、1 つの値として 1 を返します。

## ここがすごい

### 「どの型か」を、上から順に判定している

型の判定は、もっとも具体的なものから順に行われています。`null`、スカラー、`Countable`、`Traversable`、`Stringable`の順です。順番を守ると、同じオブジェクトが複数の性質を持っていても、正しい数え方が選ばれます。

### 数えるために、全部を読むかどうかを選ぶ

配列やカウント可能なものは、`count` で一瞬に数えられます。イテレータは、全部を回して数えるしかありません。数え方を型ごとに分けることで、速い方法が使える場面では、速い方法を使っています。

### 「1」という既定値の意味

それ以外のオブジェクトは 1 とみなします。「1 つの値」として扱うのは、テンプレートの利用者にとって直感的な扱いです。何も数えられないときに 0 を返さないことで、「存在するものは数える」という一貫性を保っています。

## まとめ

- 値の種類を判定する順番は、具体的なものから先に決めると誤りが少ない。
- 数える方法は、型ごとに一番速い方法を選ぶと効率がよい。
- 文字数は `mb_strlen` のように、文字単位の関数を使うと日本語でも正確になる。
- 「どれにも当てはまらない」の既定値は、利用者の直感に合わせて決める。
