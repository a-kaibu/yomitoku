---
title: "行の分割から値の解釈まで、失敗を連鎖させて扱う"
description: "phpdotenv の Parser::parse は、.env の内容を行に分け、整え、項目として読み取ります。途中で失敗しても、成功と失敗を結果の型で運び、最後にまとめて例外にします。"
language: php
project: phpdotenv
repo: https://github.com/vlucas/phpdotenv
license: BSD-3-Clause
copyright: Copyright (c) 2014, Graham Campbell.
commit: "96149103e62ac67e915f6d2ef59b72dee2e011e0"
file: src/Parser/Parser.php
lines: [23, 32]
function: Parser::parse
difficulty: 3
format: 2
tags: [エラー処理, パース, 設計パターン]
---

## ひとことで

`Parser::parse` は、`.env` ファイルの **内容を読み取って、設定の項目の一覧にする** 関数です。改行で分ける、行を整える、項目として解釈する、という段階を、1 つの流れにつないでいます。

## コード

```php:line-numbers=23
    public function parse(string $content)
    {
        return Regex::split("/(\r\n|\n|\r)/", $content)->mapError(static function () {
            return 'Could not split into separate lines.';
        })->flatMap(static function (array $lines) {
            return self::process(Lines::process($lines));
        })->mapError(static function (string $error) {
            throw new InvalidFileException(\sprintf('Failed to parse dotenv file. %s', $error));
        })->success()->get();
    }
```

## 前提知識

- **結果型（Result）**: 「成功した値」か「失敗の理由」のどちらかを持つ入れ物です。例外を投げる代わりに、失敗を値として運びます。
- **`flatMap`**: 成功していれば次の処理に進み、失敗していればそのまま運ぶ連鎖の書き方です。
- **`mapError`**: 失敗の中身だけを、別の形に変える操作です。
- **`success()->get()`**: 成功の値を取り出すための書き方です。失敗していれば、ここで例外になります。
- **`InvalidFileException`**: ファイルの内容が正しくないときに投げる、専用の例外です。

## 何をしているか

### 1. 内容を行に分ける

```php:line-numbers=25
        return Regex::split("/(\r\n|\n|\r)/", $content)->mapError(static function () {
            return 'Could not split into separate lines.';
```

`Regex::split` で、改行（`\r\n`、`\n`、`\r` のどれでも）ごとに分けます。分けられなければ、失敗の理由を付けます。

### 2. 行を整えて、項目を読む

```php:line-numbers=27
        })->flatMap(static function (array $lines) {
            return self::process(Lines::process($lines));
```

成功したら、`flatMap` の中で `Lines::process` に行を渡して整え、その結果を `self::process` で項目に変えます。ここでも、失敗があれば次の処理は行われず、失敗がそのまま運ばれます。

### 3. 失敗は、最後に例外にする

```php:line-numbers=29
        })->mapError(static function (string $error) {
            throw new InvalidFileException(\sprintf('Failed to parse dotenv file. %s', $error));
        })->success()->get();
```

`mapError` で、失敗の理由を例外のメッセージに組み込みます。`success()->get()` で成功の値を取り出します。失敗があった場合は、ここで `InvalidFileException` が投げられます。

具体例として `A=1` と書かれた内容は、行に分けられ、項目 `A` の値 `1` として返されます。

## ここがすごい

### 途中の if を、連鎖の 1 行に置き換えている

3 段階の処理を、それぞれ「失敗したら戻る」と書くと、if が何段も続きます。この関数は、`flatMap` でつなぐことで、成功の道だけを上から読めるように書いています。失敗の扱いは、結果型が自動的に運びます。

### 例外を投げるのは、最後の 1 か所だけ

途中の段階で例外を投げると、どこで失敗したかの情報が散らばります。ここでは結果型で失敗を運び、最後の `mapError` で 1 回だけ例外にします。エラーの形が 1 つにまとまるので、利用者は扱いやすくなります。

### 段階の名前が、処理の意味を示している

`Regex::split`、`Lines::process`、`self::process` のように、段階ごとに別の関数に分かれています。各段階が何をするかは、名前を見れば分かります。流れを読むだけで、仕組みの全体像が掴めます。

## まとめ

- 途中で失敗しうる処理は、結果型でつなぐと、if を重ねずに書ける。
- 例外は最後の 1 か所にまとめると、エラーの形がそろう。
- 段階ごとに関数を分け、名前で役割を示すと、流れを追いやすい。
- 成功の道を上から読めるように書くと、後の人が仕組みを理解しやすい。
