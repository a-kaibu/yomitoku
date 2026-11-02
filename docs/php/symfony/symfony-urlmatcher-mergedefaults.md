---
title: "ルートの初期値に、URL から取れた値をかぶせる"
description: "Symfony の UrlMatcher::mergeDefaults は、ルートに決めてある初期値へ、URL から取り出した値を上書きで重ねる小さな関数です。"
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/Routing/Matcher/UrlMatcher.php
lines: [244, 253]
function: UrlMatcher::mergeDefaults
difficulty: 1
format: 2
tags: [API設計, イディオム]
---

## ひとことで

`mergeDefaults` は、ルートに最初から決めてある値（デフォルト値）に、URL から取り出した値を重ねる関数です。URL の中に値がなければ、初期値がそのまま残ります。

## コード

```php:line-numbers=244
    protected function mergeDefaults(array $params, array $defaults): array
    {
        foreach ($params as $key => $value) {
            if (!\is_int($key) && null !== $value) {
                $defaults[$key] = $value;
            }
        }

        return $defaults;
    }
```

## 前提知識

- **配列とキー**: `['id' => 5]` のように、名前（キー）と値を組にして持つ入れ物です。PHP では `$key => $value` の形で、順番に取り出せます。
- **`foreach`**: 配列の要素を 1 つずつ順番に取り出して、くり返し処理する命令です。
- **`is_int`**: 値が整数かどうかを調べる関数です。ここでは、キーが `0` や `1` のような番号（数字だけのキー）かを確かめるために使います。
- **`null`**: 「値がない」ことを表す特別な値です。

## 何をしているか

### 1. 要素を 1 つずつ取り出す

```php:line-numbers=246
        foreach ($params as $key => $value) {
```

`foreach` で、`$params` の名前と値を順に取り出します。

### 2. 番号のキーと `null` を除いて上書きする

```php:line-numbers=247
            if (!\is_int($key) && null !== $value) {
                $defaults[$key] = $value;
            }
```

キーが数字だけ（`is_int`）の要素と、値が `null` の要素は飛ばします。残りの値で、`$defaults` の同じ名前の値を上書きします。

### 3. 上書きした配列を返す

```php:line-numbers=252
        return $defaults;
```

上書き後の `$defaults` が、そのルートの最終的な値になります。

## ここがすごい

### 番号のキーを無視する

```php:line-numbers=247
            if (!\is_int($key) && null !== $value) {
```

`is_int($key)` で、キーが数字だけの番号かを調べて、番号のキーは取り込みません。URL から取れた「位置だけの値」を、名前付きの初期値に混ぜないための工夫です。

### 「かぶせる」を 1 行で書いている

```php:line-numbers=248
                $defaults[$key] = $value;
```

`$defaults[$key] = $value;` の 1 行が上書きの本体です。

## まとめ

この関数は、「初期値を用意しておき、URL の値で上書きする」という考え方を、短い `foreach` で表しています。`null` と番号キーを除くことで、URL の値が初期値を壊さないようになっています。
