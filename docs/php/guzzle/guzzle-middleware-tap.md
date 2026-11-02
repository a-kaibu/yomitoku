---
title: リクエストの前後に、処理をそっと挟む仕掛け
description: Guzzle の Middleware::tap は、HTTP リクエストが送られる前と受け取った後に、好きな処理を挟めるミドルウェアを作ります。ログや計測を、本体のコードに触れずに足せるのが特徴です。
language: php
project: Guzzle
repo: https://github.com/guzzle/guzzle
license: MIT
copyright: Copyright (c) 2011 Michael Dowling <mtdowling@gmail.com>
commit: "7d9b1f430bb65ac664e120af227bf9a795ad6333"
file: src/Middleware.php
lines: [186, 206]
function: Middleware::tap
difficulty: 3
format: 2
tags: [設計パターン, ネットワーク, クロージャ]
---

## ひとことで

`Middleware::tap` は、HTTP 通信の **前と後に処理を挟む** ためのミドルウェアを作る関数です。リクエストの内容をログに残す、処理時間を測る、といった用途に使えます。通信の本体の処理は一切書き換えずに済みます。

## コード

```php:line-numbers=186
    public static function tap(?callable $before = null, ?callable $after = null): callable
    {
        return static function (callable $handler) use ($before, $after): callable {
            return static function (
                #[\SensitiveParameter]
                RequestInterface $request,
                #[\SensitiveParameter]
                array $options
            ) use ($handler, $before, $after): PromiseInterface {
                if ($before) {
                    $before($request, $options);
                }
                $response = $handler($request, $options);
                if ($after) {
                    $after($request, $options, $response);
                }

                return $response;
            };
        };
    }
```

## 前提知識

- **HTTP リクエスト**: Web サーバーに「このページがほしい」と送る依頼です。Guzzle はこれを PHP から送るためのライブラリです。
- **ミドルウェア**: 本来の処理（ここでは通信）の前後に割り込む部品です。鎖のように何段も重ねられます。
- **無名関数（クロージャ）**: その場で作る関数です。`use` で外側の変数を取り込めます。
- **`#[\SensitiveParameter]`**: 引数に付けると、エラーの記録（スタックトレース）に値が出ないようにする PHP の属性（アトリビュート）です。パスワードなどを守ります。
- **`PromiseInterface`**: 「あとで結果が届く」ことを表す型です。非同期通信の結果を表します。

## 何をしているか

### 1. 外側の関数で、ミドルウェアの部品を作る

```php:line-numbers=186
    public static function tap(?callable $before = null, ?callable $after = null): callable
    {
        return static function (callable $handler) use ($before, $after): callable {
```

`tap($before, $after)` は、すぐに通信をするのではなく、ミドルウェアを作る関数を返します。`static function (callable $handler)` が、次の処理（`$handler`）を受け取る入り口です。

### 2. 本体の処理の前後に、2 つの関数を挟む

```php:line-numbers=189
            return static function (
                #[\SensitiveParameter]
                RequestInterface $request,
                #[\SensitiveParameter]
                array $options
            ) use ($handler, $before, $after): PromiseInterface {
                if ($before) {
                    $before($request, $options);
                }
                $response = $handler($request, $options);
                if ($after) {
                    $after($request, $options, $response);
                }

                return $response;
            };
```

内側の関数は、リクエストとオプションを受け取ります。`$before` が設定されていれば、通信の前にそれを呼びます。次に `$handler($request, $options)` で本当の通信を行い、結果の `$response` を受け取ります。`$after` があれば、その結果を使って呼び、最後に `$response` をそのまま返します。

`$before` や `$after` は、基本的には「見る」ための関数として使います。戻り値を使わないので、通信の結果そのものは変わりません。

### 3. 機密の値を、エラーの記録から隠す

`#[\SensitiveParameter]` が付いた引数は、例外が起きたときのスタックトレースに値が出ません。Authorization ヘッダーのような秘密の情報が、ログに残らないようにするための印です。

## ここがすごい

### 「前と後」を、外側から組み立てている

ミドルウェアは、外側の関数で部品を作り、内側の関数で実際の処理をする 2 段構えです。この形にすると、`tap` の引数を変えるだけで、同じ部品を何通りにも作れます。引数の `$handler` を後から受け取る仕組みが、ミドルウェアを積み重ねる土台になっています。

### 本体の処理を、一切変えない

```php:line-numbers=195
                if ($before) {
                    $before($request, $options);
                }
                $response = $handler($request, $options);
                if ($after) {
                    $after($request, $options, $response);
                }

                return $response;
```

`$before` と `$after` は、戻り値を使わずに呼ばれます。そのため、通信の結果そのものを変えることはできません。「見るだけ」の役割に限定しているので、安心して本番の通信に挟めます。

### 機密の値を、属性で守る

PHP の属性で「この値は秘密です」と宣言するのは、コードを読む人にも伝わる書き方です。機密を扱うコードの近くに置けば、どこに注意すべきかが一目でわかります。

## まとめ

- ミドルウェアは、外側で部品を作り、内側で処理を挟む 2 段構えで書ける。
- 「見るだけ」のフックは、結果を変えないことで安全に差し込める。
- 秘密の値は、属性で印を付けておくとログへの流出を防げる。
- 通信のような大切な処理は、前後の仕掛けを別の関数に分けると保守しやすい。
