---
title: 失敗した通信を、判定と待ち時間を決めて自動でやり直す
description: Guzzle の Middleware::retry は、通信が失敗したときに、もう一度送るかを判定し、待ち時間を決めて再試行します。判定の関数を受け取る形で、やり直しの方針を利用者が決められます。
language: php
project: Guzzle
repo: https://github.com/guzzle/guzzle
license: MIT
copyright: Copyright (c) 2011 Michael Dowling <mtdowling@gmail.com>
commit: "7d9b1f430bb65ac664e120af227bf9a795ad6333"
file: src/Middleware.php
lines: [236, 241]
function: Middleware::retry
difficulty: 2
format: 2
tags: [ネットワーク, エラー処理, 設計パターン]
---

## ひとことで

`Middleware::retry` は、HTTP 通信が一時的に失敗したとき（たとえばサーバーが混んでいるとき）に、**自動でもう一度送る** ミドルウェアを作ります。いつやり直すか、どれくらい待つかは、呼び出し側が関数で決められます。

## コード

```php:line-numbers=236
    public static function retry(callable $decider, ?callable $delay = null): callable
    {
        return static function (callable $handler) use ($decider, $delay): RetryMiddleware {
            return new RetryMiddleware($decider, $handler, $delay);
        };
    }
```

## 前提知識

- **再試行（リトライ）**: 失敗した処理を、時間をおいてもう一度やることです。
- **判定の関数（デサイダー）**: 「やり直すべきか」を true か false で答える関数です。
- **待ち時間（ディレイ）**: 次にやり直すまでの時間です。何度も失敗するほど長くするのが一般的です。
- **`callable`**: 関数として呼び出せるものを表す型です。無名関数も含みます。
- **`static function`**: `$this` を持たない無名関数です。

## 何をしているか

### 1. 判定と待ち時間の関数を受け取る

```php:line-numbers=236
    public static function retry(callable $decider, ?callable $delay = null): callable
    {
```

`retry` は、判定の関数 `$decider` と、待ち時間を決める関数 `$delay` を受け取ります。待ち時間は省略できます。ここでは通信の処理そのものは行わず、ミドルウェアを作る関数を返します。

### 2. 次の処理をつなぎ、再試行の部品を作る

```php:line-numbers=238
        return static function (callable $handler) use ($decider, $delay): RetryMiddleware {
            return new RetryMiddleware($decider, $handler, $delay);
        };
```

返される関数は、次の処理 `$handler` を受け取り、`RetryMiddleware` というオブジェクトを作ります。このオブジェクトが、通信の失敗を見て、判定の関数に聞き、必要なら待ってから送り直します。

具体的には、`$decider` が「500 番台のエラーなら再試行」と判定し、`$delay` が「1 回目は 1 秒、次は 2 秒」と答える、といった使い方ができます。

## ここがすごい

### 「何をどう再試行するか」を、利用者に渡している

再試行の方法は、アプリケーションによって大きく違います。Guzzle は、判定と待ち時間を関数として受け取ることで、再試行の仕組みそのものはライブラリに任せつつ、方針は利用者に任せています。`retry` は、その受け渡しの入口になる関数です。

### 作るだけで、通信しない

`retry` 自身は通信をしません。ミドルウェアの部品を作って返すだけです。実際に再試行が起きるのは、通信のスタックにこの部品が組み込まれたときです。作るときと使うときを分けておくと、設定を組み立てやすくなります。

### 静的な関数で、状態を持ち込まない

内側の関数は `static function` として作られています。`$this` に頼らないので、同じミドルウェアを複数の通信で安全に共有できます。

## まとめ

- 再試行は、判定と待ち時間を関数で渡すと、方針を変えやすくなる。
- ミドルウェアは、作る関数と使う関数を分けると、設定の組み立てが楽になる。
- 状態を持たない関数にすると、同じ部品を複数の場面で安全に使える。
- 失敗を再試行するかどうかは、失敗の種類で判断するのが基本。
