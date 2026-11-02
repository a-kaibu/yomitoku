---
title: userName のような名前を「User Name」の見出しに直す
description: Laravel の Str::headline は、キャメルケースや区切り文字を含む名前を、単語ごとに頭を大文字にした見出しに変えます。区切りを一度 _ にそろえてから、単語を取り出すのが工夫です。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Support/Str.php
lines: [1558, 1569]
function: Str::headline
difficulty: 2
format: 2
tags: [文字列処理, 正規表現, イディオム]
---

## ひとことで

`Str::headline` は、`user_name` や `userName` のような識別子を、`User Name` のような **人が読める見出し** に変えます。フォームの項目名や、一覧の列の見出しを作るときに使われます。

## コード

```php:line-numbers=1558
    public static function headline($value)
    {
        $parts = preg_split('/\s+/u', $value, -1, PREG_SPLIT_NO_EMPTY);

        $parts = count($parts) > 1
            ? array_map(static::title(...), $parts)
            : array_map(static::title(...), static::ucsplit(implode('_', $parts)));

        $collapsed = static::replace(['-', '_', ' '], '_', implode('_', $parts));

        return implode(' ', array_filter(explode('_', $collapsed)));
    }
```

## 前提知識

- **見出し（ヘッドライン）**: 単語の頭を大文字にして、区切りを空白にした表示用の文字列です。
- **`ucsplit`**: 大文字の前で文字列を区切る Laravel の関数です。`userName` は `user` と `Name` に分かれます。
- **`array_map` と `title`**: 配列の各要素に関数を当てる書き方です。`title` は単語の頭を大文字にします。
- **`array_filter`**: 空の要素を取り除く PHP の関数です。
- **`static::title(...)`**: 関数名を値として渡す、PHP の第一級関数の書き方です。

## 何をしているか

### 1. 単語に分ける

```php:line-numbers=1560
        $parts = preg_split('/\s+/u', $value, -1, PREG_SPLIT_NO_EMPTY);
```

`preg_split('/\s+/u', ...)` で空白の区切りで分けます。`user name` のように空白で区切られていれば、ここで単語の配列になります。

### 2. 単語が 1 つだけなら、大文字の位置で分ける

```php:line-numbers=1562
        $parts = count($parts) > 1
            ? array_map(static::title(...), $parts)
            : array_map(static::title(...), static::ucsplit(implode('_', $parts)));
```

単語が 2 つ以上ならそのまま、1 つだけなら `ucsplit` で大文字の位置に区切ります。`userName` は `user` と `Name` に分かれます。どちらの場合も、各単語に `title` をかけて頭を大文字にします。

### 3. 区切りを `_` にそろえ、空白で結ぶ

```php:line-numbers=1566
        $collapsed = static::replace(['-', '_', ' '], '_', implode('_', $parts));

        return implode(' ', array_filter(explode('_', $collapsed)));
```

`-`、`_`、空白をすべて `_` に変え、`explode('_', ...)` で単語に戻してから、空の要素を除いて空白でつなぎます。

具体例として `userName` は、`User` と `Name` になり、`User Name` と表示されます。`user name` のように空白で区切られた入力は、各単語の頭だけが大文字になります。

## ここがすごい

### 入力の形によって、分け方を選ぶ

空白で区切られた入力は、そのまま単語として扱えます。一方、`userName` のように 1 語の入力は、大文字の位置を手がかりに分ける必要があります。この関数は、単語の数で分け方を選んでいます。どちらの入力も、同じ見出しの形にそろいます。

### 区切りを一度そろえてから、戻す

`-`、`_`、空白の 3 種類をまず `_` にまとめてから、再び分けています。区切りの種類がいくつ混ざっていても、同じ手順で処理できます。途中の表現を 1 つにそろえる、という考え方の良い例です。

### 空の要素を取り除く

区切りが連続したときに、空の要素が生まれることがあります。`array_filter` で取り除いてから結ぶので、余計な空白が入りません。

## まとめ

- 入力の形（空白があるか、ないか）で分け方を変えると、どちらにも対応できる。
- 区切りが複数あるときは、1 つの記号にそろえてから処理すると簡単になる。
- 文字列を分けてから結び直すと、余計な空白や空の要素を取り除ける。
- 関数を値として渡すと、各要素への処理を簡潔に書ける。
