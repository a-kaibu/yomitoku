---
title: 「3 items」「No worries」のように、数と単位を自然な英語にする
description: boltons.strutils.unit_len は、イテラブルの要素数を、単語の複数形に合わせた英語の説明文にする。0 件のときは「No ...」と書く。cardinalize で単数形と複数形を選んでいる。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [126, 142]
function: unit_len
difficulty: 1
format: 2
tags: [文字列処理, 可読性]
---

## ひとことで

`unit_len(sized_iterable, unit_noun)` は、**要素数と単位の名前を、英語として自然な 1 つの文にする** 関数です。
`unit_len(range(10), 'number')` は `'10 numbers'` を返します。要素が 0 個なら `'No worries'` のように、「No」で始まる文になります。

## コード

::: code-group

```python:line-numbers=126 [日本語訳]
def unit_len(sized_iterable, unit_noun='item'):  # TODO: len_units() や unitize() を検討する
    """イテラブルの len() を、英語の読みやすい説明文にする。
    :func:`len()`, conditionally pluralized with :func:`cardinalize`,
    detailed below.

    >>> print(unit_len(range(10), 'number'))
    10 numbers
    >>> print(unit_len('aeiou', 'vowel'))
    5 vowels
    >>> print(unit_len([], 'worry'))
    No worries
    """
    count = len(sized_iterable)
    units = cardinalize(unit_noun, count)
    if count:
        return f'{count} {units}'
    return f'No {units}'
```

```python:line-numbers=126 [原文]
def unit_len(sized_iterable, unit_noun='item'):  # TODO: len_units()/unitize()?
    """Returns a plain-English description of an iterable's
    :func:`len()`, conditionally pluralized with :func:`cardinalize`,
    detailed below.

    >>> print(unit_len(range(10), 'number'))
    10 numbers
    >>> print(unit_len('aeiou', 'vowel'))
    5 vowels
    >>> print(unit_len([], 'worry'))
    No worries
    """
    count = len(sized_iterable)
    units = cardinalize(unit_noun, count)
    if count:
        return f'{count} {units}'
    return f'No {units}'
```

:::

`cardinalize` は、数に合わせて単位の名前を単数形か複数形にする関数です。同じファイルにあります。

## 前提知識

- **`len()`**: 要素の数を返します。`len` が使えるものだけを受け取ります。
- **単数形と複数形**: 数が 1 なら `item`、それ以外なら `items` のように、単語の形が変わります。
- **英語の数え方**: 0 件は `No items` と言うのが自然です。`0 items` より読みやすいからです。

## 何をしているか

### 1. 要素数と単位を用意する

```python:line-numbers=138
    count = len(sized_iterable)
    units = cardinalize(unit_noun, count)
```

`len` で要素数を数え、`cardinalize` でその数に合った単位の形を決めます。

### 2. 0 件でなければ、数と単位をつなぐ

```python:line-numbers=140
    if count:
        return f'{count} {units}'
```

要素が 1 つ以上なら、`'10 numbers'` のように、数と単位を空白でつなぎます。

### 3. 0 件なら「No」で始める

```python:line-numbers=142
    return f'No {units}'
```

要素が 0 件なら、`'No worries'` のように、`No` と単位をつなぎます。

## ここがすごい

### 単数形と複数形を自動で決める

数が 1 なら単数、それ以外なら複数になるように、単位の形を `cardinalize` に任せています。呼ぶ側は、単語の形を気にしなくてよくなります。

### 0 件の表現を特別扱いする

「0 items」と書くより、「No items」のほうが自然です。`if count:` で、0 件の場合だけ文の形を変えています。

### 数の表示を 1 行で

`f'{count} {units}'` で、数と単位を空白でつなぐ処理が 1 行です。表示のための細かい決まりを、関数の中にまとめています。

## まとめ

- 数と単位の表示は、単数形と複数形を自動で選ぶと自然な文になる。
- 0 件のときは、「No」で始める書き方を使うと読みやすい。
- 表示の決まりを 1 つの関数にまとめると、どこでも同じ表現を使える。
