---
title: "Markdown のリンク先の URL を、安全な形に整える"
description: "CommonMark の UrlEncoder::unescapeAndEncode は、Markdown のリンク先に書かれた URL を、ブラウザが正しく読める形に変換します。すでに正しい %XX の並びは残し、それ以外だけを符号化します。"
language: php
project: CommonMark PHP
repo: https://github.com/thephpleague/commonmark
license: BSD-3-Clause
copyright: Copyright (c) 2014-2022, Colin O'Dell. All rights reserved.
commit: "3164fa3d41d78857384a29e1c606c456cbab9600"
file: src/Util/UrlEncoder.php
lines: [33, 68]
function: UrlEncoder::unescapeAndEncode
difficulty: 3
format: 2
tags: [文字列処理, Unicode, セキュリティ]
---

## ひとことで

`unescapeAndEncode` は、Markdown の `[ページ](...)` のような **リンク先の URL** を、HTML に出しても正しく動く形に整える関数です。日本語や空白が含まれていても、安全な `%E3%81...` の形に変換します。

## コード

::: code-group

```php:line-numbers=33 [日本語訳]
    public static function unescapeAndEncode(string $uri): string
    {
        // 最適化: そのまま残る文字だけなら、URL をそのまま返す。
        if (\preg_match('/^[A-Za-z0-9~!@#$&*()\-_=+;:,.\/?]+$/', $uri)) {
            return $uri;
        }

        if (! \mb_check_encoding($uri, 'UTF-8')) {
            throw new UnexpectedEncodingException('Unexpected encoding - UTF-8 or ASCII was expected');
        }

        $result = '';

        $chars = \mb_str_split($uri, 1, 'UTF-8');

        $l = \count($chars);
        for ($i = 0; $i < $l; $i++) {
            $code = $chars[$i];
            if ($code === '%' && $i + 2 < $l) {
                if (\preg_match('/^[0-9a-f]{2}$/i', $chars[$i + 1] . $chars[$i + 2]) === 1) {
                    $result .= '%' . $chars[$i + 1] . $chars[$i + 2];
                    $i      += 2;
                    continue;
                }
            }

            if (\strlen($code) === 1 && \ord($code) < 128) {
                $result .= self::ENCODE_CACHE[\ord($code)];
                continue;
            }

            $result .= \rawurlencode($code);
        }

        return $result;
    }
```

```php:line-numbers=33 [原文]
    public static function unescapeAndEncode(string $uri): string
    {
        // Optimization: if the URL only includes characters we know will be kept as-is, then just return the URL as-is.
        if (\preg_match('/^[A-Za-z0-9~!@#$&*()\-_=+;:,.\/?]+$/', $uri)) {
            return $uri;
        }

        if (! \mb_check_encoding($uri, 'UTF-8')) {
            throw new UnexpectedEncodingException('Unexpected encoding - UTF-8 or ASCII was expected');
        }

        $result = '';

        $chars = \mb_str_split($uri, 1, 'UTF-8');

        $l = \count($chars);
        for ($i = 0; $i < $l; $i++) {
            $code = $chars[$i];
            if ($code === '%' && $i + 2 < $l) {
                if (\preg_match('/^[0-9a-f]{2}$/i', $chars[$i + 1] . $chars[$i + 2]) === 1) {
                    $result .= '%' . $chars[$i + 1] . $chars[$i + 2];
                    $i      += 2;
                    continue;
                }
            }

            if (\strlen($code) === 1 && \ord($code) < 128) {
                $result .= self::ENCODE_CACHE[\ord($code)];
                continue;
            }

            $result .= \rawurlencode($code);
        }

        return $result;
    }
```

:::

## 前提知識

- **パーセントエンコード**: URL に使えない文字を `%` と 16 進数 2 桁で表す書き方です。空白は `%20`、日本語は UTF-8 のバイトごとに `%E3%81%82` のように表します。
- **UTF-8 の確認**: 文字列が正しい UTF-8 かどうかを、`mb_check_encoding` で調べます。
- **`mb_str_split`**: 文字列を、1 文字ずつの配列に分ける関数です。日本語も 1 文字として扱えます。
- **`rawurlencode`**: 文字列をパーセントエンコードする PHP の関数です。
- **`ord`**: 1 文字の値（文字コードの番号）を返す関数です。

## 何をしているか

### 1. 安全な文字だけなら、そのまま返す

::: code-group

```php:line-numbers=35 [日本語訳]
        // 最適化: そのまま残る文字だけなら、URL をそのまま返す。
        if (\preg_match('/^[A-Za-z0-9~!@#$&*()\-_=+;:,.\/?]+$/', $uri)) {
            return $uri;
        }
```

```php:line-numbers=35 [原文]
        // Optimization: if the URL only includes characters we know will be kept as-is, then just return the URL as-is.
        if (\preg_match('/^[A-Za-z0-9~!@#$&*()\-_=+;:,.\/?]+$/', $uri)) {
            return $uri;
        }
```

:::

英数字と記号の一部だけでできた URL は、変換の必要がないので、そのまま返します。

### 2. UTF-8 でなければ、エラーにする

```php:line-numbers=40
        if (! \mb_check_encoding($uri, 'UTF-8')) {
            throw new UnexpectedEncodingException('Unexpected encoding - UTF-8 or ASCII was expected');
        }
```

`mb_check_encoding` で、文字列が UTF-8 か ASCII かを確かめます。そうでなければ、例外にします。文字コードが分からない文字列を、黙って変換しないためです。

### 3. 既に正しい `%XX` は、そのまま残す

```php:line-numbers=44
        $result = '';

        $chars = \mb_str_split($uri, 1, 'UTF-8');

        $l = \count($chars);
        for ($i = 0; $i < $l; $i++) {
            $code = $chars[$i];
            if ($code === '%' && $i + 2 < $l) {
                if (\preg_match('/^[0-9a-f]{2}$/i', $chars[$i + 1] . $chars[$i + 2]) === 1) {
                    $result .= '%' . $chars[$i + 1] . $chars[$i + 2];
                    $i      += 2;
                    continue;
                }
            }
```

文字を 1 つずつ見ていきます。`%` の後ろに 16 進数 2 桁が続くなら、それはすでに符号化された文字なので、そのまま残します。二重に符号化しないための判定です。

### 4. ASCII は表で、それ以外は `rawurlencode` で変換する

```php:line-numbers=59
            if (\strlen($code) === 1 && \ord($code) < 128) {
                $result .= self::ENCODE_CACHE[\ord($code)];
                continue;
            }

            $result .= \rawurlencode($code);
        }

        return $result;
```

1 バイトの ASCII 文字は、事前に作った表（`ENCODE_CACHE`）で変換します。それ以外の文字（日本語など）は `rawurlencode` で変換します。

具体例として `a b` は `a%20b` に、`%20` はそのまま残ります。

## ここがすごい

### 二重に符号化しない

`%20` を、もう一度 `%2520` にしてしまうと、リンクは壊れます。この関数は、`%` の後ろに 16 進数が続いているかを先に確かめて、すでに符号化された部分を残します。「同じ変換を 2 回しない」という、冪等（何回やっても同じ）性を大事にした書き方です。

### 変換の前に、安全な場合を見分ける

ほとんどの URL は、すでに安全な文字だけでできています。その場合は、1 文字ずつ見る前に、正規表現 1 つで判定して、そのまま返します。普通の入力を速く、珍しい入力を丁寧に扱う、という使い分けです。

### 文字コードの確認をエラーにする

文字コードが UTF-8 でない文字列を、そのまま変換すると、意味のない文字になってしまいます。ここでは例外にして、問題を早く知らせます。

## まとめ

- URL の符号化は、すでに符号化された部分を残すと、二重の変換を防げる。
- 安全な入力は、正規表現で素早く判定して返すと速い。
- 1 文字ずつ変換するときは、文字の種類で変換の方法を分けると効率がよい。
- 文字コードが分からない入力は、黙って変換せず例外で知らせる。
