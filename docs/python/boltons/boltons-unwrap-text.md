---
title: 折り返された段落を、1 行ずつ元の段落に戻す
description: boltons の unwrap_text は、textwrap.wrap で折り返された文章を、空行で区切られた段落ごとに 1 行へ戻す。行ごとに前後の空白を取り、空行を段落の区切りとして扱う。区切りの文字列を指定すると、段落をどうつなぐかも選べる。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [1273, 1301]
function: unwrap_text
difficulty: 2
format: 2
tags: [文字列処理, 可読性]
---

## ひとことで

`unwrap_text(text, ending='\n\n')` は、**途中で改行された文章を、段落ごとに 1 行へ戻す** 関数です。
`textwrap.wrap` で折り返した文章を、元の形に近い段落へ戻したいときに使えます。

## コード

::: code-group

```python:line-numbers=1273 [日本語訳]
def unwrap_text(text, ending='\n\n'):
    r"""
    文章を折り返す前の形に戻す。:func:`textwrap.wrap` の逆の処理にあたる。

    >>> text = "Short \n lines  \nwrapped\nsmall.\n\nAnother\nparagraph."
    >>> unwrap_text(text)
    'Short lines wrapped small.\n\nAnother paragraph.'

    引数:
       text: 戻す対象の文字列。
       ending (str): 戻した段落どうしをつなぐ文字列。
          ``None`` を渡すとリストで返す。既定値は '\n\n' で、
          Markdown や RST と互換性がある。

    """
    all_grafs = []
    cur_graf = []
    for line in text.splitlines():
        line = line.strip()
        if line:
            cur_graf.append(line)
        else:
            all_grafs.append(' '.join(cur_graf))
            cur_graf = []
    if cur_graf:
        all_grafs.append(' '.join(cur_graf))
    if ending is None:
        return all_grafs
    return ending.join(all_grafs)
```

```python:line-numbers=1273 [原文]
def unwrap_text(text, ending='\n\n'):
    r"""
    Unwrap text, the natural complement to :func:`textwrap.wrap`.

    >>> text = "Short \n lines  \nwrapped\nsmall.\n\nAnother\nparagraph."
    >>> unwrap_text(text)
    'Short lines wrapped small.\n\nAnother paragraph.'

    Args:
       text: A string to unwrap.
       ending (str): The string to join all unwrapped paragraphs
          by. Pass ``None`` to get the list. Defaults to '\n\n' for
          compatibility with Markdown and RST.

    """
    all_grafs = []
    cur_graf = []
    for line in text.splitlines():
        line = line.strip()
        if line:
            cur_graf.append(line)
        else:
            all_grafs.append(' '.join(cur_graf))
            cur_graf = []
    if cur_graf:
        all_grafs.append(' '.join(cur_graf))
    if ending is None:
        return all_grafs
    return ending.join(all_grafs)
```

:::

## 前提知識

- **折り返し**: 長い行を、一定の幅で改行して読みやすくすることです。
- **段落**: 空行で区切られた、まとまった文章のことです。
- **`str.splitlines`**: 文字列を行のリストに分けるメソッドです。
- **`str.strip`**: 文字列の前後の空白を取り除くメソッドです。

## 何をしているか

### 1. 作業用のリストを用意する

```python:line-numbers=1288
    all_grafs = []
    cur_graf = []
```

`all_grafs` は、できあがった段落を入れるリストです。`cur_graf` は、今読んでいる段落の行を集めるリストです。

### 2. 行を読み、空行で段落を区切る

```python:line-numbers=1290
    for line in text.splitlines():
        line = line.strip()
        if line:
            cur_graf.append(line)
        else:
            all_grafs.append(' '.join(cur_graf))
            cur_graf = []
```

各行の前後の空白を取り、中身があれば今の段落に加えます。空行に出会ったら、今までの行を 1 つの文字列にまとめ、新しい段落を始めます。

### 3. 最後の段落を忘れずに入れる

```python:line-numbers=1297
    if cur_graf:
        all_grafs.append(' '.join(cur_graf))
```

最後の行が空行でなかった場合、まだ `cur_graf` に残っている段落を追加します。

### 4. 区切りの文字列でつなぐ

```python:line-numbers=1299
    if ending is None:
        return all_grafs
    return ending.join(all_grafs)
```

`ending` が `None` なら、段落のリストをそのまま返します。そうでなければ、`ending` で段落をつないで 1 つの文字列にします。

## ここがすごい

### 空行を段落の境目にする

折り返しで生まれた改行と、段落の区切りの空行を、区別して扱います。改行は単語の区切りとして空白でつなぎ、空行だけを段落の終わりにします。

### 空白の揺れを吸収する

`strip` で各行の前後の空白を取るので、行頭にスペースが付いている文章でも、きれいに 1 行になります。

### 返す形を選べる

`ending=None` にすると、段落のリストが返ります。文字列にして出すか、リストのまま後で加工するかを、呼び出し側が選べます。

## まとめ

- 空行で段落を区切り、段落の中の行を空白でつなぐと、折り返しを戻せる。
- 各行の空白を取ってから判定すると、見た目の揺れに影響されない。
- 段落の区切り方を引数で決めると、用途に合わせた形で返せる。
