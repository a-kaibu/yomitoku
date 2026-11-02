---
title: 文字数ではなくバイト数を数える、小さな保険
description: php-jwt の safeStrlen は、mb_strlen を 8bit モードで呼んで、文字列のバイト数を確実に数えます。JWT の署名は文字の並びではなくバイト列として扱う必要があるためです。
language: php
project: php-jwt
repo: https://github.com/firebase/php-jwt
license: BSD-3-Clause
copyright: Copyright (c) 2011, Neuman Vong
commit: "0501f5729b9e2448516674aff07c7d1727869b8e"
file: src/JWT.php
lines: [558, 564]
function: JWT::safeStrlen
difficulty: 2
format: 2
tags: [文字列処理, 移植性, Unicode]
---
## ひとことで

`safeStrlen` は、文字列の長さをバイト数で返す関数です。`mb_strlen` が使えるときは `'8bit'` の指定でバイトとして数え、無ければ標準の `strlen` を使います。署名や暗号の処理では、長さは必ずバイト単位で扱う必要があります。

## コード

```php:line-numbers=558
    private static function safeStrlen(string $str): int
    {
        if (\function_exists('mb_strlen')) {
            return \mb_strlen($str, '8bit');
        }
        return \strlen($str);
    }
```

## 前提知識

- **文字数とバイト数**: 「あ」は見た目では 1 文字ですが、UTF-8 では 3 バイトです。暗号の計算は、この 3 バイトを 1 つずつ扱います。
- **`mbstring` 拡張**: PHP で日本語などのマルチバイト文字を扱うための拡張機能です。`mb_` で始まる関数はこの拡張に入っています。
- **`'8bit'`**: `mb_strlen` の文字コード指定です。「1 バイトを 1 文字として数える」という意味になります。
- **`private static`**: クラスの中だけで使い、インスタンスを作らずに呼べるメソッドです。
- **`: int`**: 戻り値の型を整数に決めている宣言です。

## 何をしているか

### 1. mbstring が使えるかを調べる

```php:line-numbers=560
        if (\function_exists('mb_strlen')) {
```

`function_exists` で `mb_strlen` の存在を確かめます。拡張が入っていない環境でも、関数が呼び出しエラーにならないようにするためです。

### 2. バイト数として数える

```php:line-numbers=561
            return \mb_strlen($str, '8bit');
```

`'8bit'` を指定すると、`mb_strlen` は文字のエンコーディング（UTF-8 など）を解釈しません。1 バイトを 1 として数えるので、結果は `$str` のバイト数になります。たとえば `"あ"` は `3` を返します。

### 3. 無いときは strlen を使う

```php:line-numbers=563
        return \strlen($str);
```

PHP の `strlen` は、もともとバイト数を返す関数です。mbstring が無い環境では、これで十分です。

## ここがすごい

- **同じ意味の結果を両方の環境で得る**: 拡張の有無によって数え方が変わると、署名の計算がずれて検証が失敗することがあります。この関数は、どちらの経路でもバイト数を返すように揃えています。
- **文字コードの設定に影響されない**: `'8bit'` を明示しているので、アプリの `mb_internal_encoding` の設定が変わっても結果は変わりません。
- **防御的な書き方**: 関数の有無を先に確かめてから呼ぶので、環境の差で致命的なエラーになりにくくなっています。
- **名前の意味**: 関数名の `safe` は、環境によらず同じ結果になるという意味だと読めます。

## まとめ

- 暗号やトークンの処理では、文字数ではなくバイト数を使う。
- `mb_strlen($s, '8bit')` は、どんな文字コードでもバイト数を返す書き方。
- 拡張の有無を `function_exists` で確かめると、環境による差を小さくできる。
