---
title: 複数のキャッシュから、最初に得られた更新時刻を返す
description: Twig の ChainCache の getTimestamp は、登録された順にキャッシュへ更新時刻を問い合わせ、0 より大きい値が返った時点で返します。どのキャッシュにも無ければ 0 を返して、テンプレートを作り直すべきだと知らせます。
language: php
project: Twig
repo: https://github.com/twigphp/Twig
license: BSD-3-Clause
copyright: Copyright (c) 2009-present by the Twig Team.
commit: "beb4b229784425ceb6514cec9c573b3e42b30703"
file: src/Cache/ChainCache.php
lines: [59, 70]
function: getTimestamp
difficulty: 2
format: 2
tags: [キャッシュ, 日時, 設計パターン]
---
## ひとことで

`getTimestamp` は、コンパイル済みテンプレートのキャッシュが、いつ作られたかを表す時刻を返す関数です。複数のキャッシュを順番に問い合わせ、最初に正の時刻が得られたところで返します。どのキャッシュにも無ければ `0` を返し、Twig に「作り直してよい」と伝えます。

## コード

```php:line-numbers=59
    public function getTimestamp(string $key): int
    {
        $splitKey = $this->splitKey($key);

        foreach ($this->caches as $cache) {
            if (0 < $timestamp = $cache->getTimestamp($cache->generateKey(...$splitKey))) {
                return $timestamp;
            }
        }

        return 0;
    }
```

## 前提知識

- **更新時刻（タイムスタンプ）**: ファイルや保存物が作られた、または最後に変わった時刻を、秒の数で表したものです。
- **鮮度の判定**: キャッシュの時刻がテンプレートの更新時刻より新しければ、キャッシュをそのまま使えます。古ければ作り直します。
- **`0 <` と代入**: PHP では `0 < $timestamp = ...` のように、比較の中で代入ができます。右の式の結果を `$timestamp` に入れてから、`0` と比べています。
- **`splitKey` と `generateKey`**: キーとクラス名、テンプレート名を相互に変換する、前の関数で見たものと同じ仕組みです。ここでは、可変長の引数 `...` で、分けた値をそのまま渡しています。
- **連鎖（チェーン）キャッシュ**: 複数のキャッシュを並べて、順に試す設計です。`load` と同じ形で、時刻の問い合わせにも使われています。

## 何をしているか

### 1. キーを分けて、名前とクラス名を得る

```php:line-numbers=61
        $splitKey = $this->splitKey($key);
```

`splitKey` で、受け取ったキーを、名前とクラス名の組に分けます。この組は、各キャッシュの `generateKey` に、そのまま渡されます。

### 2. 各キャッシュに時刻を問い合わせる

```php:line-numbers=63
        foreach ($this->caches as $cache) {
            if (0 < $timestamp = $cache->getTimestamp($cache->generateKey(...$splitKey))) {
```

`foreach` で、登録されたキャッシュを順に見ます。`$cache->getTimestamp(...)` が返した時刻を、代入しながら `0` と比べます。

### 3. 正の時刻が得られたら返す

```php:line-numbers=65
                return $timestamp;
            }
```

時刻が `0` より大きければ、その時刻を返します。最初に見つかったキャッシュの時刻を、そのまま使えます。

### 4. どこにも無ければ 0

```php:line-numbers=69
        return 0;
```

すべてのキャッシュが `0` を返したときは、`0` を返します。これは「キャッシュが無い」ことを表す約束の値です。

## ここがすごい

- 比較と代入を 1 行にまとめて、時刻の取り出しと判定を同時に行っています。`if` の中で値を使えるので、一時変数を増やさずに済みます。
- 最初に見つかった正の時刻を採用する、という決まりが一つだけなので、読む人は迷いません。複数のキャッシュがあっても、結果の意味は同じです。
- 「無い」を `null` や例外ではなく `0` で表しています。`0` は、時刻としては有り得ない値なので、判定の基準にしやすい作りです。
- キーの分解と組み立てを、前の関数と同じ部品で行っています。キャッシュの名前付けが、どのメソッドでも一貫しています。

## まとめ

`getTimestamp` は、複数のキャッシュの中から、最初に得られた正の更新時刻を返す関数です。見つからなければ `0` で知らせます。連鎖したキャッシュの仕組みを、時刻の問い合わせにも広げ、短い反復と戻り値の決まりで表しています。
