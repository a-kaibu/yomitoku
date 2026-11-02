---
title: コピーのときだけ、リクエストの中身を書き換えられるようにする
description: Symfony の Request::__clone は、クローン中に静的フラグを立ててから、内部の各入れ物を複製します。読み取り専用の扱いを保ったまま、コピーだけを安全に作る工夫です。
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "e6396e82011ded4608b896e8fff4da24d253382a"
file: src/Symfony/Component/HttpFoundation/Request.php
lines: [596, 610]
function: Request::__clone
difficulty: 3
format: 2
tags: [設計パターン, 防御的プログラミング, ネットワーク]
---
## ひとことで

`__clone` は、`clone` でリクエストのオブジェクトをコピーしたときに自動で呼ばれる特別なメソッドです。HTTP リクエストの中身（クエリやヘッダなど）は通常は書き換えられないようになっていますが、このメソッドの中だけは書き換えを許し、各部分を複製します。

## コード

```php:line-numbers=596
    public function __clone()
    {
        self::$writingBags = true;
        try {
            $this->query = clone $this->query;
            $this->request = clone $this->request;
            $this->attributes = clone $this->attributes;
            $this->cookies = clone $this->cookies;
            $this->files = clone $this->files;
            $this->server = clone $this->server;
            $this->headers = clone $this->headers;
        } finally {
            self::$writingBags = false;
        }
    }
```

## 前提知識

- **`clone`**: オブジェクトのコピーを作る PHP の演算子です。コピーの中身は、最初は元と同じ参照を指します。
- **`__clone`**: `clone` のあとに自動で呼ばれる特別なメソッドです。ここで、参照されている中身を個別に複製できます。
- **`self::$writingBags`**: クラスの静的なフラグです。`self::` でクラス全体の変数を参照します。
- **`try ... finally`**: `try` の中で例外が起きても、`finally` の中身は必ず実行される構文です。ここでは、フラグを必ず元に戻すために使います。
- **`$this->query` などの入れ物**: リクエストのクエリ、ヘッダ、クッキーなどを、それぞれ別の入れ物（`ParameterBag` など）で持っています。

## 何をしているか

### 1. 書き込みを許可する

```php:line-numbers=598
        self::$writingBags = true;
```

`writingBags` という静的フラグを `true` にします。このフラグが立っているあいだだけ、入れ物の中身を書き換えられるようになっています。通常はフラグが `false` なので、誰かが誤って中身を書き換えるのを防げます。

### 2. 入れ物を 1 つずつ複製する

```php:line-numbers=600
            $this->query = clone $this->query;
            $this->request = clone $this->request;
            $this->attributes = clone $this->attributes;
            $this->cookies = clone $this->cookies;
            $this->files = clone $this->files;
            $this->server = clone $this->server;
            $this->headers = clone $this->headers;
```

それぞれの入れ物を `clone` して、新しいオブジェクトを作り直します。こうしないと、コピーと元のリクエストが同じ入れ物を共有してしまい、片方の変更がもう片方に届きます。

### 3. 必ずフラグを戻す

```php:line-numbers=607
        } finally {
            self::$writingBags = false;
        }
```

`finally` で、フラグを `false` に戻します。複製の途中で例外が起きても、フラグが立ったままになりません。

## ここがすごい

- **書き換えの窓を最小にする**: フラグが立っているのは、複製の処理の中だけです。読み取り専用という設計を保ったまま、必要な場面だけ書き換えを許しています。
- **共有を断ち切る**: 入れ物ごとに `clone` するので、コピーの変更が元に影響しません。浅いコピーの落とし穴を、各フィールドで避けています。
- **例外で壊れない**: `finally` を使うので、途中で失敗してもフラグが `true` のまま残りません。後続の処理が誤って書き換えられることがありません。
- **意図が読める**: `writingBags` という名前で、「入れ物への書き込みを許すための期間」だと分かります。

## まとめ

- `__clone` は、オブジェクトのコピーの中身を個別に作り直すための場所。
- 参照を共有したままのコピーは、片方の変更がもう片方に影響するので、入れ物ごとに複製する。
- 一時的に書き換えを許すフラグは、`try ... finally` で必ず戻す。
- 読み取り専用の設計は、書き換えの窓を限定すると守りやすい。
