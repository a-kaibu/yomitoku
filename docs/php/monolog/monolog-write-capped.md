---
title: Redis のリストに、件数の上限を守ってログを追加する
description: Monolog の RedisHandler の writeCapped は、ログを Redis のリストの末尾に追加し、同時に古いものを切り落として件数の上限を守ります。二つの Redis のクライアントの違いを吸収して、同じ手順で書き込みます。
language: php
project: Monolog
repo: https://github.com/Seldaek/monolog
license: MIT
copyright: Copyright (c) 2011-2020 Jordi Boggiano
commit: "3bed304b1905fed5c30d172872f4d890cbb03c6a"
file: src/Monolog/Handler/RedisHandler.php
lines: [69, 85]
function: writeCapped
difficulty: 3
format: 2
tags: [キャッシュ, 並行処理, 防御的プログラミング]
---
## ひとことで

`writeCapped` は、ログを Redis のリストに追加しながら、リストの長さを一定以内に保つ関数です。新しいログを末尾に入れ、`ltrim` で古いものを先頭から切り落とします。ログが無限に増えて、メモリを使い尽くすことを防ぎます。

## コード

```php:line-numbers=69
    protected function writeCapped(LogRecord $record): void
    {
        if ($this->redisClient instanceof Redis) {
            $mode = \defined('Redis::MULTI') ? Redis::MULTI : 1;
            $this->redisClient->multi($mode)
                ->rPush($this->redisKey, $record->formatted)
                ->ltrim($this->redisKey, -$this->capSize, -1)
                ->exec();
        } else {
            $redisKey = $this->redisKey;
            $capSize = $this->capSize;
            $this->redisClient->transaction(function ($tx) use ($record, $redisKey, $capSize) {
                $tx->rpush($redisKey, $record->formatted);
                $tx->ltrim($redisKey, -$capSize, -1);
            });
        }
    }
```

## 前提知識

- **Redis のリスト**: 値を順番に並べて持つデータ型です。`rPush` は末尾に追加し、`lTrim` は指定した範囲の外を削除します。
- **件数の上限（キャップ）**: 保存するログを最新の何件までに限るかの決まりです。上限を超えた古い分は、自動的に捨てられます。
- **トランザクション**: 複数の操作を、まとめて一度に実行する仕組みです。途中の状態が他から見えないので、追加と切り落としが必ず組になります。
- **`ltrim` の負の添字**: `-$capSize` から `-1` までを残す指定です。負の添字は末尾からの位置で、`-1` が最後の要素を表します。
- **クライアントの違い**: PHP の Redis の拡張（`Redis` クラス）と、ライブラリのクライアントでは、メソッドの呼び方が違います。

## 何をしているか

### 1. 拡張のクライアントなら、まとめて実行する

```php:line-numbers=71
        if ($this->redisClient instanceof Redis) {
            $mode = \defined('Redis::MULTI') ? Redis::MULTI : 1;
            $this->redisClient->multi($mode)
                ->rPush($this->redisKey, $record->formatted)
                ->ltrim($this->redisKey, -$this->capSize, -1)
                ->exec();
```

クライアントが `Redis` クラスのインスタンスなら、`multi` でトランザクションを始めます。`rPush` で末尾に追加し、`ltrim` で上限より古い分を消し、`exec` でまとめて実行します。`defined` で、定数 `Redis::MULTI` の有無を確かめ、無ければ数値の `1` を使います。

### 2. ライブラリのクライアントなら、クロージャで書く

```php:line-numbers=77
        } else {
            $redisKey = $this->redisKey;
            $capSize = $this->capSize;
            $this->redisClient->transaction(function ($tx) use ($record, $redisKey, $capSize) {
                $tx->rpush($redisKey, $record->formatted);
                $tx->ltrim($redisKey, -$capSize, -1);
            });
```

それ以外のクライアントでは、`transaction` にクロージャを渡します。クロージャの中で、`rpush` と `ltrim` を順に呼びます。外側の変数は、`use` で取り込んでから渡しています。

## ここがすごい

- 追加と切り落としを、必ず同じトランザクションで行います。片方だけが実行されて、リストが上限を超え続けるような事態を防ぎます。
- 負の添字を使うことで、リストの長さを数えずに、末尾から上限分だけを残せます。毎回の書き込みで、長さを計算する必要がありません。
- 2 種類のクライアントの違いを、`if` で分けて吸収しています。呼び出し側は、どちらのクライアントを使っていても、同じ `writeCapped` を呼べます。
- クロージャに渡す変数を `use` で明示しているので、関数の外の状態に依存しすぎない書き方になっています。

## まとめ

`writeCapped` は、Redis のリストへログを追加し、上限を超えた古いものを切り落とす関数です。トランザクションで二つの操作を組にし、負の添字で末尾から上限を指定します。ログの保存先に上限を設けて、メモリの使いすぎを防ぐ、実用的な工夫です。
