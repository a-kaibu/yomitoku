---
title: 大量のリクエストを同時に送り、結果を順番どおりに並べる
description: Guzzle の Pool::batch は、たくさんの HTTP リクエストを並行して送り、成功と失敗の結果を元の順番どおりに返します。送信の完了を待ってから、キーでソートして返します。
language: php
project: Guzzle
repo: https://github.com/guzzle/guzzle
license: MIT
copyright: Copyright (c) 2011 Michael Dowling <mtdowling@gmail.com>
commit: "7d9b1f430bb65ac664e120af227bf9a795ad6333"
file: src/Pool.php
lines: [268, 282]
function: Pool::batch
difficulty: 3
format: 2
tags: [並行処理, 非同期, ネットワーク]
---

## ひとことで

`Pool::batch` は、たくさんの HTTP リクエストを **まとめて送って** 結果を返す関数です。1 件ずつ待つより、同時に送る分だけ速く終わります。結果は、リクエストを渡した順番と同じ並びで受け取れます。

## コード

```php:line-numbers=268
    public static function batch(
        ClientInterface $client,
        iterable $requests,
        #[\SensitiveParameter]
        array $options = []
    ): array {
        $res = [];
        self::cmpCallback($options, 'fulfilled', $res);
        self::cmpCallback($options, 'rejected', $res);
        $pool = new static($client, $requests, $options);
        $pool->promise()->wait();
        \ksort($res);

        return $res;
    }
```

## 前提知識

- **並行処理（並列）**: 複数の処理を、同じ時間帯に進めることです。HTTP 通信では、返事を待つ間に別の通信を送れます。
- **プロミス（Promise）**: 「あとで結果が届く」ことを表すオブジェクトです。`wait()` を呼ぶと、結果が出るまで待ちます。
- **`ksort`**: 配列をキー（添字）の順に並べ替える PHP の関数です。
- **`new static`**: 呼び出されたクラス自身のインスタンスを作る書き方です。継承したクラスでも正しく動きます。
- **`iterable`**: 配列や反復可能なオブジェクトをまとめて表す型です。

## 何をしているか

### 1. 成功と失敗の受け皿を用意する

```php:line-numbers=274
        $res = [];
        self::cmpCallback($options, 'fulfilled', $res);
        self::cmpCallback($options, 'rejected', $res);
```

結果を入れる配列 `$res` を用意し、成功（`fulfilled`）と失敗（`rejected`）のそれぞれについて、結果を `$res` に入れる仕掛けを付けます。仕掛けの中身は補助関数 `cmpCallback` が担当しています。

### 2. プールを作って、送り終わるまで待つ

```php:line-numbers=277
        $pool = new static($client, $requests, $options);
        $pool->promise()->wait();
```

`new static($client, $requests, $options)` で、同時に送るリクエストの管理役（プール）を作ります。`promise()->wait()` で、すべてのリクエストが終わるまで待ちます。

### 3. 元の順番に並べて返す

```php:line-numbers=279
        \ksort($res);

        return $res;
```

結果は完了した順に入るので、`ksort($res)` で、リクエストの添字（0, 1, 2, ...）の順に並べ直します。その後で返します。

具体例として、100 件のリクエストを送ると、先に返ってきたものが先に `$res` に入りますが、戻り値は 0 番から 99 番の順になります。

## ここがすごい

### 送る順番と、受け取る順番を分けている

並行処理では、返事の順番は送った順番と一致しません。この関数は、結果を「リクエストの番号」を添字にして入れ、最後にまとめて並べ替えます。返事の順番に振り回されずに、呼び出し側は素直な配列を受け取れます。

### 待つのは最後だけ

```php:line-numbers=278
        $pool->promise()->wait();
```

プールが作られたあとの `wait()` 1 回で、全体の完了を待ちます。途中で 1 件ずつ止めて待たないので、通信が重なって速く進みます。

### 成功と失敗を、同じ仕組みで集める

成功と失敗を別々の仕掛けで受け取り、同じ `$res` に入れています。呼び出し側は、どちらだったかを添字の中の値で判断できます。エラーでも処理が止まらず、全部の結果を見られるのが利点です。

## まとめ

- 並行処理の結果は、番号を添字にして集めると、後から元の順番に戻せる。
- 完了を待つのは最後にまとめて行うと、通信が重なって速くなる。
- 成功と失敗を同じ配列に集めると、途中で止まらずに全部の結果が得られる。
- 呼び出されたクラスの型を使う `new static` で、継承にも対応できる。
