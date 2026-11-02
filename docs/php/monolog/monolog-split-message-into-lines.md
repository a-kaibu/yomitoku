---
title: 複数行のログを、行ごとに分ける
description: Monolog の SyslogUdpHandler の splitMessageIntoLines は、改行を含むログのメッセージを、行ごとの配列に分けます。配列で届いたメッセージは、まず改行でつないでから分けるので、どちらの形でも同じように扱えます。
language: php
project: Monolog
repo: https://github.com/Seldaek/monolog
license: MIT
copyright: Copyright (c) 2011-2020 Jordi Boggiano
commit: "3bed304b1905fed5c30d172872f4d890cbb03c6a"
file: src/Monolog/Handler/SyslogUdpHandler.php
lines: [94, 108]
function: splitMessageIntoLines
difficulty: 2
format: 2
tags: [パース, 文字列処理, ネットワーク]
---
## ひとことで

`splitMessageIntoLines` は、ログのメッセージを、改行ごとの配列に分ける関数です。Syslog は 1 回の送信で 1 行を運ぶ前提なので、複数行のメッセージは、行ごとに送る必要があります。この関数が、その分け方を担当しています。

## コード

```php:line-numbers=94
    private function splitMessageIntoLines($message): array
    {
        if (\is_array($message)) {
            $message = implode("\n", $message);
        }

        $lines = preg_split('/$\R?^/m', (string) $message, -1, PREG_SPLIT_NO_EMPTY);
        if (false === $lines) {
            $pcreErrorCode = preg_last_error();

            throw new \RuntimeException('Could not preg_split: ' . $pcreErrorCode . ' / ' . preg_last_error_msg());
        }

        return $lines;
    }
```

## 前提知識

- **Syslog**: システムのログを、ネットワーク越しに集める仕組みです。UDP という方式で、1 つの小さなパケットに 1 行ずつ載せて送ります。
- **正規表現**: 文字の並びの形を、記号で表す方法です。`preg_split` は、正規表現に当たった場所で文字列を切ります。
- **`preg_split` の行末と行頭**: `$` は行末、`^` は行頭を表します。`m` の指定を付けると、文字列の中の各行で、この判定が働きます。`\R` は、改行のいろいろな形（LF や CRLF など）に当たります。
- **`PREG_SPLIT_NO_EMPTY`**: 切った結果のうち、空の要素を取り除くための指定です。
- **`preg_last_error`**: 正規表現の処理で起きた問題の番号を返す関数です。

## 何をしているか

### 1. 配列なら、改行でつないで 1 つの文字列にする

```php:line-numbers=96
        if (\is_array($message)) {
            $message = implode("\n", $message);
        }
```

メッセージが配列で届いたときは、`implode` で、要素を改行でつないで 1 つの文字列にします。ここから先は、文字列として同じ処理を行えます。

### 2. 改行の位置で切る

```php:line-numbers=100
        $lines = preg_split('/$\R?^/m', (string) $message, -1, PREG_SPLIT_NO_EMPTY);
```

`preg_split` で、行末と行頭の境目で文字列を切ります。`\R?` によって、改行の種類が違っても、同じ位置で切れます。`PREG_SPLIT_NO_EMPTY` で、空の行は結果に入りません。`(string) $message` は、数値などが来ても文字列として扱うためです。

### 3. 失敗を見つけて、例外にする

```php:line-numbers=101
        if (false === $lines) {
            $pcreErrorCode = preg_last_error();

            throw new \RuntimeException('Could not preg_split: ' . $pcreErrorCode . ' / ' . preg_last_error_msg());
        }

        return $lines;
```

`preg_split` が `false` を返したら、`preg_last_error` で原因の番号を取り出します。その番号と、エラーの説明を例外のメッセージに入れて投げます。

## ここがすごい

- 配列と文字列の両方を、同じ関数で扱えます。呼び出し側は、メッセージの形を気にせずに渡せます。
- 改行の種類を `\R` で一度に扱うので、Windows 形式の CRLF も、Unix 形式の LF も、同じ方法で分けられます。
- 空の行を取り除く指定により、送信するパケットが無駄に増えません。
- 正規表現が失敗したとき、その原因を例外に残しています。ログの処理で起きた問題を、後から追える作りです。

## まとめ

`splitMessageIntoLines` は、ログのメッセージを改行で行ごとに分ける関数です。配列はいったんつないでから分け、正規表現の 1 回の操作で、いろいろな改行に対応します。Syslog のような小さなパケットに載せる仕組みを、正規表現の機能で素直に表しています。
