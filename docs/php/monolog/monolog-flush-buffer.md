---
title: 溜めておいたログのうち、重要なものだけを書き出す
description: Monolog の FingersCrossedHandler の flushBuffer は、通常時に溜めておいたログを、基準のレベル以上のものだけに絞って、まとめて次のハンドラーへ渡します。問題が起きたときだけ、その前後の詳しい記録を残すための仕組みです。
language: php
project: Monolog
repo: https://github.com/Seldaek/monolog
license: MIT
copyright: Copyright (c) 2011-2020 Jordi Boggiano
commit: "3bed304b1905fed5c30d172872f4d890cbb03c6a"
file: src/Monolog/Handler/FingersCrossedHandler.php
lines: [181, 195]
function: flushBuffer
difficulty: 3
format: 2
tags: [ログ, 遅延評価, イテレータ]
---
## ひとことで

`flushBuffer` は、ログを一時的に溜めておいた場所（バッファ）を空にする関数です。溜めたログのうち、設定された「通過させるレベル」以上のものだけを残し、次のハンドラーへまとめて渡します。そのあと、バッファを空にして、再び溜め始める状態に戻します。

## コード

```php:line-numbers=181
    private function flushBuffer(): void
    {
        if (null !== $this->passthruLevel) {
            $passthruLevel = $this->passthruLevel;
            $this->buffer = array_filter($this->buffer, static function ($record) use ($passthruLevel) {
                return $passthruLevel->includes($record->level);
            });
            if (\count($this->buffer) > 0) {
                $this->getHandler(end($this->buffer))->handleBatch($this->buffer);
            }
        }

        $this->buffer = [];
        $this->buffering = true;
    }
```

## 前提知識

- **FingersCrossedHandler**: 普段は、ログを書かずにバッファに溜めておき、深刻なエラーが出たときに、溜めたログをまとめて書き出すハンドラーです。英語の fingers crossed は「うまくいきますように」という意味で、何も起きなければ溜めたまま捨てられる、という姿に合わせた名前です。
- **ログのレベル**: DEBUG、INFO、WARNING、ERROR など、重要さの段階です。数が大きいほど、深刻です。
- **`array_filter`**: 配列の要素を、条件に合うものだけに絞り込む関数です。無名関数で条件を書きます。
- **`use` による外側の変数の取り込み**: 無名関数の中で、外側にある変数の値を使うための書き方です。
- **`handleBatch`**: まとめたログを、次のハンドラーに一度に渡すメソッドです。

## 何をしているか

### 1. 通過させるレベルが決まっているか確かめる

```php:line-numbers=183
        if (null !== $this->passthruLevel) {
            $passthruLevel = $this->passthruLevel;
```

`passthruLevel` が設定されていれば、そのレベルを一時変数に入れます。無名関数の中で使うために、ここで取り出しておきます。未設定なら、絞り込みもまとめての書き出しも行いません。

### 2. 基準以上のログだけを残す

```php:line-numbers=185
            $this->buffer = array_filter($this->buffer, static function ($record) use ($passthruLevel) {
                return $passthruLevel->includes($record->level);
            });
```

`array_filter` で、バッファの各ログのレベルを確かめます。`includes` は、そのレベルが基準以上かを返します。条件を満たさないログは、バッファから取り除かれます。

### 3. 残ったものを、次のハンドラーへまとめて渡す

```php:line-numbers=188
            if (\count($this->buffer) > 0) {
                $this->getHandler(end($this->buffer))->handleBatch($this->buffer);
            }
```

残ったログが 1 件でもあれば、`getHandler` で次のハンドラーを得て、`handleBatch` で一度に渡します。`end` で最後のログを取り出して、どのハンドラーに渡すかを決めています。

### 4. バッファを空にして、溜め直す状態に戻す

```php:line-numbers=193
        $this->buffer = [];
        $this->buffering = true;
```

バッファを空の配列にし、`buffering` を `true` にします。次のログは、また溜められます。

## ここがすごい

- 溜めたログを、レベルで絞ってから渡すので、通過させる基準より低いログは、書き出されずに捨てられます。ディスクに余計なものを残しません。
- `handleBatch` で一度に渡すので、ハンドラーの書き込みの回数が減ります。ネットワークへの送信などでは、この効果が大きくなります。
- バッファを空にする処理を最後に置いて、次の溜め始めの準備を確実に行っています。どの経路でも、状態が正しく戻ります。
- 無名関数に `use` で値を渡す形にしていて、関数の外の変数に直接触れないようにしています。処理の範囲が、読んで分かりやすくなっています。

## まとめ

`flushBuffer` は、溜めたログを基準のレベルで絞り、残りを次のハンドラーへまとめて渡して、バッファを空に戻す関数です。普段は静かで、問題が起きたときだけ詳しく残す仕組みの、要となる部分です。絞り込み、書き出し、初期化の 3 段階が、短いコードで読み取れます。
