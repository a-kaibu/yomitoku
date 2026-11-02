---
title: "配列の値とキーを両方使って、キーを保ったまま変換する"
description: "Laravel の Arr::map は、配列の各要素に関数をかけて、キーをそのまま残します。array_map にキーを渡し、引数の数が合わないときだけ別の方法で呼び直すのが工夫です。"
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Collections/Arr.php
lines: [863, 874]
function: Arr::map
difficulty: 2
format: 2
tags: [イディオム, 関数型, イテレータ]
---

## ひとことで

`Arr::map` は、配列の各要素を関数で変換しつつ、**元のキーを残す** 関数です。`array_map` は、普通はキーを残しません。Laravel はそこを補って、キーと値の両方を使えるようにしています。

## コード

```php:line-numbers=863
    public static function map(array $array, callable $callback)
    {
        $keys = array_keys($array);

        try {
            $items = array_map($callback, $array, $keys);
        } catch (ArgumentCountError) {
            $items = array_map($callback, $array);
        }

        return array_combine($keys, $items);
    }
```

## 前提知識

- **`array_map`**: 配列の各要素に関数をかけて、新しい配列を作る PHP の関数です。複数の配列を同時に渡すこともできます。
- **`array_keys`**: 配列のキーだけを取り出して、新しい配列にする関数です。
- **`array_combine`**: 2 つの配列を、1 つ目をキー、2 つ目を値として組み合わせる関数です。
- **`ArgumentCountError`**: 関数に渡された引数の数が合わないときに起きる、PHP の例外です。
- **`try ... catch`**: 例外が起きたときに、別の処理へ移る書き方です。

## 何をしているか

### 1. キーを別に取り出しておく

```php:line-numbers=865
        $keys = array_keys($array);
```

`array_keys` で、キーの一覧を先に取り出します。`array_map` はキーを残さないので、後で `array_combine` に使うためです。

### 2. キーと値を両方渡して変換を試す

```php:line-numbers=867
        try {
            $items = array_map($callback, $array, $keys);
```

`array_map($callback, $array, $keys)` と書くと、値とキーが 1 つずつ同時に関数へ渡されます。たとえば `function ($value, $key)` と書いた関数は、両方を受け取れます。

### 3. 引数が合わなければ、値だけで呼び直す

```php:line-numbers=869
        } catch (ArgumentCountError) {
            $items = array_map($callback, $array);
```

関数が 1 つの引数しか受け取らないと、2 つ渡されたときに `ArgumentCountError` が起きます。その場合は、値だけを渡して `array_map` をもう一度行います。

### 4. 結果をキーと組み合わせる

```php:line-numbers=873
        return array_combine($keys, $items);
```

最後に、元のキーと変換後の値を `array_combine` で組み合わせて返します。

具体例として `['a' => 1, 'b' => 2]` の値を 2 倍にすると、`['a' => 2, 'b' => 4]` になります。

## ここがすごい

### 標準の関数の弱点を、2 段構えで補っている

`array_map` は、キーを残さない、という仕様です。そこで、キーを別の配列として一緒に渡し、結果を最後に `array_combine` で戻しています。標準の関数の組み合わせだけで、キーを保つ変換を実現しています。

### 例外で、2 つの書き方を切り替える

関数によっては、引数が多すぎると `ArgumentCountError` になります。ここでは、それを「キーを使えない関数だ」という合図として使い、値だけで呼び直します。例外を、通常の流れを切り替える道具として使う、ちょっと変わった書き方です。

### キーの順番を崩さない

`array_map` は、渡された配列の順番どおりに結果を作ります。キーと値が同じ位置で対応しているので、`array_combine` で正しく組み直せます。

## まとめ

- 標準の関数でキーを保ちたいときは、キーを別の配列として渡す方法がある。
- 引数の数が合わない例外は、呼び出し方を切り替える合図として使える。
- 元の順番が保たれていれば、後から配列を組み直しても対応が崩れない。
- キーを保つ変換は、利用者が自然に書ける形にしておくと便利。
