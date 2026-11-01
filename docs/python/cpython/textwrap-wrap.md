---
title: テキストを幅で折り返して、行のリストとして受け取る
description: textwrap.wrap は、1 段落のテキストを指定した幅に収まるように折り返し、行のリストを返す。タブは空白に変換され、改行も空白として扱われる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/textwrap.py
lines: [373, 384]
function: wrap
difficulty: 1
format: 2
tags: [文字列処理, 標準ライブラリ, 可読性]
---

## ひとことで

`wrap(text, width=70)` は、**1 段落の文章を、指定した幅に収まるように折り返し**、行を並べたリストで返す関数です。
`wrap('Python is nice', width=8)` は `['Python', 'is nice']` を返します。

## コード

::: code-group

```python:line-numbers=373 [日本語訳]
def wrap(text, width=70, **kwargs):
    """テキストの 1 段落を折り返し、折り返した行のリストを返す。

    Reformat the single paragraph in 'text' so it fits in lines of no
    more than 'width' columns, and return a list of wrapped lines.  By
    default, tabs in 'text' are expanded with string.expandtabs(), and
    all other whitespace characters (including newline) are converted to
    space.  See TextWrapper class for available keyword args to customize
    wrapping behaviour.
    """
    w = TextWrapper(width=width, **kwargs)
    return w.wrap(text)
```

```python:line-numbers=373 [原文]
def wrap(text, width=70, **kwargs):
    """Wrap a single paragraph of text, returning a list of wrapped lines.

    Reformat the single paragraph in 'text' so it fits in lines of no
    more than 'width' columns, and return a list of wrapped lines.  By
    default, tabs in 'text' are expanded with string.expandtabs(), and
    all other whitespace characters (including newline) are converted to
    space.  See TextWrapper class for available keyword args to customize
    wrapping behaviour.
    """
    w = TextWrapper(width=width, **kwargs)
    return w.wrap(text)
```

:::

`TextWrapper` は、折り返しの設定と処理を持つクラスです。この関数は、そのクラスを 1 回作って使うだけの薄いラッパーです。

## 前提知識

- **幅（width）**: 1 行に入れる最大の文字数です。既定値は 70 です。
- **段落**: 空行で区切られた、まとまった文章のことです。`wrap` は、改行を空白と同じように扱い、1 つの段落として整形します。
- **`**kwargs`**: 名前付きの引数をまとめて受け取り、そのまま `TextWrapper` に渡します。インデントや省略記号などの設定に使います。
- **リストとして返す**: 折り返した各行が、リストの 1 要素になります。

## 何をしているか

### 1. 折り返しの設定を作る

```python:line-numbers=383
    w = TextWrapper(width=width, **kwargs)
```

`width` と、残りの設定（`**kwargs`）を使って `TextWrapper` を作ります。

### 2. 折り返して、行のリストを返す

```python:line-numbers=384
    return w.wrap(text)
```

`TextWrapper.wrap` が、テキストを行のリストにして返します。

## ここがすごい

### 関数は、クラスを呼ぶだけ

折り返しの仕事は、すべて `TextWrapper` が持っています。関数の本体は 2 行だけで、よく使う場合の簡単な入口になっています。細かい設定が必要なら、クラスを直接使えます。

### 設定を引数の形で通す

`**kwargs` を使うことで、この関数自体は引数の種類を増やさなくて済みます。`initial_indent` のような設定は、そのまま `TextWrapper` に届きます。

### 文字列ではなくリストを返す

`fill` は、行を改行でつないだ 1 つの文字列を返します。`wrap` はリストなので、行ごとに処理したいとき、例えば先頭に番号を付けるときに便利です。

## まとめ

- 文章を幅で折り返すなら、`wrap` が行のリストを返してくれる。
- 薄い入口の関数は、細かい設定を内部のクラスに任せると簡単に保てる。
- 行ごとに処理したいときは、文字列より、リストのほうが扱いやすい。
