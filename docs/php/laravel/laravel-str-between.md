---
title: 2つの印に挟まれた部分を取り出す、Str::between
description: Laravel の Str::between は、開始の印より後ろで、終了の印より前の部分を返します。after と beforeLast を組み合わせて、文字列の中の囲まれた部分を 1 行で取り出します。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "b20bf7f442beabdb70e45cf9d29cd6c64675f856"
file: src/Illuminate/Support/Str.php
lines: [208, 215]
function: Str::between
difficulty: 2
format: 2
tags: [文字列処理, 正規表現, API設計]
---
## ひとことで

`Str::between` は、文字列の中で、開始の印と終了の印に挟まれた部分を取り出す関数です。`[タグ]本文[/タグ]` の `本文` のように、囲まれた部分だけがほしいときに使います。開始か終了の印が空なら、元の文字列をそのまま返します。

## コード

```php:line-numbers=208
    public static function between($subject, $from, $to)
    {
        if ($from === '' || $to === '') {
            return $subject;
        }

        return static::beforeLast(static::after($subject, $from), $to);
    }
```

## 前提知識

- **`static::`**: 同じクラスの静的メソッドを呼ぶための書き方です。`Str::after` を、継承先でも正しく呼べるようにします。
- **`after` と `beforeLast`**: `after` は区切りより後ろの部分を、`beforeLast` は区切りより前の部分のうち、最後に現れた区切りより前を返すメソッドです。この関数は、この 2 つを組み合わせています。
- **`||`（または）**: どちらかが真なら真になる論理演算子です。ここでは、`$from` か `$to` のどちらかが空なら、という条件です。
- **空の印**: 空文字の印は、位置を特定できないので、意味のある結果を作れません。

## 何をしているか

### 1. 空の印を先に弾く

```php:line-numbers=210
        if ($from === '' || $to === '') {
            return $subject;
        }
```

開始の印か終了の印が空なら、切り出す範囲を決められません。そのため、元の文字列を返します。

### 2. 開始の印より後ろを取る

```php:line-numbers=214
        return static::beforeLast(static::after($subject, $from), $to);
```

内側の `static::after($subject, $from)` が先に動きます。開始の印 `$from` より後ろの部分を取り出します。

たとえば `[tag]hello[/tag]` で開始を `[tag]` にすると、`hello[/tag]` が残ります。

### 3. 終了の印より前を取る

同じ行の外側の `beforeLast(..., $to)` が、残りのうち、終了の印 `$to` より前の部分を取り出します。`hello[/tag]` で終了を `[/tag]` にすると、`hello` が残ります。

`beforeLast` を使うのは、終了の印が本文の中にもう一度現れても、最後の印で区切るためです。これで、より外側の囲みを正しく取り出せます。

## ここがすごい

- **既存の部品を組み合わせる**: 「後ろを取る」と「前を取る」という 2 つの小さな関数を組み合わせて、新しい機能を作っています。同じ処理を、ゼロから書き直していません。
- **最後の印を使う工夫**: 終了の印を `before` ではなく `beforeLast` で切ることで、中に同じ印が含まれる場合も、外側の区切りを選べます。
- **空の印の防御**: 空の印で処理すると、結果が予想しにくくなります。関数の最初で弾くことで、利用者の誤りを安全に扱います。
- **1 行の読みやすさ**: 処理の流れが「後ろを取って、前を取る」と、内側から外側へ読めます。

## まとめ

- 囲まれた部分は、開始の印より後ろを取り、終了の印より前を取ると得られる。
- 2 つの小さな関数を組み合わせると、新しい機能を短く書ける。
- 終了の印は最後に現れた位置で切ると、入れ子の文字列に強い。
- 空の印は先に弾いておくと、結果の予測がしやすい。
