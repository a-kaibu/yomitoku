---
title: HTTP ヘッダの行を、名前ごとの値の配列にまとめる
description: Guzzle の Utils::headersFromLines は、「名前：値」の行を 1 行ずつ分け、同じ名前の値を配列にまとめます。同じ名前のヘッダが複数来ても、すべて残す設計です。
language: php
project: Guzzle
repo: https://github.com/guzzle/guzzle
license: MIT
copyright: Copyright (c) 2011 Michael Dowling, Copyright (c) 2012 Jeremy Lindblom
commit: "7d9b1f430bb65ac664e120af227bf9a795ad6333"
file: src/Utils.php
lines: [31, 41]
function: Utils::headersFromLines
difficulty: 2
format: 2
tags: [ネットワーク, 文字列処理, データ構造]
---
## ひとことで

`headersFromLines` は、HTTP ヘッダの行（`Content-Type: text/html` のような形）の一覧を受け取り、ヘッダ名をキーにした連想配列に変える関数です。同じ名前のヘッダが複数あるときは、値を配列に積み上げます。

## コード

```php:line-numbers=31
    public static function headersFromLines(iterable $lines): array
    {
        $headers = [];

        foreach ($lines as $line) {
            $parts = \explode(':', $line, 2);
            $headers[\trim($parts[0], " \n\r\t\0\x0B")][] = isset($parts[1]) ? \trim($parts[1], " \n\r\t\0\x0B") : null;
        }

        return $headers;
    }
```

## 前提知識

- **HTTP ヘッダ**: 通信の付加情報を、`名前: 値` の行で表したものです。`Set-Cookie` のように、同じ名前が何度も現れることがあります。
- **`iterable`**: 配列でも、順番に値を返すジェネレーターでも受け取れる型です。
- **`explode(':', $line, 2)`**: `:` で 2 つまでに分ける関数です。値の中にも `:` を含むことがある（たとえば時刻や URL）ので、最初の `:` だけで分けます。
- **`$headers[...][] = ...`**: 配列の鍵の中に、さらに配列の要素を末尾に足す書き方です。
- **`trim` の文字の指定**: 空白、改行、タブ、NUL などの文字を取り除く指定です。

## 何をしているか

### 1. 行を名前と値に分ける

```php:line-numbers=35
        foreach ($lines as $line) {
            $parts = \explode(':', $line, 2);
```

1 行ずつ `:` で 2 つに分けます。`Content-Type: text/html` は、`Content-Type` と ` text/html` になります。2 つめの値の中に `:` があっても、分けるのは最初の 1 回だけです。

### 2. 名前と値の余分な空白を取り除く

```php:line-numbers=37
            $headers[\trim($parts[0], " \n\r\t\0\x0B")][] = isset($parts[1]) ? \trim($parts[1], " \n\r\t\0\x0B") : null;
```

名前と値の両端から、空白や改行を取り除きます。値が無い行（`:` が無い行）は、`isset` で確かめて `null` にします。

### 3. 同じ名前の値を積み上げる

同じ行の `$headers[名前][] = 値` が、名前ごとの配列の末尾に値を追加します。最初の `Set-Cookie` は配列の 0 番目に、2 つめは 1 番目に入ります。

結果として、ヘッダの名前ごとに、値のリストが得られます。

## ここがすごい

- **同じ名前を失わない**: ヘッダは同じ名前が複数あることがあるので、上書きせず配列に積みます。`Set-Cookie` の複数の値が消えません。
- **分割回数を制限**: `explode` の第 3 引数で、最初の区切りだけで分けます。値の中の `:` を壊さない、という小さな工夫です。
- **欠けた値を null で表す**: 値が無い行を、空文字と区別して `null` にします。「値が無い」と「値が空」の違いを残せます。
- **1 本の式で追加**: 名前ごとの配列の初期化を気にせず、`[]` の書き方で末尾に足せます。

## まとめ

- HTTP ヘッダを扱うときは、同じ名前が複数ある前提で配列に積むと安全。
- `explode` の分割数を指定すると、値の中の区切り文字を守れる。
- 値が無いことは `null` で表すと、空の値と区別できる。
- 配列の末尾に足す書き方を使うと、初期化の手間が減る。
