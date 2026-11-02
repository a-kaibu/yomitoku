---
title: 表示幅を数えて、単語の途中で切らずに短くする
description: Laravel の Str::limit は、長い文字列を指定した幅に収めて「...」を付けます。全角と半角の幅を数え、単語の区切りで切るかどうかも選べます。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Support/Str.php
lines: [771, 790]
function: Str::limit
difficulty: 2
format: 2
tags: [文字列処理, Unicode]
---

## ひとことで

`Str::limit` は、長い文章を **指定した幅まで** 短くして、末尾に `...` などを付けます。一覧ページの要約や、カードに載せる説明文でよく使われます。日本語の全角文字も正しく数えられます。

## コード

```php:line-numbers=771
    public static function limit($value, $limit = 100, $end = '...', $preserveWords = false)
    {
        if (mb_strwidth($value, 'UTF-8') <= $limit) {
            return $value;
        }

        if (! $preserveWords) {
            return rtrim(mb_strimwidth($value, 0, $limit, '', 'UTF-8')).$end;
        }

        $value = trim(preg_replace('/[\n\r]+/', ' ', strip_tags($value)));

        $trimmed = rtrim(mb_strimwidth($value, 0, $limit, '', 'UTF-8'));

        if (mb_substr($value, $limit, 1, 'UTF-8') === ' ') {
            return $trimmed.$end;
        }

        return preg_replace("/(.*)\s.*/", '$1', $trimmed).$end;
    }
```

## 前提知識

- **文字の幅**: 半角の英数字は 1、全角の日本語は 2 として数えた見た目の長さです。文字数（何文字か）とは別物です。
- **`mb_strwidth`**: 文字列の幅を、全角 2 半角 1 で数える PHP の関数です。
- **`mb_strimwidth`**: 指定した幅で文字列を切り出す関数です。途中で切れても幅を超えないように切ります。
- **`strip_tags`**: HTML のタグを取り除く関数です。
- **`preg_replace`**: 正規表現で文字列を置き換える関数です。

## 何をしているか

### 1. 短ければ、そのまま返す

```php:line-numbers=773
        if (mb_strwidth($value, 'UTF-8') <= $limit) {
            return $value;
        }
```

`mb_strwidth` で幅を数え、上限 `$limit` 以下ならそのまま返します。ここで「文字数」ではなく「幅」を使っているのがポイントです。

### 2. 単語を気にしないときは、幅で切る

```php:line-numbers=777
        if (! $preserveWords) {
            return rtrim(mb_strimwidth($value, 0, $limit, '', 'UTF-8')).$end;
        }
```

`$preserveWords` が偽のときは、`mb_strimwidth($value, 0, $limit, '', 'UTF-8')` で幅に収めて切ります。切った後ろの空白は `rtrim` で取り除き、`$end`（既定値は `...`）を付けます。

### 3. 単語の途中で切らないときは、区切りを探す

```php:line-numbers=781
        $value = trim(preg_replace('/[\n\r]+/', ' ', strip_tags($value)));

        $trimmed = rtrim(mb_strimwidth($value, 0, $limit, '', 'UTF-8'));

        if (mb_substr($value, $limit, 1, 'UTF-8') === ' ') {
            return $trimmed.$end;
        }

        return preg_replace("/(.*)\s.*/", '$1', $trimmed).$end;
```

HTML のタグを取り除き、改行を空白にします。幅で切った結果を `$trimmed` に入れ、切った位置の次の文字が空白なら、そこは単語の区切りなのでそのまま使います。違う場合は、`preg_replace("/(.*)\s.*/", '$1', $trimmed)` で、最後の空白より前だけを残します。

具体例として、`Laravel は楽しい` を幅 10 で切ると、`Laravel は` までがちょうど入ります。切った位置の次の文字は空白ではないので、最後の空白より前の `Laravel` だけを残し、結果は `Laravel...` になります。

## ここがすごい

### 文字数ではなく幅で判定している

日本語の文字は、英字の 2 倍の幅で表示されることがよくあります。`strlen` や `mb_strlen` で数えると、画面の見た目とずれてしまいます。`mb_strwidth` を使うことで、実際の表示幅で判定できます。

### 単語の途中で切らない処理を、後付けにしている

単語の途中で切れると、読みにくくなります。この関数は、まず幅で切ってから、区切りの位置を見直す方法を取っています。切り方を 2 段階にすることで、通常の切り方を単純に保ったまま、オプションで読みやすさを選べます。

### オプションの値を、そのまま既定値にしている

`$end = '...'` や `$preserveWords = false` は、引数の既定値です。何も指定しなくても使えますし、必要な場合だけ変えられます。

## まとめ

- 表示の長さは文字数ではなく幅で数えると、日本語でも見た目が合う。
- 途中で切るかどうかは、オプションで選べるようにすると便利。
- 切った位置が区切りかどうかを確かめてから、単語を残すと読みやすくなる。
- 正規表現で最後の区切りまで戻る書き方は、短い処理で目的を果たせる。
