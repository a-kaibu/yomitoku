---
title: "リダイレクトを追うかどうかを、オプションで決める"
description: "Guzzle の RedirectMiddleware::__invoke は、allow_redirects の指定を読み、リダイレクトを追う必要があるかを決めてから次の処理を呼びます。"
language: php
project: Guzzle
repo: https://github.com/guzzle/guzzle
license: MIT
copyright: Copyright (c) 2011 Michael Dowling <mtdowling@gmail.com>
commit: "7d9b1f430bb65ac664e120af227bf9a795ad6333"
file: src/RedirectMiddleware.php
lines: [63, 95]
function: RedirectMiddleware::__invoke
difficulty: 2
format: 2
tags: [設計パターン, 非同期]
---

## ひとことで

HTTP のリクエストに対して、サーバーが「別の URL へ移動してください」と返すことがあります。この関数は、そのリダイレクトを追うかどうかを、リクエストのオプションで決める部分です。

## コード

::: code-group

```php:line-numbers=63 [日本語訳]
    public function __invoke(
        #[\SensitiveParameter]
        RequestInterface $request,
        #[\SensitiveParameter]
        array $options
    ): PromiseInterface {
        $fn = $this->nextHandler;

        if (empty($options['allow_redirects'])) {
            return $fn($request, $options);
        }

        if ($options['allow_redirects'] === true) {
            $options['allow_redirects'] = self::DEFAULT_SETTINGS;
        } elseif (!\is_array($options['allow_redirects'])) {
            throw new InvalidArgumentException('allow_redirects must be true, false, or array');
        } else {
            // 既定の設定と、指定された設定をまとめる。
            $options['allow_redirects'] += self::DEFAULT_SETTINGS;
        }

        if (empty($options['allow_redirects']['max'])) {
            return $fn($request, $options);
        }

        return $fn($request, $options)
            ->then(function (
                #[\SensitiveParameter]
                ResponseInterface $response
            ) use ($request, $options) {
                return $this->checkRedirect($request, $options, $response);
            });
    }
```

```php:line-numbers=63 [原文]
    public function __invoke(
        #[\SensitiveParameter]
        RequestInterface $request,
        #[\SensitiveParameter]
        array $options
    ): PromiseInterface {
        $fn = $this->nextHandler;

        if (empty($options['allow_redirects'])) {
            return $fn($request, $options);
        }

        if ($options['allow_redirects'] === true) {
            $options['allow_redirects'] = self::DEFAULT_SETTINGS;
        } elseif (!\is_array($options['allow_redirects'])) {
            throw new InvalidArgumentException('allow_redirects must be true, false, or array');
        } else {
            // Merge the default settings with the provided settings
            $options['allow_redirects'] += self::DEFAULT_SETTINGS;
        }

        if (empty($options['allow_redirects']['max'])) {
            return $fn($request, $options);
        }

        return $fn($request, $options)
            ->then(function (
                #[\SensitiveParameter]
                ResponseInterface $response
            ) use ($request, $options) {
                return $this->checkRedirect($request, $options, $response);
            });
    }
```

:::

## 前提知識

- **リダイレクト**: サーバーが「この URL ではなく、別の URL を見てください」と返す仕組みです。
- **ミドルウェア**: リクエストを送る前後に割り込んで、処理を足す仕組みです。Guzzle では、関数を次々とつなげて組み立てます。
- **Promise（約束）**: 結果が後で届くことを表す入れ物です。`->then()` で、届いたときの処理を予約します。
- **`+=` と配列**: 配列どうしを `+=` でつなぐと、左側にないキーだけ右側の値が追加されます。

## 何をしているか

### 1. 次の処理を取り出し、リダイレクトを追わないなら、そのまま渡す

```php:line-numbers=69
        $fn = $this->nextHandler;

        if (empty($options['allow_redirects'])) {
            return $fn($request, $options);
        }
```

`$this->nextHandler` は、次に処理する関数です。`allow_redirects` が空なら、何もせずに次の関数へ渡します。

### 2. 指定の形を整える

::: code-group

```php:line-numbers=75 [日本語訳]
        if ($options['allow_redirects'] === true) {
            $options['allow_redirects'] = self::DEFAULT_SETTINGS;
        } elseif (!\is_array($options['allow_redirects'])) {
            throw new InvalidArgumentException('allow_redirects must be true, false, or array');
        } else {
            // 既定の設定と、指定された設定をまとめる。
            $options['allow_redirects'] += self::DEFAULT_SETTINGS;
        }
```

```php:line-numbers=75 [原文]
        if ($options['allow_redirects'] === true) {
            $options['allow_redirects'] = self::DEFAULT_SETTINGS;
        } elseif (!\is_array($options['allow_redirects'])) {
            throw new InvalidArgumentException('allow_redirects must be true, false, or array');
        } else {
            // Merge the default settings with the provided settings
            $options['allow_redirects'] += self::DEFAULT_SETTINGS;
        }
```

:::

`true` なら既定の設定を使います。配列なら、既定の設定とまとめます。`true` でも配列でもない値は、例外を投げて止まります。

### 3. 最大回数が 0 なら、追わずに渡す

```php:line-numbers=84
        if (empty($options['allow_redirects']['max'])) {
            return $fn($request, $options);
        }
```

`max` が空なら、リダイレクトを追わずに次へ渡します。

### 4. 応答が届いたら、リダイレクトを確かめる

```php:line-numbers=88
        return $fn($request, $options)
            ->then(function (
                #[\SensitiveParameter]
                ResponseInterface $response
            ) use ($request, $options) {
                return $this->checkRedirect($request, $options, $response);
            });
```

次の関数の結果（Promise）に `->then()` で処理を予約します。応答が届いたら、`checkRedirect` が本当に移動すべきかを判断します。

## ここがすごい

### 「後で」処理するための予約

```php:line-numbers=88
        return $fn($request, $options)
            ->then(function (
                #[\SensitiveParameter]
                ResponseInterface $response
            ) use ($request, $options) {
                return $this->checkRedirect($request, $options, $response);
            });
```

Guzzle は通信の結果をすぐには返しません。`->then()` で「届いたら、この関数で処理する」と予約しておきます。通信が終わるまで待たずに、次の処理を組み立てられる仕組みです。

### 指定の種類を、先に分けて判断する

::: code-group

```php:line-numbers=75 [日本語訳]
        if ($options['allow_redirects'] === true) {
            $options['allow_redirects'] = self::DEFAULT_SETTINGS;
        } elseif (!\is_array($options['allow_redirects'])) {
            throw new InvalidArgumentException('allow_redirects must be true, false, or array');
        } else {
            // 既定の設定と、指定された設定をまとめる。
            $options['allow_redirects'] += self::DEFAULT_SETTINGS;
        }
```

```php:line-numbers=75 [原文]
        if ($options['allow_redirects'] === true) {
            $options['allow_redirects'] = self::DEFAULT_SETTINGS;
        } elseif (!\is_array($options['allow_redirects'])) {
            throw new InvalidArgumentException('allow_redirects must be true, false, or array');
        } else {
            // Merge the default settings with the provided settings
            $options['allow_redirects'] += self::DEFAULT_SETTINGS;
        }
```

:::

`true`、配列、それ以外、の 3 つを、if と elseif で順に分けています。不正な指定は、通信をする前に例外で知らせています。

## まとめ

この関数は、`allow_redirects` という 1 つのオプションを読んで、リダイレクトを追うかどうかを先に決めます。追う場合だけ、応答を待ってから確かめる予約を入れる、という構成になっています。
