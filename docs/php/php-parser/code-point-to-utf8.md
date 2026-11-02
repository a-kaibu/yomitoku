---
title: 数値のコードポイントを、UTF-8の1〜4バイトに組み立てる
description: PHP-Parser の codePointToUtf8 は、"\u{3042}" のような Unicode のエスケープを、UTF-8 の 1 から 4 バイトに変換します。ビットを 6 ずつ切り出して、先頭の印を足すのが要点です。
language: php
project: PHP-Parser
repo: https://github.com/nikic/PHP-Parser
license: BSD-3-Clause
copyright: Copyright (c) 2011, Nikita Popov
commit: "1ee86c89e58a23810602e78ca445784bb7b2ad3e"
file: lib/PhpParser/Node/Scalar/String_.php
lines: [156, 171]
function: String_::codePointToUtf8
difficulty: 2
format: 2
tags: [Unicode, 文字列処理, ビット演算]
---
## ひとことで

`codePointToUtf8` は、Unicode の文字番号（コードポイント）を、UTF-8 というバイト列に変換する関数です。PHP のダブルクォート文字列にある `\u{3042}` のような書き方を、実際のバイト列に直すときに使われます。

## コード

```php:line-numbers=156
    private static function codePointToUtf8(int $num): string {
        if ($num <= 0x7F) {
            return chr($num);
        }
        if ($num <= 0x7FF) {
            return chr(($num >> 6) + 0xC0) . chr(($num & 0x3F) + 0x80);
        }
        if ($num <= 0xFFFF) {
            return chr(($num >> 12) + 0xE0) . chr((($num >> 6) & 0x3F) + 0x80) . chr(($num & 0x3F) + 0x80);
        }
        if ($num <= 0x10FFFF) {
            return chr(($num >> 18) + 0xF0) . chr((($num >> 12) & 0x3F) + 0x80)
                 . chr((($num >> 6) & 0x3F) + 0x80) . chr(($num & 0x3F) + 0x80);
        }
        throw new Error('Invalid UTF-8 codepoint escape sequence: Codepoint too large');
    }
```

## 前提知識

- **コードポイント**: Unicode が文字に割り振った番号です。`あ` は `0x3042`（16 進数）です。`0x` は 16 進数の書き方です。
- **UTF-8**: コードポイントを 1〜4 バイトで表す可変長の符号化方式です。ASCII の文字は 1 バイト、日本語の多くは 3 バイトになります。
- **ビット演算**: `>>`（右にずらす）、`&`（両方 1 のビットだけ残す）、`+`（足し算）を使ってバイトを組み立てます。
- **`chr`**: 0〜255 の整数を 1 バイトの文字に変える PHP の関数です。
- **`private static function`**: クラスの中だけで使える、インスタンスを作らずに呼べる関数です。

## 何をしているか

### 1. 1 バイトで足りる範囲

```php:line-numbers=157
        if ($num <= 0x7F) {
            return chr($num);
        }
```

`0x7F`（10 進数で 127）以下の値は、そのまま 1 バイトになります。これは ASCII と同じ値です。UTF-8 は ASCII と互換なので、英数字はそのまま通ります。

### 2. 2 バイトで表す範囲

```php:line-numbers=160
        if ($num <= 0x7FF) {
            return chr(($num >> 6) + 0xC0) . chr(($num & 0x3F) + 0x80);
        }
```

2 バイトの UTF-8 は `110xxxxx 10xxxxxx` の形です。上の 5 ビットを先頭の印 `110` と合わせるために、`$num >> 6` で 6 ビット右にずらし、`0xC0`（`11000000`）を足します。下の 6 ビットは `$num & 0x3F` で切り出し、`0x80`（`10000000`）を足して `10` の印を付けます。

### 3. 3 バイトで表す範囲

```php:line-numbers=164
            return chr(($num >> 12) + 0xE0) . chr((($num >> 6) & 0x3F) + 0x80) . chr(($num & 0x3F) + 0x80);
```

3 バイトの形は `1110xxxx 10xxxxxx 10xxxxxx` です。6 ビットずつ 3 つに分けて、それぞれに印を付けます。

たとえば `あ`（`0x3042`）を計算します。`0x3042 >> 12` は `3` なので、`3 + 0xE0 = 0xE3` が先頭のバイトです。`(0x3042 >> 6) & 0x3F` は `0x01` で、`+ 0x80` すると `0x81` になります。`0x3042 & 0x3F` は `0x02` で、`0x82` になります。並べると `E3 81 82` で、これは `あ` の UTF-8 です。

### 4. 4 バイトで表す範囲

```php:line-numbers=166
        if ($num <= 0x10FFFF) {
            return chr(($num >> 18) + 0xF0) . chr((($num >> 12) & 0x3F) + 0x80)
                 . chr((($num >> 6) & 0x3F) + 0x80) . chr(($num & 0x3F) + 0x80);
        }
```

4 バイトは `11110xxx 10xxxxxx 10xxxxxx 10xxxxxx` です。Unicode の最大値 `0x10FFFF` までを扱えます。

### 5. 範囲外は例外にする

```php:line-numbers=170
        throw new Error('Invalid UTF-8 codepoint escape sequence: Codepoint too large');
```

`0x10FFFF` を超える値は、UTF-8 で表せません。そのときは、変な文字列を作らずに例外を投げます。

## ここがすごい

- **範囲ごとに規則が分かれている**: UTF-8 の形式そのものを `if` の段階で表しています。4 つの分岐が、仕様の 4 つの行に対応しています。
- **ビットの切り出しが同じ形**: 2 バイト目以降は、どの範囲でも「6 ビット取り出して `0x80` を足す」という同じ操作です。読むときは 1 つ分かれば、残りも同じだと分かります。
- **ループを使わない**: 文字列を 1 文字ずつ組み立てる書き方もできます。ここでは桁数が決まっているので、分岐 4 つで十分です。
- **範囲外を明示的に拒否**: UTF-8 で表せない値を、黙って切り捨てません。

## まとめ

- UTF-8 は、コードポイントの大きさに応じて 1〜4 バイトの形を使い分ける。
- 続きのバイトは、常に `10` の印を先頭に付ける。
- 6 ビットずつ切り出し、`0x80` を足すと続きのバイトができる。
- 仕様の範囲外の値は、例外にして明示的に止める。
