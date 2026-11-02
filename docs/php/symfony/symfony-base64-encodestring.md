---
title: "メールのヘッダに載る Base64 を 76 文字ごとに折り返す"
description: "Symfony の Base64Encoder::encodeString は、メールの本文や添付ファイルを Base64 にしたうえで、1 行 76 文字で折り返します。最初の行だけ長さを変えられるのが工夫です。"
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/Mime/Encoder/Base64Encoder.php
lines: [26, 40]
function: Base64Encoder::encodeString
difficulty: 2
format: 2
tags: [文字列処理, ネットワーク, 移植性]
---

## ひとことで

`encodeString` は、文字列を **Base64**（バイナリを英数字と記号だけで表す方法）に変換し、メールの規格に合わせて **1 行 76 文字で折り返す** 関数です。Symfony の Mime コンポーネントで、メールの件名や添付ファイルを扱うときに使われます。

## コード

```php:line-numbers=26
    public function encodeString(string $string, ?string $charset = 'utf-8', int $firstLineOffset = 0, int $maxLineLength = 0): string
    {
        if (0 >= $maxLineLength || 76 < $maxLineLength) {
            $maxLineLength = 76;
        }

        $encodedString = base64_encode($string);
        $firstLine = '';
        if (0 !== $firstLineOffset) {
            $firstLine = substr($encodedString, 0, $maxLineLength - $firstLineOffset)."\r\n";
            $encodedString = substr($encodedString, $maxLineLength - $firstLineOffset);
        }

        return $firstLine.trim(chunk_split($encodedString, $maxLineLength, "\r\n"));
    }
```

## 前提知識

- **Base64**: 任意のバイト列を、`A-Z`、`a-z`、`0-9`、`+`、`/` の 64 種類の文字だけで表す符号化です。メールのように文字の制約がある場所でよく使われます。
- **MIME**: メールの本文や添付の形式を決める規格です。1 行の長さは 76 文字以下、と決められています。
- **`chunk_split`**: 文字列を一定の長さで区切り、区切りごとに別の文字（ここでは `\r\n`）を入れる PHP の関数です。
- **`trim`**: 文字列の前後の空白や改行を取り除く関数です。
- **`substr`**: 文字列の一部を、開始位置と長さで取り出す関数です。

## 何をしているか

### 1. 行の長さの上限を決める

```php:line-numbers=28
        if (0 >= $maxLineLength || 76 < $maxLineLength) {
            $maxLineLength = 76;
        }
```

行の長さが 0 以下、または 76 より大きいときは、76 にそろえます。メールの規格に反しない長さに、必ず収める書き方です。

### 2. まず Base64 にする

```php:line-numbers=32
        $encodedString = base64_encode($string);
```

`base64_encode($string)` で、文字列全体を Base64 に変換します。ここまでは、まだ折り返していない 1 本の長い文字列です。

### 3. 最初の行だけ、ずらして切る

```php:line-numbers=33
        $firstLine = '';
        if (0 !== $firstLineOffset) {
            $firstLine = substr($encodedString, 0, $maxLineLength - $firstLineOffset)."\r\n";
            $encodedString = substr($encodedString, $maxLineLength - $firstLineOffset);
        }
```

`$firstLineOffset` は、件名の `Subject: ` のように、同じ行の先頭にすでに文字がある場合の文字数です。そのぶん最初の行に入れられる文字が減るので、`$maxLineLength - $firstLineOffset` の長さだけ先頭から切り出し、`\r\n` を付けて `$firstLine` に入れます。残りの文字列は、切った位置から先を次の行へ回します。

### 4. 残りを 76 文字で折り返す

```php:line-numbers=39
        return $firstLine.trim(chunk_split($encodedString, $maxLineLength, "\r\n"));
```

`chunk_split($encodedString, $maxLineLength, "\r\n")` で、残りを 76 文字ごとに区切ります。最後に `trim` で末尾の `\r\n` を取り除きます。`chunk_split` は最後の区切りの後ろにも改行を付けるので、この `trim` で揃えています。

具体例として、`Subject: ` の 9 文字がある場合、最初の行は `76 - 9 = 67` 文字の Base64 だけになります。

## ここがすごい

### 最初の行だけ長さを変える、という細かな配慮

メールのヘッダでは、同じ行の先頭に `Subject: ` のような文字があります。ここを無視して毎回 76 文字で切ると、行が 76 文字を超えてしまいます。`$firstLineOffset` を受け取り、最初の行だけ短く切ることで、この問題を解決しています。関数の中に「先頭だけ特別」と分かるように書かれているので、読み手にも意図が伝わります。

### 2 段の処理に分けて、役割をはっきりさせている

先頭の行を切り出す処理と、残りを `chunk_split` で折り返す処理を分けています。最初に `substr` で先頭だけを切り、残りは `chunk_split` に任せる形です。1 回の `chunk_split` で全部まとめようとすると、最初の行の長さを表現できません。

### `$charset` は受け取るが使わない

引数の `$charset` は、この関数の中では使われていません。Base64 は英数字だけなので、文字コードを気にしなくてよいからです。それでも同じ形の関数として呼び出せるように、引数の並びをそろえています。

## まとめ

- メールの 1 行の長さ制限は、Base64 にしてから `chunk_split` で折り返すとよい。
- ヘッダの分だけ、最初の行の長さを減らすと規格を守れる。
- 「区切る」と「整える」を分けると、役割が読みやすくなる。
- 使わない引数があるときは、その理由を理解しておくと読みやすい。
