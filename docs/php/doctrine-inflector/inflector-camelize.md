---
title: 先頭だけ小文字にして、lowerCamelCaseを作る
description: Doctrine Inflector の camelize は、classify で作ったクラス名の先頭だけを小文字にします。user_profile から userProfile を作る、2 つの関数をつなぐ小さな例です。
language: php
project: Doctrine Inflector
repo: https://github.com/doctrine/inflector
license: MIT
copyright: Copyright (c) 2006-2015 Doctrine Project
commit: "4525be0a5b5650c00c6c866d8621a6ee1589eb48"
file: src/Inflector.php
lines: [261, 264]
function: Inflector::camelize
difficulty: 1
format: 2
tags: [文字列処理, イディオム, API設計]
---
## ひとことで

`camelize` は、区切りのある単語を、先頭だけが小文字のキャメルケース（`userProfile`）に変える関数です。JavaScript の変数名や、JSON のキーのように、先頭を小文字にする書き方が多い場面で使われます。

## コード

```php:line-numbers=261
    public function camelize(string $word): string
    {
        return lcfirst($this->classify($word));
    }
```

## 前提知識

- **キャメルケース**: 単語をつなげて、2 つめ以降の単語の先頭を大文字にする書き方です。先頭だけを大文字にするものを `UpperCamelCase`（パスカルケース）、小文字にするものを `lowerCamelCase` と呼びます。
- **`lcfirst`**: 文字列の先頭 1 文字だけを小文字にする PHP の関数です。`lcfirst('UserProfile')` は `userProfile` を返します。
- **`$this->classify`**: 同じクラスの別のメソッドを呼ぶ書き方です。`$this` は、今のオブジェクト自身を指します。
- **メソッドの委譲**: 1 つのメソッドが、別のメソッドの結果を加工して返すことです。ここでは `classify` の結果を使います。

## 何をしているか

### 1. 先に UpperCamelCase を作る

```php:line-numbers=263
        return lcfirst($this->classify($word));
```

内側の `$this->classify($word)` が先に動きます。`user_profile` は `UserProfile` になります。区切りが消え、各単語の先頭だけが大文字になっています。

### 2. 先頭 1 文字だけを小文字にする

同じ行の `lcfirst(...)` が、結果の先頭 1 文字を小文字にします。`UserProfile` は `userProfile` になります。2 つめの単語の `P` は大文字のまま残るので、キャメルケースの形は保たれます。

`lcfirst` は先頭の 1 文字だけを変えるので、単語全体を小文字にする `strtolower` とは違います。

### 3. 2 つの関数の役割分担

`classify` は「区切りを消して単語の先頭を大文字にする」という仕事を担当します。`camelize` は、その結果に「先頭だけ小文字にする」という仕事を足します。1 つずつの仕事が小さいので、別の場面でも組み合わせて使えます。

## ここがすごい

- **短い関数を重ねる**: 2 つの処理を 1 つの巨大な関数にせず、既存の `classify` を再利用しています。修正が必要になったときも、1 か所で済みます。
- **違いが 1 文字だけ**: `classify` と `camelize` の差は、先頭の大文字を小文字にするかどうかだけです。その差を `lcfirst` 1 回で表しています。
- **元の単語を崩さない**: 先頭以外の大文字は、そのまま残ります。`HTTPServer` のような頭字語を含む場合も、先頭の `H` だけが小文字になります。
- **呼ぶ側が形を選べる**: 同じ入力から `classify` と `camelize` のどちらも使えるので、クラス名と変数名で使い分けられます。

## まとめ

- lowerCamelCase は、UpperCamelCase の先頭 1 文字を小文字にすると作れる。
- `lcfirst` は先頭の 1 文字だけを変えるので、2 つめ以降の単語の形は保たれる。
- 既存の関数を呼び出して加工すると、重複を避けられる。
- 2 つの関数の役割を分けると、別の場面にも組み合わせて使える。
