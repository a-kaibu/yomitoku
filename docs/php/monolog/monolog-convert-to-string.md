---
title: ログの値を、一つの文字列に変換する
description: Monolog の LineFormatter の convertToString は、ログに渡された値を、1 行の文字列にします。null と真偽値は var_export で、数値や文字列は文字列へのキャストで、それ以外は JSON で書き出します。
language: php
project: Monolog
repo: https://github.com/Seldaek/monolog
license: MIT
copyright: Copyright (c) 2011-2020 Jordi Boggiano
commit: "3bed304b1905fed5c30d172872f4d890cbb03c6a"
file: src/Monolog/Formatter/LineFormatter.php
lines: [224, 235]
function: convertToString
difficulty: 1
format: 2
tags: [文字列処理, 型システム, ログ]
---
## ひとことで

`convertToString` は、ログの中に入っている値を、文字列に変える関数です。文字列の中に値を埋め込んで 1 行のログにするには、値を文字列にしなければなりません。この関数は、値の種類に応じて、読みやすい文字列の形を選びます。

## コード

```php:line-numbers=224
    protected function convertToString($data): string
    {
        if (null === $data || \is_bool($data)) {
            return var_export($data, true);
        }

        if (\is_scalar($data)) {
            return (string) $data;
        }

        return $this->toJson($data, true);
    }
```

## 前提知識

- **スカラー値**: 整数、浮動小数点数、文字列、真偽値のように、1 つの値だけを持つ型です。配列やオブジェクトは含みません。
- **`var_export`**: 値を、PHP のコードとして読める形の文字列にする関数です。`null` は `'NULL'`、`true` は `'true'` のようになります。第 2 引数の `true` で、文字列として返させます。
- **キャスト `(string)`**: 値を強制的に文字列へ変える書き方です。数値の `42` は `'42'` になります。
- **JSON**: 配列やオブジェクトを、文字列の形で表す書き方です。`toJson` は、Monolog のフォーマッターが持つメソッドです。
- **`is_scalar`**: 値がスカラーかを調べる関数です。

## 何をしているか

### 1. null と真偽値は、var_export で書く

```php:line-numbers=226
        if (null === $data || \is_bool($data)) {
            return var_export($data, true);
        }
```

`null` か真偽値なら、`var_export` で書きます。`(string)` でキャストすると、`null` は空文字に、`false` も空文字になってしまいます。そこで、`var_export` で `'NULL'` や `'false'` の形にして、値が何だったかを残しています。

### 2. 数値や文字列は、そのまま文字列にする

```php:line-numbers=230
        if (\is_scalar($data)) {
            return (string) $data;
        }
```

`is_scalar` で、残りのスカラー値（数値や文字列）かを確かめます。その場合は、`(string)` でキャストするだけで済みます。

### 3. それ以外は JSON にする

```php:line-numbers=234
        return $this->toJson($data, true);
```

配列やオブジェクトは、`toJson` で JSON の文字列にします。第 2 引数の `true` は、変換の失敗を例外にせず、エラーを無視するという指定です。ログの書き出しを、変換の失敗で止めないための配慮です。

## ここがすごい

- `null` と `false` を、空文字に潰さずに区別しています。ログを読む人が、値がなかったのか、偽だったのかを見分けられます。
- 値の種類を 3 つの段階に分けて、それぞれに合う方法を当てています。単純な分岐で、どの値がどう変わるかを、一目で読み取れます。
- 配列やオブジェクトを JSON にすることで、1 行の中に構造をそのまま残せます。ログを後で機械的に読むときに役立ちます。
- 関数の戻り値が常に `string` なので、呼び出し側は、型の心配なく文字列を埋め込めます。

## まとめ

`convertToString` は、ログに渡された値を、種類に応じて文字列に変える関数です。`null` と真偽値は `var_export` で、スカラーは `(string)` で、それ以外は JSON で書きます。小さな関数ですが、ログの見やすさと情報の正確さを、同時に守っています。
