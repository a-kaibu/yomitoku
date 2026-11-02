---
title: 末尾の記号を、何個あっても1つにそろえる
description: Laravel の Str::finish は、文字列の末尾に指定の文字を 1 つだけ付けます。すでに同じ文字が重なっていれば、末尾の重なりをまとめて 1 つにします。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "b20bf7f442beabdb70e45cf9d29cd6c64675f856"
file: src/Illuminate/Support/Str.php
lines: [496, 513]
function: Str::finish
difficulty: 2
format: 2
tags: [文字列処理, 正規表現, 防御的プログラミング]
---
## ひとことで

`Str::finish` は、文字列の末尾が指定の文字（たとえば `/`）で終わるように整える関数です。末尾になければ付け足し、すでに付いていれば 1 つにまとめます。URL のパスを作るときに、`/` が重なったり欠けたりするのを防ぎます。

## コード

```php:line-numbers=496
    public static function finish($value, $cap)
    {
        if ($cap === '') {
            return $value;
        }

        if (! str_ends_with($value, $cap)) {
            return $value.$cap;
        }

        if (! str_ends_with($value, $cap.$cap)) {
            return $value;
        }

        $quoted = preg_quote($cap, '/');

        return preg_replace('/(?:'.$quoted.')+$/u', '', $value).$cap;
    }
```

## 前提知識

- **`str_ends_with`**: 文字列が指定の文字列で終わるかを調べる PHP の関数です。PHP 8 で標準になりました。
- **`.`（連結）**: 文字列どうしをつなぐ演算子です。`$value.$cap` は、2 つを並べた文字列を作ります。
- **正規表現と `preg_quote`**: `preg_quote` は、文字列を正規表現の中で特別な意味を持たない形に変えます。`/` などの記号を安全に使うためです。
- **`(?:...)+$`**: `(?:...)` は、まとめて数えるための括弧です。`+` は 1 回以上の繰り返し、`$` は文字列の末尾を表します。
- **`/u` の修飾子**: 正規表現を UTF-8 として扱う指定です。

## 何をしているか

### 1. 空の印なら何もしない

```php:line-numbers=498
        if ($cap === '') {
            return $value;
        }
```

付けるものが空なら、元の文字列をそのまま返します。

### 2. 末尾になければ付け足す

```php:line-numbers=502
        if (! str_ends_with($value, $cap)) {
            return $value.$cap;
        }
```

末尾が `$cap` で終わっていなければ、`$cap` を付けて返します。`path/to` は `path/to/` になります。

### 3. 1 つだけなら、そのまま返す

```php:line-numbers=506
        if (! str_ends_with($value, $cap.$cap)) {
            return $value;
        }
```

末尾が `$cap` で終わっていて、かつ `$cap$cap` で終わっていなければ、すでに 1 つだけ付いています。そのまま返します。

### 4. 重なった末尾をまとめる

```php:line-numbers=510
        $quoted = preg_quote($cap, '/');

        return preg_replace('/(?:'.$quoted.')+$/u', '', $value).$cap;
```

`$cap` が 2 つ以上続いている場合は、正規表現で末尾の連続をすべて取り除き、最後に `$cap` を 1 つ付け直します。たとえば `path//` は、末尾の `//` を消して `path` にしてから、`path/` になります。

`preg_quote` は、`$cap` が `.` や `*` のような記号でも、正規表現として安全に扱うために使われています。

## ここがすごい

- **段階的な判定**: 「付いていない」「1 つだけ」「重なっている」の 3 つの場合を、順番に判定しています。重なりの処理は、一番手間のかかる場合にだけ動きます。
- **正規表現の使いどころ**: 連続した末尾をまとめて消すには、正規表現の `+` が最適です。ループで 1 つずつ消す書き方より、短く安全に書けます。
- **記号の安全な扱い**: `preg_quote` を使うので、`$cap` にどんな記号が来ても、正規表現が壊れません。
- **不要な処理を避ける**: 末尾が正しく付いている場合は、正規表現を使わずに戻ります。よく使われる正常系は、軽い判定だけで済みます。

## まとめ

- 末尾の記号を整えるには、付いていない・1 つだけ・重なっているの 3 つを順に判定する。
- 連続した末尾の処理には、正規表現の `+` を使うと短く書ける。
- 正規表現に任意の文字列を入れるときは、`preg_quote` で記号を無効にする。
- 正常系は軽い判定で戻し、手間のかかる処理は必要な場合だけ行う。
