---
title: 文章の中の #タグ だけを、URL の #アンカーと区別して拾う
description: boltons の find_hashtags は、文字列からハッシュタグを探して、# を除いた名前のリストを返す。正規表現で、空白の後の # だけを対象にするので、URL の末尾にある #アンカーは拾わない。全角の＃にも対応している。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [325, 339]
function: find_hashtags
difficulty: 2
format: 2
tags: [文字列処理, 正規表現, 標準ライブラリ]
---

## ひとことで

`find_hashtags(string)` は、**文字列の中にある `#タグ` を探して、`#` を除いた名前のリスト** を返す関数です。
`find_hashtags('#atag http://asite/#ananchor')` は `['atag']` を返します。URL の中の `#ananchor` は、タグとして扱いません。

## コード

::: code-group

```python:line-numbers=325 [日本語訳]
def find_hashtags(string):
    """文字列の中のハッシュタグを、# 記号を除いてすべて見つけて返す。
    記号は除く。アジアの言語で使う全角の＃にも対応し、
    URL の #アンカーを誤って拾わない。

    >>> find_hashtags('#atag http://asite/#ananchor')
    ['atag']

    ``find_hashtags`` は、Unicode のハッシュタグにも使える。
    """

    # 次の例は動くが、doctest はこの書き方を扱いにくい
    # >>> find_hashtags(u"can't get enough of that dignity chicken #肯德基 woo")
    # [u'\u80af\u5fb7\u57fa']
    return HASHTAG_RE.findall(string)
```

```python:line-numbers=325 [原文]
def find_hashtags(string):
    """Finds and returns all hashtags in a string, with the hashmark
    removed. Supports full-width hashmarks for Asian languages and
    does not false-positive on URL anchors.

    >>> find_hashtags('#atag http://asite/#ananchor')
    ['atag']

    ``find_hashtags`` also works with unicode hashtags.
    """

    # the following works, doctest just struggles with it
    # >>> find_hashtags(u"can't get enough of that dignity chicken #肯德基 woo")
    # [u'\u80af\u5fb7\u57fa']
    return HASHTAG_RE.findall(string)
```

:::

## 前提知識

- **ハッシュタグ**: 文章の中で `#` の後に単語を付けて、話題を表す印です。SNS でよく使われます。
- **URL のアンカー**: ページ内の場所を指す `#` の部分です。`http://asite/#ananchor` の `#ananchor` がそれにあたります。
- **正規表現**: 文字の並びの規則を、記号で書いたものです。
- **全角の＃**: 日本語などで使われる、幅の広い `#` の記号です。

## 何をしているか

### 1. 正規表現の定義を確かめる

```python:line-numbers=322
HASHTAG_RE = re.compile(r"(?:^|\s)[＃#]{1}(\w+)", re.UNICODE)
```

`HASHTAG_RE` は、ハッシュタグの形を表す正規表現です。`(?:^|\s)` で、文字列の先頭か空白の直後であることを求めます。そのあとに `#` か `＃` があり、`(\w+)` で単語の部分を取ります。

### 2. 検索して、名前のリストを返す

```python:line-numbers=339
    return HASHTAG_RE.findall(string)
```

`findall` は、正規表現に合う部分すべてを探して、括弧の中身だけを返します。`#` は含まれないので、名前だけがリストになります。

## ここがすごい

### 空白の後ろだけを対象にする

正規表現の `(?:^|\s)` は、`#` の前が文字列の先頭か空白であることを求めます。`asite/#ananchor` の `#` は直前が `/` なので、タグとして拾われません。URL の中の `#` を、正規表現だけで区別しています。

### 全角の＃にも対応する

`[＃#]` と書いて、半角と全角の両方を 1 つの文字の集合で受け取ります。日本語の文章でも、同じ関数で探せます。

### 括弧で必要な部分だけを取る

`(\w+)` の括弧で、名前の部分だけを取り出します。`#` を後から取り除く処理が要らないので、関数が短くなります。

## まとめ

- 正規表現で、ハッシュタグの前の文字まで条件に入れると、URL の `#` を除ける。
- 全角と半角の記号は、1 つの文字の集合にまとめて書ける。
- 括弧で取り出す部分を決めると、後から加工しなくても名前だけが手に入る。
