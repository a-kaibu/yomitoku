---
title: 区切り文字より前の部分だけを取り出す、Str::before
description: Laravel の Str::before は、文字列の中で区切りが最初に現れる位置より前を返します。strstr の第 3 引数を使い、見つからない場合は元の文字列をそのまま返す作りです。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "b20bf7f442beabdb70e45cf9d29cd6c64675f856"
file: src/Illuminate/Support/Str.php
lines: [167, 176]
function: Str::before
difficulty: 1
format: 2
tags: [文字列処理, イディオム, API設計]
---
## ひとことで

`Str::before` は、文字列の中で `$search` が最初に現れる位置より前の部分を返す関数です。`user@example.com` から `@` より前の `user` を取り出すような場面で使われます。区切りが無い場合は、元の文字列全体を返します。

## コード

```php:line-numbers=167
    public static function before($subject, $search)
    {
        if ($search === '') {
            return $subject;
        }

        $result = strstr($subject, (string) $search, true);

        return $result === false ? $subject : $result;
    }
```

## 前提知識

- **`strstr`**: 文字列の中で、指定した文字列が最初に現れる位置から後ろを返す PHP の関数です。`strstr('a@b', '@')` は `@b` を返します。
- **第 3 引数 `true`**: `strstr` に `true` を渡すと、見つかった位置より前の部分を返すようになります。`strstr('a@b', '@', true)` は `a` を返します。
- **`false`**: 見つからなかったときに `strstr` が返す値です。`=== false` と書くと、空文字（`''`）と区別できます。
- **`(string)`**: 値を文字列に変換するキャストです。数字の区切りを渡されても、`strstr` に文字列として渡せます。
- **三項演算子**: 条件によって値を選ぶ書き方です。

## 何をしているか

### 1. 空の区切りは何もしない

```php:line-numbers=169
        if ($search === '') {
            return $subject;
        }
```

区切りが空のときは、元の文字列をそのまま返します。空の区切りで `strstr` を呼ぶと、意味のある結果にならないためです。

### 2. 区切りより前を取り出す

```php:line-numbers=173
        $result = strstr($subject, (string) $search, true);
```

`strstr` の第 3 引数に `true` を渡すと、区切りより前の部分が返ります。`(string)` で、区切りを文字列に揃えてから渡しています。

たとえば `user@example.com` に `@` を指定すると、`user` が返ります。

### 3. 見つからなければ元の文字列を返す

```php:line-numbers=175
        return $result === false ? $subject : $result;
```

区切りが見つからない場合、`strstr` は `false` を返します。このとき、元の文字列 `$subject` をそのまま返します。たとえば `before('user', '@')` は `user` を返します。

`=== false` と比べているので、区切りが文字列の先頭にあって結果が空文字になった場合（`before('@b', '@')` の `''`）とは区別されます。

## ここがすごい

- **1 回の関数呼び出しで済む**: 位置を探して、文字列を切る、という 2 段階の処理を、`strstr` の第 3 引数 1 つで表しています。
- **`false` と空文字を分けて扱う**: 結果が空の文字列なのか、区切りが無かったのかを、型まで含めた比較で区別しています。
- **見つからないときの規則が明確**: 「見つからなければ全体を返す」という規則です。例外を投げないので、呼び出し側は安心して使えます。
- **後ろ版の `after` と対になる**: `before` と `after` を並べると、文字列を区切りで 2 つに割る操作として理解できます。

## まとめ

- 区切りより前の部分は、`strstr` の第 3 引数に `true` を渡すと得られる。
- 関数の戻り値が `false` かどうかを、厳密な比較で調べると、空の結果と区別できる。
- 区切りが見つからないときは、元の文字列を返すという規則が使いやすい。
- 対になる関数（`after`）と並べて覚えると、文字列の切り方が整理される。
