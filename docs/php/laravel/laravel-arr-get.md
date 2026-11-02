---
title: "「user.address.city」のようなキーで、深い値を取り出す"
description: "Laravel の Arr::get は、ドットでつないだキーを使って、入れ子の配列の値を取り出します。キーそのものがある場合を先に確かめる、順序の工夫が見どころです。"
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Collections/Arr.php
lines: [497, 524]
function: Arr::get
difficulty: 2
format: 2
tags: [データ構造, イディオム, 防御的プログラミング]
---

## ひとことで

`Arr::get` は、`user.address.city` のように `.` でつないだキーを使って、**入れ子の配列の深い場所にある値** を取り出します。見つからないときは、指定した既定値を返します。設定値やリクエストの値を読むときに、とても頻繁に使われている関数です。

## コード

```php:line-numbers=497
    public static function get($array, $key, $default = null)
    {
        if (! static::accessible($array)) {
            return value($default);
        }

        if (is_null($key)) {
            return $array;
        }

        if (static::exists($array, $key)) {
            return $array[$key];
        }

        if (! str_contains($key, '.')) {
            return value($default);
        }

        foreach (explode('.', $key) as $segment) {
            if (static::accessible($array) && static::exists($array, $segment)) {
                $array = $array[$segment];
            } else {
                return value($default);
            }
        }

        return $array;
    }
```

## 前提知識

- **入れ子の配列**: 配列の中にさらに配列が入っている形です。`['user' => ['name' => 'Ami']]` のような形です。
- **`explode`**: 文字列を区切り文字で分けて、配列にする関数です。
- **`str_contains`**: 文字列の中に別の文字列が含まれるかを調べる関数です。
- **`is_null`**: 値が `null` かを調べる関数です。
- **`value()`**: 値そのものを返します。もし値が関数なら、その関数を呼んだ結果を返す Laravel の補助関数です。

## 何をしているか

### 1. 先に「そのままのキー」があるかを確かめる

```php:line-numbers=507
        if (static::exists($array, $key)) {
            return $array[$key];
        }
```

キーが `user.name` のように `.` を含むとき、それが配列の中に **そのまま** 存在するかを先に確かめます。PHP の配列には `'user.name'` という名前のキーも作れるからです。あればそれを返します。

### 2. ドットがなければ、既定値を返す

```php:line-numbers=511
        if (! str_contains($key, '.')) {
            return value($default);
        }
```

`.` を含まないキーで、そのまま存在しなかったときは、探す場所がないので既定値を返します。

### 3. ドットで区切って、1 段ずつ潜る

```php:line-numbers=515
        foreach (explode('.', $key) as $segment) {
            if (static::accessible($array) && static::exists($array, $segment)) {
                $array = $array[$segment];
            } else {
                return value($default);
            }
        }
```

`explode('.', $key)` でキーを分けて、先頭から 1 段ずつ潜っていきます。どこかで段の名前がなければ、そこで既定値を返します。

```php:line-numbers=523
        return $array;
```

最後まで潜れたら、その値を返します。

具体例として `['user' => ['address' => ['city' => 'Tokyo']]]` から `user.address.city` を取り出すと、`user`、`address`、`city` の順に潜って `Tokyo` になります。

## ここがすごい

### そのままのキーを、最初に確かめる順番の工夫

キーにドットが入っている場合、まずそのままの名前を探すのが、この関数の大事な順番です。ドットで分けてしまうと、`'a.b'` という名前のキーを見つけられなくなります。「本当にある名前」を優先してから、「入れ子の名前」を探すので、どちらの使い方も壊れません。

### 途中で止まっても、同じ既定値に戻る

段を 1 つずつ潜る途中で名前がなければ、すぐに既定値を返します。ネストが深くても、途中で止まれば余計な処理はしません。`value($default)` を使うことで、既定値が関数でも同じ形で扱えます。

### 書き込み側の `Arr::set` と対になる

`Arr::set` は、同じ「ドット記法」で値を書き込みます。読むとき（`get`）と書くとき（`set`）で同じキーの形を使えるので、設定値の扱いが一貫します。

## まとめ

- ドット記法のキーは、そのままの名前を先に探すと安全。
- 入れ子の値は、区切りで分けて 1 段ずつ潜ると書きやすい。
- 途中で名前がなければ、すぐに既定値を返すと無駄な処理を避けられる。
- 既定値を `value()` で包むと、値でも関数でも同じように扱える。
