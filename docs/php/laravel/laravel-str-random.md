---
title: "記号を除いた安全なランダム文字列を、乱数バイトから作る"
description: "Laravel の Str::random は、推測されにくいランダムな英数字の文字列を作ります。乱数のバイト列を Base64 にしてから、紛らわしい記号を捨てて必要な長さに切るのが工夫です。"
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Support/Str.php
lines: [1158, 1175]
function: Str::random
difficulty: 2
format: 2
tags: [乱数, 文字列処理, セキュリティ]
---

## ひとことで

`Str::random` は、指定した長さの **ランダムな文字列** を作ります。パスワードリセットの確認コードや、API のトークンなど、推測されては困る値を作るときに使われます。内部では暗号用の乱数を使っています。

## コード

```php:line-numbers=1158
    public static function random($length = 16)
    {
        return (static::$randomStringFactory ?? function ($length) {
            $string = '';

            while (($len = strlen($string)) < $length) {
                $size = $length - $len;

                $bytesSize = (int) ceil($size / 3) * 3;

                $bytes = random_bytes($bytesSize);

                $string .= substr(str_replace(['/', '+', '='], '', base64_encode($bytes)), 0, $size);
            }

            return $string;
        })($length);
    }
```

## 前提知識

- **乱数（ランダム）**: 予測できない値を作る仕組みです。`random_bytes` は暗号に使えるほど強い乱数を、指定したバイト数だけ返します。
- **Base64**: バイト列を英数字と `+`、`/`、`=` だけで表す方法です（ここでは見た目を整えるために使っています）。ここでは見た目を整えるために使っています。
- **`str_replace`**: 文字列の中の文字を別の文字に置き換える関数です。配列で渡すと、複数の文字をまとめて置き換えられます。
- **`substr`**: 文字列の一部を、開始位置と長さで切り出します。
- **`??`（null 合体演算子）**: 左の値が `null` なら右の値を使う書き方です。

## 何をしているか

### 1. テスト用の差し替えの口を使う

```php:line-numbers=1160
        return (static::$randomStringFactory ?? function ($length) {
```

`static::$randomStringFactory` が設定されていれば、その関数を使います。テストで「毎回同じ文字列を返す」ように差し替えられるよう、本体とは別の入口を用意しています。設定がなければ、右側の無名関数が使われます。

### 2. 必要な長さになるまで、乱数を足していく

```php:line-numbers=1162

            while (($len = strlen($string)) < $length) {
                $size = $length - $len;

                $bytesSize = (int) ceil($size / 3) * 3;

                $bytes = random_bytes($bytesSize);

                $string .= substr(str_replace(['/', '+', '='], '', base64_encode($bytes)), 0, $size);
            }
```

`$string` が必要な長さに届くまで、ループで文字を足していきます。`$bytesSize` は、残りの文字数を 3 で割って切り上げ、3 の倍数にしたバイト数です。Base64 は 3 バイトから 4 文字を作るので、この大きさにすると余りが出にくくなります。

`random_bytes` でバイト列を作り、`base64_encode` で英数字の文字列にします。そのあと `str_replace(['/', '+', '='], '', ...)` で、記号を取り除きます。最後に `substr(..., 0, $size)` で、足りない分だけ切り出します。

具体的に長さ 16 を作るなら、1 回目で 18 バイトの乱数から 24 文字の Base64 ができ、記号を除いて 16 文字に切ります。

## ここがすごい

### 「暗号用の乱数」を使っている

PHP には `rand` や `mt_rand` のような、速いけれど予測しやすい乱数もあります。トークンのように推測されると困る場面では、`random_bytes` のような暗号用の乱数を使う必要があります。この関数は最初からそれを選んでいます。

### 記号を捨てて、コピーしやすい文字列にする

Base64 には `/`、`+`、`=` が含まれます。これらは URL やメールの本文で扱いにくい文字です。取り除くことで、どこに貼ってもそのまま使える文字列になります。取り除いた分だけ長さが足りなくなるので、ループで足し続けているのが、この関数のもう 1 つの工夫です。

### テストで差し替えられる口を用意している

```php:line-numbers=1160
        return (static::$randomStringFactory ?? function ($length) {
```

ランダムな値を使う処理は、テストで毎回結果が変わって困ります。`$randomStringFactory` を差し替えられるようにしておけば、テストは固定の値を使えます。本番の処理は変えずに、テストのしやすさを確保しています。

## まとめ

- トークンのような値には、`rand` ではなく `random_bytes` のような暗号用の乱数を使う。
- Base64 から記号を取り除くと、URL やメールでも扱いやすい文字列になる。
- 必要な長さに届かないときは、ループで足していくと確実に長さがそろう。
- ランダムな処理は、テストで差し替えられる入口を用意しておくと検証しやすい。
