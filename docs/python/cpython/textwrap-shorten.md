---
title: 空白をまとめてから、幅に収まるまで単語を残して省略する
description: textwrap.shorten は、テキストの空白を 1 つにまとめ、指定した幅に収まる範囲で単語を残し、残りを " [...]" で省略する。TextWrapper を 1 行だけの設定で使っている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/textwrap.py
lines: [398, 411]
function: shorten
difficulty: 2
format: 2
tags: [文字列処理, 標準ライブラリ]
---

## ひとことで

`shorten(text, width)` は、**長い文章を指定の幅に収まるように、単語単位で切り詰める** 関数です。
`shorten("Hello  world!", width=11)` は `'Hello [...]'` を返します。収まるなら、空白をまとめただけの文字列を返します。

## コード

::: code-group

```python:line-numbers=398 [日本語訳]
def shorten(text, width, **kwargs):
    """与えられた幅に収まるよう、テキストの空白をまとめて切り詰める。

    The text first has its whitespace collapsed.  If it then fits in
    the *width*, it is returned as is.  Otherwise, as many words
    as possible are joined and then the placeholder is appended::

        >>> textwrap.shorten("Hello  world!", width=12)
        'Hello world!'
        >>> textwrap.shorten("Hello  world!", width=11)
        'Hello [...]'
    """
    w = TextWrapper(width=width, max_lines=1, **kwargs)
    return w.fill(' '.join(text.strip().split()))
```

```python:line-numbers=398 [原文]
def shorten(text, width, **kwargs):
    """Collapse and truncate the given text to fit in the given width.

    The text first has its whitespace collapsed.  If it then fits in
    the *width*, it is returned as is.  Otherwise, as many words
    as possible are joined and then the placeholder is appended::

        >>> textwrap.shorten("Hello  world!", width=12)
        'Hello world!'
        >>> textwrap.shorten("Hello  world!", width=11)
        'Hello [...]'
    """
    w = TextWrapper(width=width, max_lines=1, **kwargs)
    return w.fill(' '.join(text.strip().split()))
```

:::

`TextWrapper` は、文章を折り返したり省略したりする仕事をするクラスです。同じファイルに定義されています。

## 前提知識

- **幅（width）**: 1 行に入れる最大の文字数です。
- **空白の正規化**: 連続する空白（スペースや改行）を 1 つのスペースにまとめることです。
- **`TextWrapper`**: 折り返しの設定（幅、最大行数、省略記号など）を持つクラスです。`fill` で文字列を整形します。
- **省略記号（placeholder）**: 切り詰めたことを示す文字列です。既定では `' [...]'` です。

## 何をしているか

### 1. 空白をまとめる

```python:line-numbers=411
    return w.fill(' '.join(text.strip().split()))
```

`split()` は、空白で分けて単語のリストを作ります。`' '.join` でそれを 1 つのスペースでつなぐと、空白が正規化されます。

### 2. 1 行に制限した `TextWrapper` で整形する

```python:line-numbers=410
    w = TextWrapper(width=width, max_lines=1, **kwargs)
    return w.fill(' '.join(text.strip().split()))
```

`max_lines=1` にすると、1 行に収まる範囲だけを残します。収まらない部分は、省略記号に置き換えられます。`fill` は、その結果を文字列で返します。

## ここがすごい

### 単語単位で切るので、途中で言葉が割れない

文字数で単純に切ると、単語の途中で切れてしまいます。`TextWrapper` は単語を単位に扱うので、残る部分は必ず完全な単語です。

### 折り返しの仕組みを 1 行の設定で流用

新しく切り詰めの仕組みを書かず、折り返しのクラスに「1 行まで」と指定するだけで済ませています。既存の部品を設定で使い分ける書き方です。

### 追加の設定を通せる

`**kwargs` で、`placeholder` などの設定をそのまま `TextWrapper` に渡せます。省略記号を変えたいときは、引数を足すだけで済みます。

## まとめ

- 空白の正規化は、`split` と `join` の組み合わせで 1 行にできる。
- 単語単位で切ると、読みやすい結果になる。
- 既存のクラスを、1 行の設定だけで別の用途に使える。
