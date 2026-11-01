---
title: 文字を ASCII に寄せて、バイト列に変換する
description: boltons の asciify は、文字列を ASCII だけのバイト列に変換する。そのまま変換できないときは、アクセント記号を外す処理を通してから、残りを置き換えるか無視する。スラッグ化など、英数字だけの文字列が必要な場面に使う。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [417, 442]
function: asciify
difficulty: 3
format: 2
tags: [文字列処理, 防御的プログラミング]
---

## ひとことで

`asciify(text, ignore=False)` は、**文字列を ASCII の文字だけからなるバイト列に変換する** 関数です。
`asciify('Beyoncé') == b'Beyonce'` です。`é` のようなアクセント記号は、基本的な文字に置き換えられます。

## コード

::: code-group

```python:line-numbers=417 [日本語訳]
def asciify(text, ignore=False):
    """文字列 *text* を、ASCII の文字だけからなるバイト列に変換する。
    ASCII の文字だけにする。アクセント記号を外す基本的な処理も行う。
    ヨーロッパ好きの人のために。

    また、これは主に **ユーティリティ** で、主にスラッグ化のためのものである。
    可能な限り、アプリケーションは Unicode に対応させるのがよい。
    **Unicode と一緒に** 動かすべきで、逆らってはいけない。

    引数:
        text (str): ASCII に変換する文字列。
        ignore (bool): 変換できなかった残りの文字を、
            置き換える代わりに無視するかどうか。既定値は置き換え。

    >>> asciify('Beyoncé') == b'Beyonce'
    True
    """
    try:
        return text.encode('ascii')
    except UnicodeEncodeError:
        mode = 'replace'
        if ignore:
            mode = 'ignore'
        transd = unicodedata.normalize('NFKD', text.translate(DEACCENT_MAP))
        ret = transd.encode('ascii', mode)
        return ret
```

```python:line-numbers=417 [原文]
def asciify(text, ignore=False):
    """Converts a string, *text*, into a bytestring with
    just ascii characters. Performs basic deaccenting for all you
    Europhiles out there.

    Also, a gentle reminder that this is a **utility**, primarily meant
    for slugification. Whenever possible, make your application work
    **with** unicode, not against it.

    Args:
        text (str): The string to be asciified.
        ignore (bool): Configures final encoding to ignore remaining
            unasciified string instead of replacing it.

    >>> asciify('Beyoncé') == b'Beyonce'
    True
    """
    try:
        return text.encode('ascii')
    except UnicodeEncodeError:
        mode = 'replace'
        if ignore:
            mode = 'ignore'
        transd = unicodedata.normalize('NFKD', text.translate(DEACCENT_MAP))
        ret = transd.encode('ascii', mode)
        return ret
```

:::

## 前提知識

- **ASCII**: 英数字や基本的な記号の、128 文字の文字集合です。
- **バイト列（bytes）**: 文字を、バイトの並びとして表したものです。`b'...'` のように書きます。
- **Unicode の正規化（NFKD）**: 1 つの文字を、基本の文字と記号に分けて表す方法です。`é` は `e` と結合記号に分けられます。
- **`encode`**: 文字列を、指定した文字コードのバイト列に変換するメソッドです。

## 何をしているか

### 1. まずは、そのまま ASCII に変換を試す

```python:line-numbers=434
    try:
        return text.encode('ascii')
```

`text.encode('ascii')` で変換できれば、その結果をそのまま返します。ASCII だけの文字列なら、ここで終わります。

### 2. 失敗したときの処理を決める

```python:line-numbers=436
    except UnicodeEncodeError:
        mode = 'replace'
        if ignore:
            mode = 'ignore'
```

ASCII に変換できない文字があると、例外が出ます。例外を受け取って、残りの文字をどう扱うかを決めます。`ignore` が真なら無視し、そうでなければ置き換えます。

### 3. アクセント記号を外してから変換する

```python:line-numbers=440
        transd = unicodedata.normalize('NFKD', text.translate(DEACCENT_MAP))
        ret = transd.encode('ascii', mode)
        return ret
```

`DEACCENT_MAP` で、よく使われる文字を基本の文字に寄せてから、NFKD で文字を分解します。分解した後の ASCII にできない部分だけが、置き換えか無視の対象になります。

## ここがすごい

### 変換できるものは、できるだけ残す

いきなり捨てるのではなく、アクセント記号を外すことで、`é` を `e` のように残せます。スラッグ化の結果が、読める形になります。

### 変換の方法を引数で選べる

置き換えか無視かを `ignore` で選べます。記号を残したくないときは無視、目印を残したいときは置き換えを選びます。

### 作者の注意書きが、考え方を示す

docstring には、これは主に スラッグ化のための道具で、可能な限りは Unicode のまま扱うべきだ、という注意があります。便利な道具ですが、情報を捨てる変換だと理解して使うことが大切です。

## まとめ

- 変換できる文字はそのまま、できない文字は例外を受けて扱いを決める。
- アクセント記号を外してから変換すると、読める形を残せる。
- 情報を捨てる変換なので、使う場面を限定して考えるとよい。
