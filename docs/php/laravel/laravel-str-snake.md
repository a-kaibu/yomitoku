---
title: "キャメルケースをスネークケースに変えて結果を覚えておく"
description: "Laravel の Str::snake は、helloWorld を hello_world に変えます。一度計算した結果を静的な配列に覚えておく、キャッシュの書き方も見どころです。"
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Support/Str.php
lines: [1693, 1708]
function: Str::snake
difficulty: 2
format: 2
tags: [文字列処理, キャッシュ, 正規表現]
---

## ひとことで

`Str::snake` は、キャメルケース（`helloWorld`）やパスカルケース（`HelloWorld`）の文字列を、**スネークケース**（`hello_world`）に変換します。ファイル名、データベースの列名、設定キーなどを作るときに、よく使われる変換です。

## コード

```php:line-numbers=1693
    public static function snake($value, $delimiter = '_')
    {
        $key = $value;

        if (isset(static::$snakeCache[$key][$delimiter])) {
            return static::$snakeCache[$key][$delimiter];
        }

        if (! ctype_lower($value)) {
            $value = preg_replace('/\s+/u', '', ucwords($value));

            $value = static::lower(preg_replace('/(.)(?=[A-Z])/u', '$1'.$delimiter, $value));
        }

        return static::$snakeCache[$key][$delimiter] = $value;
    }
```

## 前提知識

- **スネークケース / キャメルケース**: 単語を `_` でつなぐ書き方と、区切りを大文字にする書き方です。
- **静的プロパティ `static::$snakeCache`**: クラスに 1 つだけ持たせる変数です。関数を呼ぶたびに中身が残ります。
- **正規表現**: `/(.)(?=[A-Z])/u` のように、文字のパターンを表す書き方です。`/` で囲み、末尾の `u` は UTF-8 として扱うことを表します。
- **先読み `(?=...)`**: 「この位置の後ろに〜がある」を確かめるだけで、文字は消費しない書き方です。
- **`ucwords`**: 各単語の先頭を大文字にする関数です。

## 何をしているか

### 1. 計算済みなら、すぐに返す

```php:line-numbers=1695
        $key = $value;

        if (isset(static::$snakeCache[$key][$delimiter])) {
            return static::$snakeCache[$key][$delimiter];
        }
```

`$key` は変換前の文字列です。`static::$snakeCache[$key][$delimiter]` に結果が入っていれば、そのまま返します。キーに区切り文字も含めているので、`_` と `-` のように区切り方が違っても、別々に覚えられます。

### 2. 大文字を含むときだけ変換する

```php:line-numbers=1701
        if (! ctype_lower($value)) {
            $value = preg_replace('/\s+/u', '', ucwords($value));

            $value = static::lower(preg_replace('/(.)(?=[A-Z])/u', '$1'.$delimiter, $value));
        }
```

`ctype_lower` で、すべてが小文字かを調べます。小文字だけなら変換の必要はありません。大文字を含むときは、まず `ucwords` で単語の頭を大文字にし、`preg_replace('/\s+/u', '', ...)` で空白を消して、`helloWorld` は `HelloWorld` の形にそろえます。

次に `preg_replace('/(.)(?=[A-Z])/u', '$1'.$delimiter, $value)` で、大文字の直前に区切りを入れます。`(.)` は任意の 1 文字を、`(?=[A-Z])` は「次が大文字である」という条件を表します。`$1` で元の文字を残しつつ、その後ろに `_` を足す仕組みです。最後に `static::lower` で全部を小文字にします。

具体的に `HelloWorld` を見てみましょう。`o` の直前に `W` があるので、`Hello` の後ろに `_` が入り、`Hello_World` になります。小文字化して `hello_world` が完成です。

### 3. 結果を覚えて返す

```php:line-numbers=1707
        return static::$snakeCache[$key][$delimiter] = $value;
```

代入は式でもあるので、`return static::$snakeCache[$key][$delimiter] = $value;` と 1 行で「覚えてから返す」ことができます。

## ここがすごい

### 変換の結果を「入力」と「区切り文字」の組で覚える

同じ変換を何度も行う場面は多いものです。たとえば列名を作るときに、同じ単語を何百回も変換することもあります。この関数は、入力と区切り文字の組をキーにして結果を保存します。正規表現を毎回実行しなくて済むので、速さと読みやすさを両立しています。

### 変換を 1 つの正規表現で済ませている

大文字の前に区切りを入れる処理は、`(.)(?=[A-Z])` の 1 行で書かれています。文字を前から見ていって、大文字の手前にだけ区切りを差し込むという処理が、先読みという機能で素直に表せています。もし 1 文字ずつ `for` で見ていく書き方なら、何行も必要になります。

### 小文字だけのときは何もしない

`ctype_lower` で先に確かめるので、もともと小文字の文字列は正規表現を通りません。よくある `user_id` のような入力が速く返るのは、この早期判定のおかげです。

## まとめ

- 同じ入力に対する結果は、静的な配列に覚えておくと速くなる。
- 先読み `(?=...)` を使うと、「直前の文字の後ろに区切りを入れる」が 1 行で書ける。
- 小文字だけの入力を先に見分けておくと、無駄な処理を省ける。
- 代入は式なので、覚えることと返すことを 1 行で書ける。
