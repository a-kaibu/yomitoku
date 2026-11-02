---
title: ヘッダ名を小文字の鍵にして、元の表記を覚えておく
description: Guzzle の Utils::normalizeHeaderKeys は、ヘッダ名を ASCII の小文字にした鍵と、元の表記の対応表を作ります。大文字と小文字が違うだけのヘッダを、同じものとして探せるようにします。
language: php
project: Guzzle
repo: https://github.com/guzzle/guzzle
license: MIT
copyright: Copyright (c) 2011 Michael Dowling, Copyright (c) 2012 Jeremy Lindblom
commit: "7d9b1f430bb65ac664e120af227bf9a795ad6333"
file: src/Utils.php
lines: [258, 266]
function: Utils::normalizeHeaderKeys
difficulty: 2
format: 2
tags: [ネットワーク, 文字列処理, データ構造]
---
## ひとことで

`normalizeHeaderKeys` は、ヘッダの連想配列を受け取り、「小文字にした名前」から「元の名前」への対応表を作る関数です。HTTP のヘッダ名は大文字と小文字を区別しないので、`Content-Type` と `content-type` を同じものとして探せます。

## コード

```php:line-numbers=258
    public static function normalizeHeaderKeys(array $headers): array
    {
        $result = [];
        foreach (\array_keys($headers) as $key) {
            $result[Psr7\Utils::asciiToLower((string) $key)] = $key;
        }

        return $result;
    }
```

## 前提知識

- **HTTP ヘッダ名の大文字と小文字**: HTTP の仕様では、ヘッダ名は大文字と小文字を区別しません。`Content-Type` と `content-type` は同じ意味です。
- **`array_keys`**: 配列の鍵だけを、新しい配列として取り出す PHP の関数です。
- **連想配列の鍵**: 配列の鍵に、文字列を使えます。同じ鍵を書くと、後の値で上書きされます。
- **`Psr7\Utils::asciiToLower`**: ASCII の英字だけを小文字にする関数です。Guzzle は PSR-7 というメッセージの規格のライブラリを使っています。
- **`(string)`**: 値を文字列に変換するキャストです。鍵が数字でも、文字列として扱えます。

## 何をしているか

### 1. 元の鍵を一覧にする

```php:line-numbers=260
        $result = [];
        foreach (\array_keys($headers) as $key) {
```

ヘッダの連想配列の鍵だけを取り出して、1 つずつ処理します。値は使わないので、鍵だけを見ます。

### 2. 小文字の鍵から元の鍵を引けるようにする

```php:line-numbers=262
            $result[Psr7\Utils::asciiToLower((string) $key)] = $key;
```

元の鍵を ASCII の小文字に変えて、それを新しい配列の鍵にします。値には、元の鍵をそのまま入れます。

たとえば `Content-Type` は、`content-type` という鍵で、値は `Content-Type` になります。

### 3. 対応表を返す

```php:line-numbers=265
        return $result;
```

作った対応表を返します。呼び出し側は、小文字の名前で探せば、元の表記を知ることができます。

## ここがすごい

- **表記の揺れを 1 つにまとめる**: 検索のキーを小文字で統一すると、大文字と小文字の違いを気にせずに探せます。
- **元の表記を失わない**: 値に元の名前を入れているので、送信するときやログに出すときは、利用者が書いた形を使えます。
- **ASCII 限定の小文字化**: `strtolower` ではなく、ASCII の英字だけを変える関数を使っています。ロケールの設定で、他の文字が変わる心配がありません。
- **鍵の重複を利用**: 同じ小文字の名前が複数あると、後のものが残ります。ヘッダの扱いとしては、この規則で十分です。

## まとめ

- ヘッダ名の検索では、小文字の鍵を作ると大文字と小文字の揺れを吸収できる。
- 対応表の値に元の名前を残すと、表示や送信には元の形を使える。
- 小文字化は、ロケールの影響を受けない ASCII 専用の関数を使うと安定する。
- 連想配列の鍵の重複を、設計の一部として利用できる。
