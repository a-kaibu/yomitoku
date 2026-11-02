---
title: ミドルウェアを処理の鎖の先頭に積む
description: Slim の addMiddleware は、ミドルウェアを次の処理と組み合わせたラッパーを作り、鎖の先頭に置きます。後から追加したものほど外側に来て、先に動くという仕組みを、わずか 20 行ほどで実現しています。
language: php
project: Slim
repo: https://github.com/slimphp/Slim
license: MIT
copyright: Copyright (c) 2011-2022 Josh Lockhart
commit: "3675bf6baac66b07032575b7bef4200b60b7974b"
file: Slim/MiddlewareDispatcher.php
lines: [113, 134]
function: addMiddleware
difficulty: 3
format: 2
tags: [設計パターン, イテレータ, API設計]
---
## ひとことで

`addMiddleware` は、ミドルウェア（リクエストを受け取り、前後で処理をはさめる部品）を 1 つ、処理の鎖に加える関数です。加えたミドルウェアは鎖の一番外側に置かれるので、リクエストが届いたとき、最後に追加したものから順に動きます。

## コード

```php:line-numbers=113
    public function addMiddleware(MiddlewareInterface $middleware): MiddlewareDispatcherInterface
    {
        $next = $this->tip;
        $this->tip = new class ($middleware, $next) implements RequestHandlerInterface {
            private MiddlewareInterface $middleware;

            private RequestHandlerInterface $next;

            public function __construct(MiddlewareInterface $middleware, RequestHandlerInterface $next)
            {
                $this->middleware = $middleware;
                $this->next = $next;
            }

            public function handle(ServerRequestInterface $request): ResponseInterface
            {
                return $this->middleware->process($request, $this->next);
            }
        };

        return $this;
    }
```

## 前提知識

- **ミドルウェア**: リクエストを受け取り、次の処理に渡して、返ってきたレスポンスを加工できる部品です。認証、ログ、エラー処理などを、本来の処理の前後に差し込むのに使われます。
- **`MiddlewareInterface` と `process`**: ミドルウェアが実装する型です。`process($request, $handler)` は、リクエストと「次の処理」を受け取り、レスポンスを返します。
- **`RequestHandlerInterface` と `handle`**: 「リクエストを渡すと、レスポンスが返る」処理の型です。鎖の中の各段は、この型として扱われます。
- **無名クラス**: `new class (...) { ... }` の形で、名前を付けずにその場で作るクラスです。ここでは、1 つのミドルウェアと次の処理を包む小さな部品として使われています。
- **鎖（チェーン）**: 処理を 1 つずつ次へ渡していく並びのことです。配列ではなく、「次の処理を覚えたラッパー」を重ねて作ります。

## 何をしているか

### 1. 今の先頭を控える

```php:line-numbers=115
        $next = $this->tip;
```

`$next = $this->tip;` で、今の鎖の先頭を `$next` に覚えておきます。これから作るラッパーにとって、この先頭が「次の処理」になります。

### 2. ミドルウェアと次の処理を包む

```php:line-numbers=116
        $this->tip = new class ($middleware, $next) implements RequestHandlerInterface {
            private MiddlewareInterface $middleware;

            private RequestHandlerInterface $next;

            public function __construct(MiddlewareInterface $middleware, RequestHandlerInterface $next)
            {
                $this->middleware = $middleware;
                $this->next = $next;
            }

            public function handle(ServerRequestInterface $request): ResponseInterface
            {
                return $this->middleware->process($request, $this->next);
            }
        };
```

次のコードでは、無名クラスのインスタンスを作って `$this->tip` に入れています。このクラスは、コンストラクタで受け取った `$middleware` と `$next` を保持します。そして `handle` が呼ばれると、`$this->middleware->process($request, $this->next)` を実行します。

つまり、このラッパーの `handle` は、ミドルウェアの `process` に「次の処理」を渡して、その結果を返しているだけです。ミドルウェアが `$handler->handle(...)` を呼べば、それが古い先頭のラッパーに届き、さらに内側へ進みます。

### 3. 自分自身を返す

```php:line-numbers=133
        return $this;
```

最後の `return $this;` で、アプリケーション自身を返します。これにより、`$app->addMiddleware($a)->addMiddleware($b)` のように、呼び出しを続けて書けます。

### 4. 呼び出し順

```php:line-numbers=127
            public function handle(ServerRequestInterface $request): ResponseInterface
            {
                return $this->middleware->process($request, $this->next);
            }
```

鎖の先頭は、最後に追加したラッパーです。リクエストは先頭の `handle` から入り、ミドルウェアの `process` の中で次のラッパーへ渡され、さらに内側へ進みます。したがって、後から追加したものが外側で先に動き、先に追加したものが内側で後に動きます。

## ここがすごい

- 鎖を配列で持たず、「次を覚えたラッパー」を重ねるだけで表しています。どのミドルウェアも、次の処理が何かを知る必要はなく、渡された `$handler` を呼べばよいだけです。
- 追加のたびに、先頭を新しいラッパーに置き換えるだけで済みます。配列の末尾に足して、後で順番を組み立て直すといった手間がありません。
- 無名クラスを使うことで、鎖の段を表す専用の型を、別ファイルを増やさずに書けています。
- `return $this;` によって、設定の書き方が読みやすくなっています。アプリの組み立てが、上から下へ並べた命令の列として読めます。

## まとめ

`addMiddleware` は、今の先頭を `$next` に控え、そこへ処理を渡すラッパーを作って、新しい先頭として置く関数です。鎖の仕組みを、配列も順番計算もなしに、1 つのラッパーの積み重ねで表しています。後から追加したミドルウェアが外側で先に動く、という Slim の呼び出し順は、この短いコードから直接読み取れます。
