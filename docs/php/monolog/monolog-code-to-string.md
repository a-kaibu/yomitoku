---
title: PHP のエラー番号を、読める名前に変える
description: Monolog の ErrorHandler の codeToString は、PHP が出すエラーの番号（1、2、8 など）を、E_WARNING のような名前の文字列に変えます。知らない番号には「不明」と返すので、ログに数字だけが残ることを防ぎます。
language: php
project: Monolog
repo: https://github.com/Seldaek/monolog
license: MIT
copyright: Copyright (c) 2011-2020 Jordi Boggiano
commit: "3bed304b1905fed5c30d172872f4d890cbb03c6a"
file: src/Monolog/ErrorHandler.php
lines: [316, 336]
function: codeToString
difficulty: 1
format: 2
tags: [エラー処理, 可読性, 標準ライブラリ]
---
## ひとことで

`codeToString` は、PHP のエラーの番号を、人が読める名前の文字列に変える関数です。たとえば番号 `2` は `E_WARNING` になります。ログにこの名前が残るので、後から見たときに、どんな種類のエラーだったかすぐ分かります。

## コード

```php:line-numbers=316
    private static function codeToString(int $code): string
    {
        return match ($code) {
            E_ERROR => 'E_ERROR',
            E_WARNING => 'E_WARNING',
            E_PARSE => 'E_PARSE',
            E_NOTICE => 'E_NOTICE',
            E_CORE_ERROR => 'E_CORE_ERROR',
            E_CORE_WARNING => 'E_CORE_WARNING',
            E_COMPILE_ERROR => 'E_COMPILE_ERROR',
            E_COMPILE_WARNING => 'E_COMPILE_WARNING',
            E_USER_ERROR => 'E_USER_ERROR',
            E_USER_WARNING => 'E_USER_WARNING',
            E_USER_NOTICE => 'E_USER_NOTICE',
            2048 => 'E_STRICT',
            E_RECOVERABLE_ERROR => 'E_RECOVERABLE_ERROR',
            E_DEPRECATED => 'E_DEPRECATED',
            E_USER_DEPRECATED => 'E_USER_DEPRECATED',
            default => 'Unknown PHP error',
        };
    }
```

## 前提知識

- **エラーレベル**: PHP は、警告や通知などの種類を、2 の冪の番号で表します。`E_WARNING` は `2`、`E_NOTICE` は `8` などです。
- **定数**: `E_WARNING` のように、名前で決まっていて変わらない値のことです。PHP では、この名前がそのまま番号を表しています。
- **`match` 式**: 値に応じて結果を返す、PHP 8 の書き方です。`switch` と似ていますが、値をそのまま返せて、一致しないときの `default` を必ず書けます。
- **`private static`**: クラスの中だけで使う、インスタンスに依存しない関数です。
- **`default`**: どの場合にも当てはまらないときの値です。ここでは、「不明な PHP エラー」を返します。

## 何をしているか

### 1. 既知のエラー番号を、名前に対応させる

```php:line-numbers=318
        return match ($code) {
            E_ERROR => 'E_ERROR',
            E_WARNING => 'E_WARNING',
            E_PARSE => 'E_PARSE',
            E_NOTICE => 'E_NOTICE',
            E_CORE_ERROR => 'E_CORE_ERROR',
            E_CORE_WARNING => 'E_CORE_WARNING',
            E_COMPILE_ERROR => 'E_COMPILE_ERROR',
            E_COMPILE_WARNING => 'E_COMPILE_WARNING',
            E_USER_ERROR => 'E_USER_ERROR',
            E_USER_WARNING => 'E_USER_WARNING',
            E_USER_NOTICE => 'E_USER_NOTICE',
```

`match` で、`$code` の値を 1 つずつ比べます。`E_ERROR` なら `'E_ERROR'`、`E_WARNING` なら `'E_WARNING'` のように、定数の名前を文字列で返します。定数を直接書いているので、番号を覚えていなくても読めます。

### 2. 古い番号と、ほかの種類を扱う

```php:line-numbers=330
            2048 => 'E_STRICT',
            E_RECOVERABLE_ERROR => 'E_RECOVERABLE_ERROR',
            E_DEPRECATED => 'E_DEPRECATED',
            E_USER_DEPRECATED => 'E_USER_DEPRECATED',
```

`2048` は、`E_STRICT` の番号です。ここでは定数の名前ではなく、数字そのものを書いて対応させています。こうすると、番号を比べるだけで済み、定数の有無に左右されません。`E_DEPRECATED` などの新しい種類も、同じ並びで扱われます。

### 3. 知らない番号には、不明と返す

```php:line-numbers=334
            default => 'Unknown PHP error',
        };
```

どの場合にも当てはまらないときは、`default` で `'Unknown PHP error'` を返します。例外を投げずに、ログには何らかの説明が残ります。

## ここがすごい

- 定数の名前をそのまま文字列にしているので、番号の表と名前の表を別々に作る必要がありません。定数と名前がずれる心配もありません。
- `2048` のように定数が無い環境でも動くよう、数字を直接書いています。変わった環境でも、ログが壊れないように考えられています。
- `match` の `default` によって、知らない番号が来ても必ず文字列が返ります。戻り値の型を `string` に保ったまま、安全に使えます。
- 関数はインスタンスの状態を使わないので、`static` で書かれています。どこからでも、同じ方法で呼べる作りです。

## まとめ

`codeToString` は、PHP のエラーの番号を、`E_WARNING` のような読める名前に変える関数です。定数の名前をそのまま使い、知らない番号には「不明」と返します。ログを読む人が、エラーの種類をすぐ分かるようにするための、地味だけれど大切な関数です。
