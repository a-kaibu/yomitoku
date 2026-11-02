---
title: 先頭に決まった語があるときだけ、その語を取り除く
description: Laravel の Str::chopStart は、文字列が指定した語で始まるときだけ、その語を取り除きます。語は 1 つでも配列でも指定でき、最初に当たったものを使います。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "b20bf7f442beabdb70e45cf9d29cd6c64675f856"
file: src/Illuminate/Support/Str.php
lines: [270, 279]
function: Str::chopStart
difficulty: 1
format: 2
tags: [文字列処理, API設計, 防御的プログラミング]
---
## ひとことで

`Str::chopStart` は、文字列の先頭に決まった語があれば、その語を取り除いた残りを返す関数です。`/api/users` から `/api` を外して `/users` にするような、接頭辞を外す処理に使われます。先頭に語が無ければ、元の文字列をそのまま返します。

## コード

```php:line-numbers=270
    public static function chopStart($subject, $needle)
    {
        foreach ((array) $needle as $n) {
            if ($n !== '' && str_starts_with($subject, $n)) {
                return mb_substr($subject, mb_strlen($n));
            }
        }

        return $subject;
    }
```

## 前提知識

- **`str_starts_with`**: 文字列が指定の語で始まるかを `true` か `false` で返す PHP の関数です。
- **`(array) $needle`**: 値を配列に変えるキャストです。文字列 1 つなら、要素 1 つの配列になります。配列ならそのままです。このおかげで、引数は 1 つでも複数でも受け取れます。
- **`foreach`**: 配列の要素を 1 つずつ取り出す文です。
- **`mb_substr` と `mb_strlen`**: 文字単位で切り出す関数と、文字数を数える関数です。日本語などのマルチバイト文字でも、正しい位置で切れます。
- **`return` での早期終了**: 最初に当たった時点で値を返し、残りの語は調べません。

## 何をしているか

### 1. 語の一覧に変換して順番に調べる

```php:line-numbers=272
        foreach ((array) $needle as $n) {
            if ($n !== '' && str_starts_with($subject, $n)) {
```

`$needle` を配列にしてから、語を 1 つずつ取り出します。空文字の語は、どんな文字列でも先頭に「ある」とみなされてしまうので、`$n !== ''` で除外しています。

### 2. 先頭に当たったら、その分を切り落とす

```php:line-numbers=274
                return mb_substr($subject, mb_strlen($n));
```

語が先頭に見つかったら、その語の文字数を `mb_strlen` で数え、その位置から後ろを `mb_substr` で取り出します。`/api/users` と `/api` なら、残りは `/users` です。

### 3. どれにも当たらなければそのまま返す

```php:line-numbers=278
        return $subject;
```

すべての語を調べても当たらなければ、元の文字列を返します。失敗でも例外にならず、呼び出し側は結果をそのまま使えます。

## ここがすごい

- **1 つの引数で複数の候補を受ける**: 単独の語と、候補の配列を同じ引数で受け付けます。呼び出し側は、場面に応じて書き分けるだけで済みます。
- **空の語を除外する**: 空文字は、どの文字列にも先頭として当たってしまいます。この一行の判定で、誤って全体を切り落とすことを防いでいます。
- **文字単位で切る**: `substr` ではなく `mb_substr` を使うので、語が日本語でも文字の途中で切れません。
- **対になる関数**: 末尾版の `chopEnd` と並べると、先頭と末尾の処理が同じ形で読めます。

## まとめ

- 接頭辞を外すときは、先頭に語があるかを調べてから切ると安全。
- 引数を配列に揃えると、1 つの語と複数の候補を同じ処理で扱える。
- 空の語は必ず除外しておくと、全体が誤って消えない。
- マルチバイト文字を扱うなら、`mb_` 系の関数で文字単位に切る。
