---
title: 「internationalization」を「i18n」にする、中間の文字数を数字で置き換える
description: boltons.strutils.a10n は、長い単語の先頭と末尾の文字を残し、間の文字数を数字にして縮める。numeronym（数字語）と呼ばれる書き方を、1 行で作る関数。3 文字未満の単語はそのまま返す。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [342, 358]
function: a10n
difficulty: 1
format: 2
tags: [文字列処理, 可読性]
---

## ひとことで

`a10n(string)` は、**単語の先頭と末尾の文字を残し、間の文字数を数字に置き換える** 関数です。
`a10n('abbreviation')` は `'a10n'` を返し、`a10n('internationalization')` は `'i18n'` を返します。

## コード

::: code-group

```python:line-numbers=342 [日本語訳]
def a10n(string):
    """「internationalization」が「i18n」になるあの書き方。何と呼ぶのか。
    called? Abbreviation? Oh wait, no: ``a10n``. (It's actually a form
    of `numeronym`_.)

    >>> a10n('abbreviation')
    'a10n'
    >>> a10n('internationalization')
    'i18n'
    >>> a10n('')
    ''

    .. _numeronym: http://en.wikipedia.org/wiki/Numeronym
    """
    if len(string) < 3:
        return string
    return f'{string[0]}{len(string[1:-1])}{string[-1]}'
```

```python:line-numbers=342 [原文]
def a10n(string):
    """That thing where "internationalization" becomes "i18n", what's it
    called? Abbreviation? Oh wait, no: ``a10n``. (It's actually a form
    of `numeronym`_.)

    >>> a10n('abbreviation')
    'a10n'
    >>> a10n('internationalization')
    'i18n'
    >>> a10n('')
    ''

    .. _numeronym: http://en.wikipedia.org/wiki/Numeronym
    """
    if len(string) < 3:
        return string
    return f'{string[0]}{len(string[1:-1])}{string[-1]}'
```

:::

## 前提知識

- **numeronym（数字語）**: 長い英単語を、先頭の文字・間の文字数・末尾の文字で表す略し方です。`i18n` は `internationalization` の略です。
- **スライス `string[1:-1]`**: 先頭と末尾を除いた、真ん中の部分です。
- **`len()`**: 文字列の長さを返します。
- **短すぎる単語**: 3 文字未満では、先頭と末尾の間に文字がありません。

## 何をしているか

### 1. 短い単語はそのまま返す

```python:line-numbers=356
    if len(string) < 3:
        return string
```

長さが 3 未満なら、略す必要がないのでそのまま返します。空の文字列も、ここで `''` になります。

### 2. 先頭、間の文字数、末尾をつなぐ

```python:line-numbers=358
    return f'{string[0]}{len(string[1:-1])}{string[-1]}'
```

先頭の 1 文字、真ん中の文字数、末尾の 1 文字を、f 文字列でつなぎます。`internationalization` は、先頭の `i`、真ん中の 18 文字、末尾の `n` で `i18n` になります。

## ここがすごい

### 文字数を数字にするだけ

略し方のルールは「先頭、数、末尾」だけです。長い単語でも、3 つの部品を取り出して並べるだけで、同じ書き方になります。

### 短い単語を特別扱いする

3 文字未満の単語は、略すと意味がなくなります。`if` で先に返すことで、後ろの計算の範囲外の扱いを避けています。

### 略語の遊び心

関数の docstring には、「これは何と呼ぶのか」という問いかけが書かれています。小さなユーティリティにも、ユーモアを込める書き方があります。

## まとめ

- 長い単語の略し方は、先頭・文字数・末尾の 3 部品で表せる。
- 短すぎる入力は、略さずにそのまま返すと安全。
- スライスの範囲を決めると、先頭と末尾を簡単に除ける。
