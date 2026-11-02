---
title: 先頭の1文字で型を決める、Redis応答の振り分け
description: Predis の Resp2Strategy::parseData は、Redis の応答の先頭 1 文字を見て、対応する解析メソッドを呼び出します。型ごとの処理を、表のように切り替える仕組みです。
language: php
project: Predis
repo: https://github.com/predis/predis
license: MIT
copyright: Copyright (c) 2009-2020 Daniele Alessandri (original work)
commit: "047539781a774f362ad441bbd9e733402ef5f2c2"
file: src/Protocol/Parser/Strategy/Resp2Strategy.php
lines: [53, 65]
function: Resp2Strategy::parseData
difficulty: 2
format: 2
tags: [パース, 状態機械, 設計パターン]
---
## ひとことで

`parseData` は、Redis サーバーから返ってきた 1 行分のデータを読み、その先頭の 1 文字から種類（型）を判断して、対応する解析の処理に渡す関数です。RESP という Redis の通信形式を読むときの入口になります。

## コード

```php:line-numbers=53
    public function parseData(string $data)
    {
        $type = $data[0];
        $payload = substr($data, 1, -2);

        if (!array_key_exists($type, $this->typeCallbacks)) {
            throw new UnexpectedTypeException($type, 'Unexpected data type given.');
        }

        $callback = $this->typeCallbacks[$type];

        return $this->$callback($payload);
    }
```

## 前提知識

- **RESP**: Redis が使う通信の形式です。応答の先頭の 1 文字が、その種類を表します。たとえば `+` は単純な文字列、`-` はエラー、`:` は整数、`$` は長さのある文字列、`*` は配列です。
- **`$data[0]`**: 文字列の先頭の 1 文字を取り出します。
- **`substr($data, 1, -2)`**: 先頭の 1 文字を除き、末尾の 2 文字（`\r\n`）を除いた本体を取り出します。
- **連想配列 `$this->typeCallbacks`**: 文字と、それに対応する処理の名前の組を入れた配列です。
- **可変の関数呼び出し `$this->$callback(...)`**: 変数に入ったメソッド名を使って、メソッドを呼ぶ書き方です。
- **`array_key_exists`**: 配列に、その鍵があるかを調べる関数です。

## 何をしているか

### 1. 先頭の 1 文字と本体を分ける

```php:line-numbers=55
        $type = $data[0];
        $payload = substr($data, 1, -2);
```

先頭の 1 文字が、型を表す記号です。残りから末尾の 2 文字（改行の `\r\n`）を外したものが、本当のデータ（`$payload`）です。たとえば `$3\r\n` という 1 行を受け取ると、型は `$`、データは `3` になります。`$` は「長さのある文字列」、`3` はその長さです。ここでは、型と中身の分離だけを見ておけば十分です。

### 2. 知らない型はエラーにする

```php:line-numbers=58
        if (!array_key_exists($type, $this->typeCallbacks)) {
            throw new UnexpectedTypeException($type, 'Unexpected data type given.');
        }
```

表にない記号が来たら、例外を投げます。壊れた応答を、黙って解釈しないためです。

### 3. 対応する処理を呼ぶ

```php:line-numbers=62
        $callback = $this->typeCallbacks[$type];

        return $this->$callback($payload);
```

表から、型に対応する処理の名前（たとえば `parseBulkString`）を取り出します。`$this->$callback($payload)` で、そのメソッドを呼び、結果を返します。

## ここがすごい

- **条件分岐を表に置き換える**: 型の数だけ `if` を並べる代わりに、記号と処理名の対応表を使っています。型を増やすときは表に 1 行足すだけで済みます。
- **入口が 1 つ**: 応答の解析はすべてここから始まるので、エラーの扱いも 1 か所にまとまります。
- **未知の型を検出する**: 表にない記号を、例外として早めに知らせます。通信のずれに気付きやすくなります。
- **プロトコルの仕様と対応**: 表の記号は RESP の仕様そのものです。コードを読むと、Redis の仕様が分かる構造になっています。

## まとめ

- 応答の先頭 1 文字で型を決めると、通信形式を簡潔に読める。
- 型ごとの処理は、記号と処理名の表にまとめると増やしやすい。
- 表にない記号は例外にして、壊れた応答を見逃さない。
- 「入口を 1 つにする」ことで、解析の流れを追いやすくなる。
