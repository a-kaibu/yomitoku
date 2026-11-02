---
title: "ルートを HTTP メソッドごとに、大きさの合った束に分ける"
description: "FastRoute は、プレースホルダーのあるルートを HTTP メソッドごとに分け、さらに大きな正規表現の束（チャンク）に分けます。PCRE の制限を超えないように、束の大きさを計算しているのが見どころです。"
language: php
project: FastRoute
repo: https://github.com/nikic/FastRoute
license: BSD-3-Clause
copyright: Copyright (c) 2013 by Nikita Popov.
commit: "1c961398bef1ff6ecd8b273bef651d7afe90312b"
file: src/DataGenerator/RegexBasedAbstract.php
lines: [68, 88]
function: RegexBasedAbstract::generateVariableRouteData
difficulty: 3
format: 2
tags: [正規表現, データ構造, 最適化]
---

## ひとことで

`generateVariableRouteData` は、プレースホルダーを含むルートを、**HTTP メソッド（GET や POST）ごと** に分けて、さらに **正規表現の束（チャンク）** に分ける関数です。ルートが何百あっても、高速に照合できるように準備します。

## コード

::: code-group

```php:line-numbers=68 [日本語訳]
    private function generateVariableRouteData(): array
    {
        $data = [];
        foreach ($this->methodToRegexToRoutesMap as $method => $regexToRoutesMap) {
            $chunkSize = $this->computeChunkSize(count($regexToRoutesMap));
            $chunks = array_chunk($regexToRoutesMap, $chunkSize, true);
            $data[$method] = array_map([$this, 'processChunk'], $chunks);
        }

        return $data;
    }

    /** @return 正の整数 */
    private function computeChunkSize(int $count): int
    {
        $numParts = max(1, round($count / $this->getApproxChunkSize()));
        $size = (int) ceil($count / $numParts);
        assert($size > 0);

        return $size;
    }
```

```php:line-numbers=68 [原文]
    private function generateVariableRouteData(): array
    {
        $data = [];
        foreach ($this->methodToRegexToRoutesMap as $method => $regexToRoutesMap) {
            $chunkSize = $this->computeChunkSize(count($regexToRoutesMap));
            $chunks = array_chunk($regexToRoutesMap, $chunkSize, true);
            $data[$method] = array_map([$this, 'processChunk'], $chunks);
        }

        return $data;
    }

    /** @return positive-int */
    private function computeChunkSize(int $count): int
    {
        $numParts = max(1, round($count / $this->getApproxChunkSize()));
        $size = (int) ceil($count / $numParts);
        assert($size > 0);

        return $size;
    }
```

:::

## 前提知識

- **HTTP メソッド**: GET（取得）、POST（送信）などの、リクエストの種類です。同じ URL でも、メソッドが違えば別の処理になります。
- **正規表現の束**: 複数のルートを `|` でつないで、1 つの正規表現にしたものです。一度の照合で、いくつものルートを試せます。
- **PCRE**: PHP が使う正規表現のエンジンです。1 つの正規表現の大きさや括弧の数には、上限があります。
- **`array_chunk`**: 配列を指定した個数ごとに分ける PHP の関数です。
- **`array_map`**: 配列の各要素に関数をかける PHP の関数です。

## 何をしているか

### 1. HTTP メソッドごとに、処理を回す

```php:line-numbers=70
        $data = [];
        foreach ($this->methodToRegexToRoutesMap as $method => $regexToRoutesMap) {
```

`$this->methodToRegexToRoutesMap` は、「メソッド → 正規表現 → ルートの一覧」の形になっています。メソッドごとに、正規表現の一覧を取り出します。

### 2. 束の大きさを決めて、分ける

```php:line-numbers=72
            $chunkSize = $this->computeChunkSize(count($regexToRoutesMap));
            $chunks = array_chunk($regexToRoutesMap, $chunkSize, true);
```

`computeChunkSize` で、束 1 つあたりの大きさを決めます。そして `array_chunk` で、正規表現の一覧をその大きさの束に分けます。キーを残すため、3 つ目の引数に `true` を渡しています。

### 3. 束ごとに、照合のための形に変える

```php:line-numbers=74
            $data[$method] = array_map([$this, 'processChunk'], $chunks);
        }

        return $data;
```

`array_map([$this, 'processChunk'], $chunks)` で、束のそれぞれを `processChunk` に渡します。`processChunk` は、束を 1 つの大きな正規表現にまとめる処理です。その結果を、メソッドごとの配列に入れて返します。

### 4. 束の大きさの計算

```php:line-numbers=81
    private function computeChunkSize(int $count): int
    {
        $numParts = max(1, round($count / $this->getApproxChunkSize()));
        $size = (int) ceil($count / $numParts);
        assert($size > 0);

        return $size;
    }
```

`computeChunkSize` は、正規表現の数を「目標の束の数」で割って、1 束の大きさを決めます。束が最低 1 つになるように `max(1, ...)` で守っています。

## ここがすごい

### 正規表現を、メソッドで先に分ける

同じ URL でも、メソッドが違えば処理が違います。メソッドごとに分けてから照合すれば、照合の対象になるルートの数を減らせます。「まず絞り込み、そのあと照合する」という順番を、データの作り方で実現しています。

### 大きな正規表現を、束に分けて守る

1 つの正規表現に何百ものルートを入れると、PCRE の上限に当たることがあります。束の大きさを計算して分けておけば、どれだけルートが増えても、上限を超えずに済みます。大きさを決める式が `computeChunkSize` に 1 つにまとまっているのも、読みやすい設計です。

### 「空でない」を保証する

```php:line-numbers=83
        $numParts = max(1, round($count / $this->getApproxChunkSize()));
        $size = (int) ceil($count / $numParts);
        assert($size > 0);
```

束の数は最低 1 なので、ルートが 1 つもなくても割り算でエラーになりません。小さな守りが、大きな設定の変化に強い仕組みを支えています。

## まとめ

- 照合を速くするには、まず条件（HTTP メソッド）で絞ってから正規表現を使う。
- 大きな正規表現は、上限を超えないように束に分けると安全。
- 束の大きさは式 1 つにまとめると、調整がしやすい。
- 割る数が 0 になる場合を防ぐと、ルートが少ない場合も壊れない。
