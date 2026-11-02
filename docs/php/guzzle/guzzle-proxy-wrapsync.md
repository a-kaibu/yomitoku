---
title: 同期と非同期の通信を、オプションで振り分ける
description: Guzzle の Proxy::wrapSync は、オプションに応じて、非同期の処理と同期の処理を切り替える関数を作ります。通信のやり方を、呼び出す側の一行で選べるようにしています。
language: php
project: Guzzle
repo: https://github.com/guzzle/guzzle
license: MIT
copyright: Copyright (c) 2011 Michael Dowling <mtdowling@gmail.com>
commit: "7d9b1f430bb65ac664e120af227bf9a795ad6333"
file: src/Handler/Proxy.php
lines: [30, 40]
function: Proxy::wrapSync
difficulty: 2
format: 2
tags: [非同期, 設計パターン, API設計]
---

## ひとことで

`Proxy::wrapSync` は、HTTP 通信の処理を **同期（待って結果を受け取る）と非同期（あとで結果を受け取る）** で振り分ける関数です。オプションに `synchronous` が指定されたときだけ、同期の処理を使います。

## コード

```php:line-numbers=30
    public static function wrapSync(callable $default, callable $sync): callable
    {
        return static function (
            #[\SensitiveParameter]
            RequestInterface $request,
            #[\SensitiveParameter]
            array $options
        ) use ($default, $sync): PromiseInterface {
            return empty($options[RequestOptions::SYNCHRONOUS]) ? $default($request, $options) : $sync($request, $options);
        };
    }
```

## 前提知識

- **同期処理**: 結果が出るまで、次の行に進まずに待つ処理です。
- **非同期処理**: 結果を待たずに次に進み、結果は後で受け取る処理です。
- **ハンドラー**: 通信を実際に行う部品です。Guzzle では、複数のハンドラーを使い分けます。
- **`empty`**: 値が空（`null`、`false`、`0`、`""`、空の配列）かを調べる関数です。
- **三項演算子 `? :`**: 条件によって 2 つの値のどちらかを選ぶ書き方です。

## 何をしているか

### 1. 通常の処理と、同期の処理を受け取る

```php:line-numbers=30
    public static function wrapSync(callable $default, callable $sync): callable
    {
```

`wrapSync` は、既定のハンドラー `$default`（非同期）と、同期用のハンドラー `$sync` を受け取ります。ここでも、まだ通信は行いません。

### 2. リクエストごとに、どちらを使うか決める

```php:line-numbers=32
        return static function (
            #[\SensitiveParameter]
            RequestInterface $request,
            #[\SensitiveParameter]
            array $options
        ) use ($default, $sync): PromiseInterface {
            return empty($options[RequestOptions::SYNCHRONOUS]) ? $default($request, $options) : $sync($request, $options);
        };
```

返される関数は、リクエストとオプションを受け取ります。`$options[RequestOptions::SYNCHRONOUS]` が空でなければ、`$sync` を使います。空、つまり指定がなければ、`$default` を使います。

`empty` を使っているので、オプションの値が `true` だけでなく `1` のような値でも、同期として扱われます。

## ここがすごい

### 振り分けの判断を、1 か所に集めている

同期と非同期の切り替えは、通信の中のどこでも必要になりかねません。この関数は、「どちらを使うか」という判断を 1 つの三項演算子に集めています。読み手は、この 1 行を見るだけで仕組みを理解できます。

### 呼び出し側は、通信の種類を知らなくてよい

通信を依頼する側は、同期か非同期かを意識せず、同じ形で依頼できます。オプションの値だけで、動きを変えられるのがこの設計の良さです。

### 同じ形の関数を返す

どちらのハンドラーも、リクエストとオプションを受け取る同じ形の関数です。だから、振り分けの関数も同じ形で返せます。部品を重ねるための約束を守っているから、組み合わせが自然に動きます。

## まとめ

- 同期と非同期の切り替えは、判断の関数を 1 つ作ると分かりやすい。
- `empty` を使うと、オプションの値の形に多少ばらつきがあっても扱える。
- 呼び出し側が種類を気にしなくてよい形にすると、使い方が単純になる。
- 部品どうしは、同じ引数と戻り値の形にそろえると組み合わせやすい。
