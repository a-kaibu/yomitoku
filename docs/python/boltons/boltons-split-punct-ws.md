---
title: 句読点と空白で文字列を分け、空の部分を捨てる
description: boltons の split_punct_ws は、文字列を空白だけでなく句読点でも分ける。str.split より細かく単語を取り出せ、slugify の内部で使われる。分けた結果の空の文字列は、if で捨てる。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [115, 123]
function: split_punct_ws
difficulty: 1
format: 2
tags: [文字列処理, 正規表現]
---

## ひとことで

`split_punct_ws(text)` は、**文字列を句読点と空白の両方で区切って、単語のリストにする** 関数です。
`split_punct_ws('First post! Hi!!!!~1    ')` は `['First', 'post', 'Hi', '1']` を返します。`!` や `~` も、区切りとして扱われます。

## コード

::: code-group

```python:line-numbers=115 [日本語訳]
def split_punct_ws(text):
    """:meth:`str.split` は空白で分けるが、
    :func:`split_punct_ws` は、句読点と空白の両方で分ける。
    これは、上で定義した :func:`slugify` の内部で使われる。

    >>> split_punct_ws('First post! Hi!!!!~1    ')
    ['First', 'post', 'Hi', '1']
    """
    return [w for w in _punct_re.split(text) if w]
```

```python:line-numbers=115 [原文]
def split_punct_ws(text):
    """While :meth:`str.split` will split on whitespace,
    :func:`split_punct_ws` will split on punctuation and
    whitespace. This used internally by :func:`slugify`, above.

    >>> split_punct_ws('First post! Hi!!!!~1    ')
    ['First', 'post', 'Hi', '1']
    """
    return [w for w in _punct_re.split(text) if w]
```

:::

## 前提知識

- **`str.split`**: 空白で文字列を分けるメソッドです。句読点は区切りにしません。
- **句読点**: `!`、`?`、`,`、`~` などの、文の区切りに使う記号です。
- **正規表現による分割**: `re.split` は、正規表現に合う部分を区切りとして、文字列を分けます。
- **空の文字列**: 何も入っていない文字列です。区切りが続くと、間に空の部分ができます。

## 何をしているか

### 1. 句読点と空白で分ける

```python:line-numbers=123
    return [w for w in _punct_re.split(text) if w]
```

`_punct_re.split(text)` は、句読点や空白に合う部分を区切りにして、文字列をリストに分けます。`_punct_re` は、モジュールの中で定義された正規表現です。

このままでは、区切りが続いた場所に空の文字列が残ります。そこで、`if w` で中身のあるものだけを残しています。

## ここがすごい

### 区切りの種類を増やせる

`str.split` は空白だけで分けますが、この関数は句読点も区切りに含めます。`Hi!!!!~1` のように、記号が続いても、正しく単語が取れます。

### 空の部分を捨てる

区切りが連続すると、間に空の文字列が生まれます。内包表記の `if w` で、その空の要素を一度に取り除いています。

### 検索用の語を作る部品になる

`slugify` のように、文章から語を取り出して、URL などの形に変える処理の、最初の段階として使われています。部品ごとに役割を分けた作りです。

## まとめ

- 句読点と空白の両方を区切りにすると、`str.split` より細かく語を取れる。
- 区切りの連続が作る空の部分は、`if` で捨てる。
- 文字列を別の形に変える処理の、最初の段階として使える。
