---
title: "UTF-8 ではない文字列を、読める UTF-8 に直す"
description: "Monolog の detectAndCleanUtf8 は、正しい UTF-8 でない文字列を見つけると、ISO-8859-1 として読み直して UTF-8 に変換します。一部の記号は Windows-1252 の意味に読み替えます。"
language: php
project: Monolog
repo: https://github.com/Seldaek/monolog
license: MIT
copyright: Copyright (c) 2011-2020 Jordi Boggiano
commit: "3bed304b1905fed5c30d172872f4d890cbb03c6a"
file: src/Monolog/Utils.php
lines: [248, 271]
function: Utils::detectAndCleanUtf8
difficulty: 3
format: 2
tags: [Unicode, 文字列処理, 防御的プログラミング]
---

## ひとことで

`detectAndCleanUtf8` は、ログに残そうとした文字列が **正しい UTF-8 でなかったとき** に、読める形に直す関数です。文字化けしたデータが 1 つ混ざっても、ログの保存が失敗しないようにするための工夫です。

## コード

```php:line-numbers=248
    private static function detectAndCleanUtf8(&$data): void
    {
        if (\is_string($data) && preg_match('//u', $data) !== 1) {
            $data = preg_replace_callback(
                '/[\x80-\xFF]+/',
                function (array $m): string {
                    return \function_exists('mb_convert_encoding')
                        ? mb_convert_encoding($m[0], 'UTF-8', 'ISO-8859-1')
                        : (\function_exists('utf8_encode') ? utf8_encode($m[0]) : '');
                },
                $data
            );
            if (!\is_string($data)) {
                $pcreErrorCode = preg_last_error();

                throw new \RuntimeException('Failed to preg_replace_callback: ' . $pcreErrorCode . ' / ' . preg_last_error_msg());
            }
            $data = str_replace(
                ['¤', '¦', '¨', '´', '¸', '¼', '½', '¾'],
                ['€', 'Š', 'š', 'Ž', 'ž', 'Œ', 'œ', 'Ÿ'],
                $data
            );
        }
    }
```

## 前提知識

- **UTF-8**: 世界中の文字を 1 バイトから 4 バイトで表す、現在の標準的な文字コードです。
- **ISO-8859-1**: ヨーロッパの文字を 1 バイトで表す古い文字コードです。すべてのバイトが 1 つの文字に対応します。
- **Windows-1252**: Windows で使われていた文字コードです。ISO-8859-1 と似ていますが、`€` などが違う位置にあります。
- **`preg_match('//u', ...)`**: 空の正規表現を UTF-8 として調べる、文字列が正しい UTF-8 かの確認方法です。
- **`mb_convert_encoding`**: 文字コードを別の文字コードに変換する関数です。

## 何をしているか

### 1. 正しい UTF-8 なら、何もしない

```php:line-numbers=250
        if (\is_string($data) && preg_match('//u', $data) !== 1) {
```

`preg_match('//u', $data)` は、文字列が正しい UTF-8 のときだけ 1 を返します。そうでなければ、以下の変換に進みます。

### 2. 高いバイトの並びを、ISO-8859-1 として読み直す

```php:line-numbers=251
            $data = preg_replace_callback(
                '/[\x80-\xFF]+/',
                function (array $m): string {
                    return \function_exists('mb_convert_encoding')
                        ? mb_convert_encoding($m[0], 'UTF-8', 'ISO-8859-1')
                        : (\function_exists('utf8_encode') ? utf8_encode($m[0]) : '');
                },
                $data
            );
```

`[\x80-\xFF]+` は、1 バイトで 128 以上の文字（UTF-8 では不正になりやすい部分）にマッチします。見つけた部分を、`mb_convert_encoding` で ISO-8859-1 から UTF-8 に変換します。`mb_convert_encoding` がない環境では、`utf8_encode` を使います。

### 3. 一部の記号を、Windows-1252 の意味に直す

```php:line-numbers=265
            $data = str_replace(
                ['¤', '¦', '¨', '´', '¸', '¼', '½', '¾'],
                ['€', 'Š', 'š', 'Ž', 'ž', 'Œ', 'œ', 'Ÿ'],
                $data
            );
```

ISO-8859-1 では `¤` の位置にあった文字が、Windows-1252 では `€` を表します。`str_replace` で、この 8 文字の対応を正しい記号に直します。

具体例として、ISO-8859-1 の `Caf\xE9` は、読み直すと `Café` になります。

## ここがすごい

### 失敗を、ログの中で止めない

ログを残す処理が、文字化けで例外になると、大事な記録が失われます。この関数は、壊れた文字列を読める形に直してから記録させます。ログの目的を守るための、小さいけれど大切な工夫です。

### 「正しいかどうか」を先に確かめる

すべての文字列を変換すると、正しい UTF-8 の文字列も壊してしまうおそれがあります。`//u` で最初に確かめて、必要なときだけ変換しています。

### 変換の失敗も、例外として知らせる

```php:line-numbers=260
            if (!\is_string($data)) {
                $pcreErrorCode = preg_last_error();

                throw new \RuntimeException('Failed to preg_replace_callback: ' . $pcreErrorCode . ' / ' . preg_last_error_msg());
            }
```

`preg_replace_callback` が失敗したら、PCRE のエラーコードを付けて例外にします。黙って壊れた値を使うよりも、原因を残すほうが後で調べやすくなります。

## まとめ

- 正しい文字コードかどうかは、先に確かめてから変換すると安全。
- 古い文字コードの違いは、対応表を作って直すと扱いやすい。
- ログのような補助的な処理は、文字化けで止まらない設計にする。
- 変換が失敗したときは、原因を示す情報を残すと調べやすい。
