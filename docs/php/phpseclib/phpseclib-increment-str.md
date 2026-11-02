---
title: バイト列を数として1増やす、繰り上がりの処理
description: phpseclib の Strings::increment_str は、バイト列を大きな数と見なして 1 増やします。4 バイトずつ区切り、0xFFFFFFFF の繰り上がりを、ループで隣の区切りへ送ります。暗号の CTR モードで使われる計算です。
language: php
project: phpseclib
repo: https://github.com/phpseclib/phpseclib
license: MIT
copyright: Copyright (c) 2011-2026 TerraFrost and other contributors
commit: "694f9b2336a4923f86ce7c69ad5ab480ff97728b"
file: phpseclib/Common/Functions/Strings.php
lines: [335, 369]
function: Strings::increment_str
difficulty: 3
format: 2
tags: [数値計算, 暗号, ビット演算]
---
## ひとことで

`increment_str` は、バイト列を 1 つの大きな数と見なして、その値を 1 増やす関数です。ブロック暗号の CTR モードでは、ブロックごとのカウンターを増やすために、この計算が必要になります。

## コード

```php:line-numbers=335
    public static function increment_str(string &$var): void
    {
        if (function_exists('sodium_increment')) {
            $var = strrev($var);
            sodium_increment($var);
            $var = strrev($var);
            return;
        }

        for ($i = 4; $i <= strlen($var); $i += 4) {
            $temp = substr($var, -$i, 4);
            switch ($temp) {
                case "\xFF\xFF\xFF\xFF":
                    $var = substr_replace($var, "\x00\x00\x00\x00", -$i, 4);
                    break;
                case "\x7F\xFF\xFF\xFF":
                    $var = substr_replace($var, "\x80\x00\x00\x00", -$i, 4);
                    return;
                default:
                    $temp = unpack('Nnum', $temp);
                    $var = substr_replace($var, pack('N', $temp['num'] + 1), -$i, 4);
                    return;
            }
        }

        $remainder = strlen($var) % 4;

        if ($remainder == 0) {
            return;
        }

        $temp = unpack('Nnum', str_pad(substr($var, 0, $remainder), 4, "\0", STR_PAD_LEFT));
        $temp = substr(pack('N', $temp['num'] + 1), -$remainder);
        $var = substr_replace($var, $temp, 0, $remainder);
    }
```

## 前提知識

- **ビッグエンディアン**: 数字を、上の桁（大きい位）から先に並べるバイトの順番です。`N` の pack 形式は、この順番で 4 バイトの整数を作ります。
- **`0xFF`**: 16 進数で 255 を表します。`\xFF` は、そのバイト値を表す文字の書き方です。
- **繰り上がり**: 9 に 1 を足すと 0 になり、上の桁に 1 が進む、という仕組みです。バイト列では、`\xFF` に 1 を足すと `\x00` になり、隣に進みます。
- **`unpack` と `pack`**: バイト列と数値を相互に変換する PHP の関数です。`N` は 32 ビットの符号なし整数（4 バイト）を表します。
- **`switch`**: 値に応じて処理を分ける文です。`case` で、値ごとの処理を書きます。
- **`sodium_increment`**: libsodium という暗号ライブラリの関数で、同じ計算を高速に行います。使える環境では、その関数を優先します。

## 何をしているか

### 1. 拡張が使えるなら、それに任せる

```php:line-numbers=337
        if (function_exists('sodium_increment')) {
            $var = strrev($var);
            sodium_increment($var);
            $var = strrev($var);
            return;
        }
```

libsodium が使えれば、その関数で増やします。バイトの並びは、最初に `strrev` で反転させています。libsodium が、下の桁から先に扱う形式だからです。

### 2. 下の 4 バイトから順に見ていく

```php:line-numbers=344
        for ($i = 4; $i <= strlen($var); $i += 4) {
            $temp = substr($var, -$i, 4);
```

最後の 4 バイトから、4 バイトずつ上の区切りへ進みます。`$temp` は、今見ている区切りの 4 バイトです。

### 3. 区切りが全部 1 の場合は 0 にして次へ送る

```php:line-numbers=346
            switch ($temp) {
                case "\xFF\xFF\xFF\xFF":
                    $var = substr_replace($var, "\x00\x00\x00\x00", -$i, 4);
                    break;
```

4 バイトがすべて `FF` なら、そこを `00` にして、ループを続けます。上の区切りに 1 を足す必要があるからです。

### 4. 途中で止まるケースを処理する

```php:line-numbers=350
                case "\x7F\xFF\xFF\xFF":
                    $var = substr_replace($var, "\x80\x00\x00\x00", -$i, 4);
                    return;
                default:
                    $temp = unpack('Nnum', $temp);
                    $var = substr_replace($var, pack('N', $temp['num'] + 1), -$i, 4);
                    return;
```

`7F FF FF FF` に 1 を足すと `80 00 00 00` になり、繰り上がりは起きないので、そこで終わります。その他の場合は、`unpack` で数値にして 1 を足し、`pack` で戻して書き換えて終わります。

### 5. 端数のバイトを処理する

```php:line-numbers=360
        $remainder = strlen($var) % 4;

        if ($remainder == 0) {
            return;
        }
```

長さが 4 の倍数でないときは、先頭に残った端数のバイトも処理します。4 の倍数なら、すでに全部処理済みなので終わります。

## ここがすごい

- **4 バイトの区切りで速く進める**: 1 バイトずつ繰り上がりを調べるより、4 バイトの整数として 1 回の加算で済ませます。
- **繰り上がりを境界で止める**: 途中の区切りに繰り上がりが収まれば、そこで処理を打ち切ります。上の区切りを全部読み直す必要がありません。
- **`0x7FFFFFFF` の特別扱い**: `7F FF FF FF` に 1 を足すと、符号の付いた数の扱いで誤りが出やすい境目です。その場合を個別に書き、正しく `80 00 00 00` にしています。
- **拡張の有無で経路を分ける**: 高速な libsodium があれば任せ、なければ自前の計算を使います。どちらでも、同じ結果になります。

## まとめ

- バイト列の加算は、区切り（ここでは 4 バイト）ごとに繰り上がりを送ると効率的。
- 繰り上がりが収まる区切りに着いたら、そこで止める。
- 符号の境目のような特別な値は、個別に扱うと誤りを防げる。
- 高速な専用の関数があれば優先し、無ければ同じ結果を返す自前の処理に戻す。
