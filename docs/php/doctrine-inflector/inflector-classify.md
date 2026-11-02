---
title: 区切り文字を取り除いて、クラス名の形にする
description: Doctrine Inflector の classify は、user_profile や user-profile のような単語を、クラス名 UserProfile の形に変えます。区切りを大文字にしてから、区切り文字を消すという 2 段階の処理です。
language: php
project: Doctrine Inflector
repo: https://github.com/doctrine/inflector
license: MIT
copyright: Copyright (c) 2006-2015 Doctrine Project
commit: "4525be0a5b5650c00c6c866d8621a6ee1589eb48"
file: src/Inflector.php
lines: [253, 256]
function: Inflector::classify
difficulty: 1
format: 2
tags: [文字列処理, イディオム, API設計]
---
## ひとことで

`classify` は、テーブル名のような `_` や `-` や空白で区切られた単語を、クラス名として使える形に変える関数です。`user_profile` を `UserProfile` にします。区切りの後ろを大文字にし、区切り文字を消すことで、キャメルケースを作ります。

## コード

```php:line-numbers=253
    public function classify(string $word): string
    {
        return str_replace([' ', '_', '-'], '', ucwords($word, ' _-'));
    }
```

## 前提知識

- **`ucwords`**: 文字列の中の各単語の先頭文字を大文字にする PHP の関数です。第 2 引数で、単語の区切りに使う文字を指定できます。
- **`str_replace`**: 文字列の中の部分を、別の文字列に置き換える関数です。第 1 引数に配列を渡すと、複数の文字を一度に置き換えられます。
- **配列の書き方 `[' ', '_', '-']`**: 複数の値をまとめて入れる箱です。PHP では角括弧 `[]` で作ります。
- **区切り文字**: 単語を分ける目印です。この関数では空白、`_`、`-` の 3 種類を扱います。
- **引数の順番**: `str_replace(検索, 置換, 対象)` の順番で値を渡すのが PHP の決まりです。

## 何をしているか

### 1. 区切りの後ろの文字を大文字にする

```php:line-numbers=255
        return str_replace([' ', '_', '-'], '', ucwords($word, ' _-'));
```

処理は内側から外へ動きます。まず `ucwords($word, ' _-')` が呼ばれます。第 2 引数の `' _-'` は、「空白、`_`、`-` の直後を単語の先頭とみなす」という指定です。

たとえば `user_profile` を渡すと、`_` の直後の `p` が大文字になり、`User_Profile` になります。先頭の `u` も単語の先頭なので、大文字になります。

### 2. 区切り文字を消す

同じ行の `str_replace([' ', '_', '-'], '', ...)` は、空白、`_`、`-` のすべてを空の文字列に置き換えます。`User_Profile` は `UserProfile` になります。

区切り文字を 1 つずつ書くのではなく、配列でまとめて渡しているので、1 回の関数呼び出しで済みます。

### 3. 別の関数との関係

この関数は、結果を `camelize` が使います。`camelize` は、`classify` の結果の先頭だけを小文字にします。たとえば `user_profile` は `classify` で `UserProfile` になり、`camelize` で `userProfile` になります。

## ここがすごい

- **2 つの組み込み関数を組み合わせる**: 大文字化は `ucwords` の担当、区切りの削除は `str_replace` の担当です。役割を分けたので、それぞれの関数で意味が分かりやすくなっています。
- **区切りの指定を揃える**: `ucwords` の区切りと `str_replace` の区切りが、同じ 3 種類になっています。片方だけ増やすと、大文字にならない単語が残る、というずれを防げます。
- **1 行で書ける**: 単語を分解してつなぎ直す書き方もできますが、この関数は 1 行です。組み込み関数の性質を理解していれば、すぐ読めます。
- **名前が仕事を表す**: `classify` という名前で、クラス名に使えるようにする処理だと分かります。

## まとめ

- 区切り文字の後ろを大文字にしてから、区切りを消すと、キャメルケースになる。
- `ucwords` の第 2 引数で、単語の区切りを指定できる。
- `str_replace` は配列を渡すと、複数の文字を一度に消せる。
- 区切りの指定は、2 つの関数で揃えておくと安全。
