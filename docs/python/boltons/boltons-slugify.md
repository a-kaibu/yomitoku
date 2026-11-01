---
title: 句読点や空白を区切り文字に置き換えて、URL で使える文字列にする
description: boltons.strutils.slugify は、句読点や空白の多いテキストを、区切り文字（既定は _）でつないだ小文字の文字列に変える。ASCII だけにする指定もできる。ブログの記事 URL などを作るときに使う。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [89, 112]
function: slugify
difficulty: 2
format: 2
tags: [文字列処理, 可読性, 移植性]
---

## ひとことで

`slugify(text, delim='_')` は、**句読点や空白を区切り文字に置き換え、小文字の安全な文字列にする** 関数です。
`slugify('First post! Hi!!!!~1    ')` は `'first_post_hi_1'` を返します。URL の一部や、ファイル名に使いやすい形になります。

## コード

::: code-group

```python:line-numbers=89 [日本語訳]
def slugify(text, delim='_', lower=True, ascii=False):
    """
    句読点や空白などの「危ない文字」が多いテキストを、安全な文字列に変える簡単な関数で、
    (i.e., punctuation and whitespace), into a relatively safe
    lowercased string separated only by the delimiter specified
    by *delim*, which defaults to ``_``.

    The *ascii* convenience flag will :func:`asciify` the slug if
    you require ascii-only slugs.

    >>> slugify('First post! Hi!!!!~1    ')
    'first_post_hi_1'

    >>> slugify("Kurt Gödel's pretty cool.", ascii=True) == \
        b'kurt_goedel_s_pretty_cool'
    True

    """
    ret = delim.join(split_punct_ws(text)) or delim if text else ''
    if ascii:
        ret = asciify(ret)
    if lower:
        ret = ret.lower()
    return ret
```

```python:line-numbers=89 [原文]
def slugify(text, delim='_', lower=True, ascii=False):
    """
    A basic function that turns text full of scary characters
    (i.e., punctuation and whitespace), into a relatively safe
    lowercased string separated only by the delimiter specified
    by *delim*, which defaults to ``_``.

    The *ascii* convenience flag will :func:`asciify` the slug if
    you require ascii-only slugs.

    >>> slugify('First post! Hi!!!!~1    ')
    'first_post_hi_1'

    >>> slugify("Kurt Gödel's pretty cool.", ascii=True) == \
        b'kurt_goedel_s_pretty_cool'
    True

    """
    ret = delim.join(split_punct_ws(text)) or delim if text else ''
    if ascii:
        ret = asciify(ret)
    if lower:
        ret = ret.lower()
    return ret
```

:::

`split_punct_ws` は、句読点と空白を区切りとして、文字列を単語に分ける関数です。`asciify` は、アクセント記号などを取り除いて ASCII の文字だけにする関数です。

## 前提知識

- **スラッグ（slug）**: URL やファイル名に使うための、短く安全な文字列のことです。
- **区切り文字（delim）**: 単語どうしをつなぐ文字です。既定は `_` です。
- **`or` と `if` の優先順位**: `a or b if c else d` は、`(a or b) if c else d` と読まれます。
- **`ascii` フラグ**: 真なら、結果を ASCII だけの文字列にします。

## 何をしているか

### 1. 句読点と空白で分けて、区切り文字でつなぐ

```python:line-numbers=107
    ret = delim.join(split_punct_ws(text)) or delim if text else ''
```

`split_punct_ws(text)` で単語に分け、`delim` でつなぎます。文字列が空でなければ、結果が空になったとき（記号だけのときなど）は `delim` を返します。空の文字列なら、そのまま `''` です。

### 2. ASCII の指定があれば変換する

```python:line-numbers=108
    if ascii:
        ret = asciify(ret)
```

`ascii` が真なら、アクセント記号などを取り除いて ASCII の文字だけにします。

### 3. 小文字にする

```python:line-numbers=110
    if lower:
        ret = ret.lower()
```

`lower` が真なら、すべて小文字にします。最後に結果を返します。

## ここがすごい

### 危ない文字を 1 つの区切りに

句読点や空白の連続は、区切り文字 1 つにまとまります。`'Hi!!!!~1    '` のような乱れた入力でも、`hi_1` のように整った形になります。

### 変換の順番が決まっている

まず区切りでつなぎ、次に ASCII 化、最後に小文字化します。順番を入れ替えると、大文字の扱いなどで結果が変わるので、この順が大切です。

### 1 行の条件式に注意

`delim.join(...) or delim if text else ''` は、読みにくい書き方です。空の入力と、記号だけの入力を区別するための工夫が、この 1 行に詰まっています。

## まとめ

- 安全な文字列を作るには、記号と空白を区切り文字に置き換えるとよい。
- 変換の順番（区切り、ASCII 化、小文字化）が結果を決める。
- 条件式の優先順位を理解していないと、この 1 行は正しく読めない。
