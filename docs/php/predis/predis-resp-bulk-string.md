---
title: 長さが-1なら「無し」を表す、Redisの文字列の読み方
description: Predis の parseBulkString は、RESP の文字列の長さを読み取ります。長さが -1 のときは値が無いことを表す null を返し、空の文字列と区別しています。
language: php
project: Predis
repo: https://github.com/predis/predis
license: MIT
copyright: Copyright (c) 2009-2020 Daniele Alessandri (original work)
commit: "047539781a774f362ad441bbd9e733402ef5f2c2"
file: src/Protocol/Parser/Strategy/Resp2Strategy.php
lines: [130, 142]
function: Resp2Strategy::parseBulkString
difficulty: 2
format: 2
tags: [パース, 防御的プログラミング, 文字列処理]
---
## ひとことで

`parseBulkString` は、Redis の応答のうち「長さのある文字列」（バルク文字列）の、先頭の長さ情報を読む関数です。長さが `-1` なら「値が無い」ことを示し、`null` を返します。空の文字列（長さ 0）とは区別されます。

## コード

```php:line-numbers=130
    protected function parseBulkString(string $string): ?array
    {
        $size = (int) $string;

        if ($size === -1) {
            return null;
        }

        return [
            'type' => self::TYPE_BULK_STRING,
            'value' => $size,
        ];
    }
```

## 前提知識

- **バルク文字列**: RESP で、長さを先に書いてから本体を送る文字列です。`$3` のあとに 3 バイトの本体が続きます。
- **`null` と空の文字列**: `''` は「中身が空の文字列」です。`null` は「そもそも値が無い」です。見た目は似ていますが、意味が違います。
- **`?array`**: 戻り値が配列か `null` であることを表す型の宣言です。
- **`(int)`**: 文字列を整数に変換します。`(int) '3'` は `3` です。
- **`self::TYPE_BULK_STRING`**: クラスの定数です。型を表す値を、文字列でなく名前で扱えます。

## 何をしているか

### 1. 長さを整数にする

```php:line-numbers=132
        $size = (int) $string;
```

受け取った文字列（`$string` には `$` の後ろの数字が入っている）を、整数の長さにします。

### 2. -1 は値が無いことを表す

```php:line-numbers=134
        if ($size === -1) {
            return null;
        }
```

RESP の仕様では、長さ `-1` は「値が無い」ことを表します。Redis で `GET` したキーが存在しないときなどに返ってきます。ここでは、それを `null` に変えて返します。

長さ `0` は、中身が空の文字列を表します。こちらは `-1` とは別の扱いなので、`null` にはなりません。

### 3. 型と長さを配列にまとめる

```php:line-numbers=138
        return [
            'type' => self::TYPE_BULK_STRING,
            'value' => $size,
        ];
```

値が有る場合は、型の名前と長さを配列にして返します。本体の読み取りは、この情報を使う別の処理が担当します。

## ここがすごい

- **無いことを `null` で表す**: 空の文字列と「無い」を分けることで、呼ぶ側が正しく判断できます。キーが存在しないのか、空の値なのかを間違えません。
- **仕様の数字を名前にしている**: `-1` の意味を、コードの中で `null` という形に直しています。仕様を知らなくても、戻り値の意味が読めます。
- **早めに戻る**: `null` の場合は、ここで処理を終えます。後の読み取りを行わないので、無効な長さで処理が続くことがありません。
- **型の情報を一緒に返す**: 長さだけでなく型も返すので、呼び出し側は次の処理を決めやすくなっています。

## まとめ

- RESP の長さ `-1` は、値が無いことを表す特別な印。
- 空の文字列（長さ 0）と、値が無いこと（`null`）は別物として扱う。
- 仕様の数字を、戻り値の型で表すと、読み手が意味を取り違えにくい。
- 無効な場合は早めに戻ると、後続の処理を安全に保てる。
