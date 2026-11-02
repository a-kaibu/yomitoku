---
title: 大文字の前に_を入れて、テーブル名の形にする
description: Doctrine Inflector の tableize は、UserProfile のようなクラス名を、データベースのテーブル名 user_profile の形に変えます。単語の境目の大文字だけを見つけて、_ を挟むのが要点です。
language: php
project: Doctrine Inflector
repo: https://github.com/doctrine/inflector
license: MIT
copyright: Copyright (c) 2006-2015 Doctrine Project
commit: "4525be0a5b5650c00c6c866d8621a6ee1589eb48"
file: src/Inflector.php
lines: [236, 248]
function: Inflector::tableize
difficulty: 2
format: 2
tags: [文字列処理, 正規表現, Unicode]
---
## ひとことで

`tableize` は、キャメルケース（`UserProfile`）で書かれた単語を、小文字と `_` で区切った形（`user_profile`）に変える関数です。Doctrine という ORM（データベースとプログラムをつなぐ仕組み）が、クラス名からテーブル名を決めるときに使います。

## コード

```php:line-numbers=236
    public function tableize(string $word): string
    {
        $tableized = preg_replace('~(?<=\\w)([A-Z])~u', '_$1', $word);

        if ($tableized === null) {
            throw new RuntimeException(sprintf(
                'preg_replace returned null for value "%s"',
                $word
            ));
        }

        return mb_strtolower($tableized);
    }
```

## 前提知識

- **キャメルケース**: 単語の先頭を大文字にして、つなげて書く書き方です。`UserProfile` のように、単語の境目が大文字で分かります。
- **正規表現**: 文字の並びの決まりを、記号で書いた式です。`preg_replace` は、その式に合う部分を別の文字に置き換えます。
- **`(?<=\\w)`（後読み）**: 「直前が単語の文字（英数字など）である」という条件を表す、長さ 0 の印です。その位置の文字は置き換えの対象にはなりません。
- **`'_$1'`**: 置き換え後の文字列です。`$1` は、括弧 `()` で囲んだ部分（ここでは大文字 1 文字）を指します。
- **`u` の修飾子**: 正規表現を UTF-8 として扱う指定です。
- **`mb_strtolower`**: マルチバイト文字に対応した小文字化の関数です。

## 何をしているか

### 1. 単語の境目に `_` を挟む

```php:line-numbers=238
        $tableized = preg_replace('~(?<=\\w)([A-Z])~u', '_$1', $word);
```

この 1 行が中心です。`[A-Z]` は大文字 1 文字に合います。ただし、直前が単語の文字（`(?<=\w)`）である大文字だけに合わせます。

`UserProfile` を例にすると、`U` は先頭なので直前に文字がありません。そこでは置き換えられません。`P` は直前が `r` なので、`_P` に置き換えられます。結果は `User_Profile` です。

先頭の大文字を除外しているので、先頭に余計な `_` が付きません。`~` は正規表現の区切り記号で、中の `/` と衝突しないように選ばれています。

### 2. 置き換えに失敗したら例外にする

```php:line-numbers=240
        if ($tableized === null) {
            throw new RuntimeException(sprintf(
                'preg_replace returned null for value "%s"',
                $word
            ));
        }
```

`preg_replace` は、正規表現の処理でエラーがあると `null` を返します。この関数は、そのとき黙って `null` を返さず、どの値で失敗したかが分かる例外を投げます。

### 3. 小文字にして返す

```php:line-numbers=247
        return mb_strtolower($tableized);
```

`User_Profile` を全部小文字にして、`user_profile` を返します。`mb_strtolower` を使うので、日本語などの文字が混ざっていても、英字の大文字だけが変わります。

## ここがすごい

- **先頭の大文字を見逃す設計**: 境目の判定を「直前に文字がある大文字」にしたので、`UserProfile` の先頭の `U` で `_` が付くのを防いでいます。素朴な `[A-Z]` だけの置き換えでは、`_user_profile` になってしまいます。
- **後読みで位置を指定する**: 置き換える文字 `[A-Z]` 自体は消さずに、その前の条件だけを確かめています。正規表現の中で「条件だけを見る」書き方は、このような場面で役立ちます。
- **失敗を隠さない**: `preg_replace` が `null` を返したら、例外にして知らせます。テーブル名が空になって、別のテーブルを壊すような事故を防ぎます。
- **区切り文字の選び方**: 正規表現の区切りに `~` を使うと、パターンの中の `/` を書く必要がありません。読みやすさへの小さな配慮です。

## まとめ

- キャメルケースの単語の境目は、「直前が文字である大文字」で見つけられる。
- 後読み `(?<=...)` を使うと、置き換えの対象と条件を分けて書ける。
- 置き換えの失敗は、例外で明示的に知らせる。
- 最後に小文字にすると、テーブル名の規約に合う形になる。
