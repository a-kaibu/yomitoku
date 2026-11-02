---
title: コマンドを、Redisが読める長さ付きの文字列に変える
description: Predis の RequestSerializer::serialize は、Redis のコマンドと引数を RESP の形式に並べ直します。各部分の長さを先に書くことで、サーバーが区切りを正しく読めるようにしています。
language: php
project: Predis
repo: https://github.com/predis/predis
license: MIT
copyright: Copyright (c) 2009-2020 Daniele Alessandri (original work)
commit: "047539781a774f362ad441bbd9e733402ef5f2c2"
file: src/Protocol/Text/RequestSerializer.php
lines: [28, 44]
function: RequestSerializer::serialize
difficulty: 2
format: 2
tags: [パース, ネットワーク, 文字列処理]
---
## ひとことで

`serialize` は、Redis に送るコマンド（たとえば `SET key value`）を、RESP の形式の文字列に組み立てる関数です。コマンドの数と、各部分の長さを先に書き、そのあとに本体を続けます。

## コード

```php:line-numbers=28
    public function serialize(CommandInterface $command)
    {
        $commandID = $command->getId();
        $arguments = $command->getArguments();

        $cmdlen = strlen($commandID);
        $reqlen = count($arguments) + 1;

        $buffer = "*{$reqlen}\r\n\${$cmdlen}\r\n{$commandID}\r\n";

        foreach ($arguments as $argument) {
            $arglen = strlen($argument);
            $buffer .= "\${$arglen}\r\n{$argument}\r\n";
        }

        return $buffer;
    }
```

## 前提知識

- **RESP の配列**: 先頭が `*` で始まり、続けて要素の数を書きます。`*3` は要素が 3 つという意味です。
- **バルク文字列**: `$` のあとに長さを書き、改行のあとに本体を書きます。`$3\r\nSET\r\n` は、3 文字の `SET` を表します。
- **`\r\n`**: 改行を表す 2 文字です。RESP では、区切りにこの組み合わせを使います。
- **文字列の中の `{}`**: ダブルクォートの文字列の中で `{$変数}` と書くと、変数の値が埋め込まれます。
- **`CommandInterface`**: コマンドを表すインターフェースです。ID（コマンド名）と引数を取り出せます。

## 何をしているか

### 1. コマンド名と引数の数を準備する

```php:line-numbers=30
        $commandID = $command->getId();
        $arguments = $command->getArguments();

        $cmdlen = strlen($commandID);
        $reqlen = count($arguments) + 1;
```

`$commandID` は `SET` などのコマンド名、`$arguments` は引数の配列です。`$reqlen` は、コマンド名を含めた要素の数です。引数が 2 つなら、要素は 3 つになります。

### 2. 配列の頭とコマンド名を書く

```php:line-numbers=36
        $buffer = "*{$reqlen}\r\n\${$cmdlen}\r\n{$commandID}\r\n";
```

`*3` で要素が 3 つあることを示し、続けてコマンド名の長さと名前を書きます。`\$` は、ダブルクォートの中で `$` を文字として書くための書き方です。

### 3. 引数を 1 つずつ足す

```php:line-numbers=38
        foreach ($arguments as $argument) {
            $arglen = strlen($argument);
            $buffer .= "\${$arglen}\r\n{$argument}\r\n";
        }
```

それぞれの引数について、長さを書いてから本体を書きます。`.=` は、後ろに連結して `$buffer` を伸ばします。

キーが `foo` で値が `bar` なら、続きは `$3\r\nfoo\r\n$3\r\nbar\r\n` になります。

## ここがすごい

- **長さを先に書く**: 値の中に空白や改行が含まれていても、長さで区切りを判断できます。区切り文字だけで分ける方式と比べて、どんな文字列でも安全に送れます。
- **1 本の文字列にまとめる**: 途中で何度も送信せず、1 回の書き込みで済むように、全体を 1 つの文字列にしています。
- **仕様の形を直接書く**: `*` と `$` の書式が、RESP の仕様そのものです。読み手は仕様書と並べて、対応を確かめられます。
- **引数の型を文字列前提にしている**: `strlen` で長さを数えるので、引数は文字列として扱われます。送る前に、文字列へ揃えておく必要があります。

## まとめ

- RESP では、配列の要素数と、各文字列の長さを先に書く。
- 長さを前置きすると、本体の中に区切りの文字が含まれても安全に送れる。
- 組み立ての規則を、仕様の書式と 1 対 1 で対応させると読みやすい。
- 文字列の連結は `.=` で少しずつ伸ばすと、処理の流れを追いやすい。
