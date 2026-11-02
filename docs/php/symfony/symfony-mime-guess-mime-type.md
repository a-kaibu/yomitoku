---
title: "判定の方法を順番に試して、ファイルの種類を推測する"
description: "Symfony の MimeTypes::guessMimeType は、ファイルの MIME タイプ（種類）を、いくつもの判定方法を順番に試して推測します。使えない方法は飛ばし、最初に答えが出たところで止まります。"
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/Mime/MimeTypes.php
lines: [116, 133]
function: MimeTypes::guessMimeType
difficulty: 2
format: 2
tags: [設計パターン, API設計, イテレータ]
---

## ひとことで

`guessMimeType` は、ファイルのパスから **MIME タイプ**（`image/png` のようなファイルの種類の名前）を推測します。判定の方法は 1 つではなく、複数の「推測役」を順番に試して、答えが出た時点で結果を返します。

## コード

```php:line-numbers=116
    public function guessMimeType(string $path): ?string
    {
        foreach ($this->guessers as $guesser) {
            if (!$guesser->isGuesserSupported()) {
                continue;
            }

            if (null !== $mimeType = $guesser->guessMimeType($path)) {
                return $mimeType;
            }
        }

        if (!$this->isGuesserSupported()) {
            throw new LogicException('Unable to guess the MIME type as no guessers are available (have you enabled the php_fileinfo extension?).');
        }

        return null;
    }
```

## 前提知識

- **MIME タイプ**: ファイルの種類を `text/html` や `image/png` のように表す名前です。Web サーバーが `Content-Type` で返すときなどに使われます。
- **推測役（ガッサー）**: 1 つの判定方法を担当するオブジェクトです。ここでは `guessers` という一覧に入っています。
- **`isGuesserSupported`**: その推測役が、今の環境で使えるかを答えるメソッドです。
- **`LogicException`**: プログラムの使い方が間違っているときに投げる例外です。
- **`null` 合体の代入 `!== ... = ...`**: 代入の結果を、そのまま `if` の条件に使う書き方です。

## 何をしているか

### 1. 使える推測役を、順番に試す

```php:line-numbers=118
        foreach ($this->guessers as $guesser) {
            if (!$guesser->isGuesserSupported()) {
                continue;
            }
```

`$this->guessers` の中の推測役を、1 つずつ見ていきます。`isGuesserSupported` が偽なら、その推測役は今の環境で使えないので、次に進みます。

### 2. 答えが出たら、すぐに返す

```php:line-numbers=123
            if (null !== $mimeType = $guesser->guessMimeType($path)) {
                return $mimeType;
            }
```

推測役の `guessMimeType($path)` が `null` 以外を返したら、そのまま関数の結果として返します。ここで処理は終わり、以降の推測役は試しません。

### 3. どれも答えが出ないときは、環境を確かめる

```php:line-numbers=128
        if (!$this->isGuesserSupported()) {
            throw new LogicException('Unable to guess the MIME type as no guessers are available (have you enabled the php_fileinfo extension?).');
        }

        return null;
```

すべての推測役が `null` を返した場合、使える推測役が 1 つもなかったかどうかを確かめます。1 つもなければ、PHP の `fileinfo` 拡張が無効になっていることが考えられるので、例外で知らせます。使える推測役はあったが答えが出なかったときは、`null` を返します。

具体例として、拡張子の判定しかできない推測役（拡張子が `.png` なら `image/png`）が一覧の先頭にあれば、`photo.png` はそこで答えが出て、後ろの推測役は呼ばれません。

## ここがすごい

### 判定方法を「差し替え可能な部品」として並べている

ファイルの種類を調べる方法は、環境によって使えるものが違います。この関数は、判定方法をオブジェクトとして一覧にまとめ、順番に試すだけにしています。新しい方法を増やすときも、一覧に 1 つ足すだけで済みます。

### 使えない方法は、結果を出す前に飛ばす

```php:line-numbers=119
            if (!$guesser->isGuesserSupported()) {
                continue;
            }
```

`isGuesserSupported` で、使えない推測役を事前に省いています。使えない方法を実行して失敗するより、確実に安全です。

### 「答えが出ない」と「環境が足りない」を区別している

判定に失敗したときに、単に `null` を返すだけでは、原因がわかりません。推測役が 1 つもないときだけ例外にすることで、設定の問題を早く見つけられるようにしています。

## まとめ

- 判定方法が複数あるときは、部品として一覧にして順番に試すと拡張しやすい。
- 使えない部品は、実行する前に確かめて飛ばすと安全。
- 答えが出た時点で止めると、無駄な判定を省ける。
- 「答えがない」と「設定が足りない」は、例外で区別すると原因がわかりやすい。
