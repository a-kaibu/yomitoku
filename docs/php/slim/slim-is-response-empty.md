---
title: レスポンスの本文が空かを、全部読まずに確かめる
description: Slim の ResponseEmitter の isResponseEmpty は、レスポンスの状態コードと本文を調べて、送るべき中身がないかを判定します。本文を戻せる場合は 1 バイトだけ読み、読み取り位置を戻すので、大きな本文でも速く判断できます。
language: php
project: Slim
repo: https://github.com/slimphp/Slim
license: MIT
copyright: Copyright (c) 2011-2022 Josh Lockhart
commit: "3675bf6baac66b07032575b7bef4200b60b7974b"
file: Slim/ResponseEmitter.php
lines: [124, 135]
function: isResponseEmpty
difficulty: 2
format: 2
tags: [ネットワーク, 入出力, 最適化]
---
## ひとことで

`isResponseEmpty` は、HTTP レスポンスに本文を付けて送るべきかを判断する関数です。204、205、304 のような状態コードは、本文を持たないと決まっています。それ以外は、本文のストリームを見て、中身が空かを確かめます。本文全体を読まずに判断できるように作られています。

## コード

```php:line-numbers=124
    public function isResponseEmpty(ResponseInterface $response): bool
    {
        if (in_array($response->getStatusCode(), [204, 205, 304], true)) {
            return true;
        }
        $stream = $response->getBody();
        $seekable = $stream->isSeekable();
        if ($seekable) {
            $stream->rewind();
        }
        return $seekable ? $stream->read(1) === '' : $stream->eof();
    }
```

## 前提知識

- **状態コード**: レスポンスの結果を表す 3 桁の数字です。204（No Content）や 304（Not Modified）は、本文を付けないと決められています。
- **ストリーム**: データを先頭から順に読み書きする仕組みです。PSR-7 では、レスポンスの本文もストリームとして扱われます。
- **シーク可能（seekable）**: ストリームの読み取り位置を、戻したり飛ばしたりできる性質です。ファイルやメモリ上のストリームは、多くの場合シーク可能です。
- **`rewind`**: 読み取り位置を、ストリームの先頭に戻すメソッドです。
- **`eof`**: 読み取りが終わったかを調べるメソッドです。シーク不可能なストリームでは、こちらで判断します。

## 何をしているか

### 1. 本文を持たない状態コードを先に判定する

```php:line-numbers=126
        if (in_array($response->getStatusCode(), [204, 205, 304], true)) {
            return true;
        }
```

`in_array` で、状態コードが 204、205、304 のどれかかを調べます。当てはまれば、本文を見るまでもなく `true` を返します。

### 2. 本文が戻せるかを調べる

```php:line-numbers=129
        $stream = $response->getBody();
        $seekable = $stream->isSeekable();
        if ($seekable) {
            $stream->rewind();
        }
```

本文のストリームを取り出し、シーク可能かを調べます。シーク可能なら、`rewind` で先頭に戻します。前の処理で本文が読まれていても、ここから確かめ直せます。

### 3. 1 バイトだけ読んで判断する

```php:line-numbers=134
        return $seekable ? $stream->read(1) === '' : $stream->eof();
```

シーク可能なときは、`read(1)` で最初の 1 バイトだけを読み、それが空文字かを見ます。空なら本文は空です。シーク不可能なときは、`eof` で判断します。どちらの場合も、本文全体を読み切る必要はありません。

## ここがすごい

- 本文が空かを、最初の 1 バイトだけで判断しています。大きなファイルを送るときでも、判定のための読み取りは最小で済みます。
- シーク可能かどうかで、確かめ方を分けています。戻せるストリームでは読み直しができ、戻せないストリームでは `eof` で状態だけを見る、という使い分けです。
- 状態コードによる判定を先に行うので、本文に触れる必要がないときは、ストリームを読まずに終わります。
- 1 行の三項演算子で、2 つの確かめ方を切り替えています。短いコードですが、ストリームの性質の違いを正しく扱っています。

## まとめ

`isResponseEmpty` は、状態コードと本文のストリームを調べて、レスポンスに中身があるかを判定する関数です。全部を読まず、最初の 1 バイトか `eof` で判断します。HTTP の決まりと、ストリームの性質を組み合わせて、無駄のない判断をしている点が、この関数の読みどころです。
