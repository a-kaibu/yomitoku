---
title: 文字列の行を、リストを作らずに 1 行ずつ取り出す
description: boltons の iter_splitlines は、str.splitlines と同じように行を区切るが、リストではなくイテレータを返す。改行コードの正規表現で行末を探し、その間の文字列を順に出すので、大きな文字列でも全部をコピーしない。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [672, 701]
function: iter_splitlines
difficulty: 3
format: 2
tags: [文字列処理, イテレータ, 遅延評価]
---

## ひとことで

`iter_splitlines(text)` は、**文字列を行ごとに区切って、1 行ずつ取り出せるイテレータ** を返す関数です。
`list(iter_splitlines('\nhi\nbye\n'))` は `['', 'hi', 'bye', '']` を返します。`str.splitlines` と結果は似ていますが、全部のリストを先に作りません。

## コード

::: code-group

```python:line-numbers=672 [日本語訳]
def iter_splitlines(text):
    r""":meth:`str.splitlines` と似ているが、行のリストではなく、行のイテレータを返す
    リストの代わりに、:meth:`file.next` と似た形で、
    ファイルの行を遅延して読んで出す。

    この関数はさまざまな改行コードに対応しているが、いつもどおり、
    1 つのファイルの中で改行コードを混ぜるときは注意が必要。

    >>> list(iter_splitlines('\nhi\nbye\n'))
    ['', 'hi', 'bye', '']
    >>> list(iter_splitlines('\r\nhi\rbye\r\n'))
    ['', 'hi', 'bye', '']
    >>> list(iter_splitlines(''))
    []
    """
    prev_end, len_text = 0, len(text)
    # print('last: %r' % last_idx)
    # start, end = None, None
    for match in _line_ending_re.finditer(text):
        start, end = match.start(1), match.end(1)
        # print(start, end)
        if prev_end <= start:
            yield text[prev_end:start]
        if end == len_text:
            yield ''
        prev_end = end
    tail = text[prev_end:]
    if tail:
        yield tail
    return
```

```python:line-numbers=672 [原文]
def iter_splitlines(text):
    r"""Like :meth:`str.splitlines`, but returns an iterator of lines
    instead of a list. Also similar to :meth:`file.next`, as that also
    lazily reads and yields lines from a file.

    This function works with a variety of line endings, but as always,
    be careful when mixing line endings within a file.

    >>> list(iter_splitlines('\nhi\nbye\n'))
    ['', 'hi', 'bye', '']
    >>> list(iter_splitlines('\r\nhi\rbye\r\n'))
    ['', 'hi', 'bye', '']
    >>> list(iter_splitlines(''))
    []
    """
    prev_end, len_text = 0, len(text)
    # print('last: %r' % last_idx)
    # start, end = None, None
    for match in _line_ending_re.finditer(text):
        start, end = match.start(1), match.end(1)
        # print(start, end)
        if prev_end <= start:
            yield text[prev_end:start]
        if end == len_text:
            yield ''
        prev_end = end
    tail = text[prev_end:]
    if tail:
        yield tail
    return
```

:::

## 前提知識

- **改行コード**: 行の終わりを表す文字です。`\n`（LF）や `\r\n`（CRLF）などがあります。
- **`str.splitlines`**: 文字列を行のリストに分ける標準の方法です。
- **正規表現**: 文字の並びの規則を記号で書いたものです。ここでは、改行の位置を探すために使います。
- **`finditer`**: 正規表現に合う場所を、順に見つけて返す方法です。

## 何をしているか

### 1. 改行の位置を順に見つける

```python:line-numbers=687
    prev_end, len_text = 0, len(text)
```

最初の行の始まりと、文字列の長さを用意します。`_line_ending_re.finditer(text)` は、改行の位置を先頭から順に返すイテレータです。

```python:line-numbers=690
    for match in _line_ending_re.finditer(text):
        start, end = match.start(1), match.end(1)
```

改行の位置を 1 つ取り出し、その前後の位置を決めます。

### 2. 前の改行から今の改行までを出す

```python:line-numbers=693
        if prev_end <= start:
            yield text[prev_end:start]
```

前の改行の終わりから、今の改行の始まりまでが、1 行です。空の行でも、この区間は必ず出ます。

```python:line-numbers=695
        if end == len_text:
            yield ''
```

文字列の最後が改行で終わっていれば、その後ろに空の行を 1 つ出します。

```python:line-numbers=697
        prev_end = end
```

次の行の始まりを、今の改行の終わりに移します。

### 3. 最後に残った部分を出す

```python:line-numbers=698
    tail = text[prev_end:]
    if tail:
        yield tail
    return
```

最後の改行の後ろに文字が残っていれば、それを最後の行として出します。残りが空なら、何も出しません。

## ここがすごい

### 全部のリストを作らない

行を全部リストに入れず、1 行分だけを作って出します。大きなテキストファイルの内容を扱うときも、メモリの使用量が抑えられます。

### 改行の種類を一度に扱える

正規表現で、`\n`、`\r\n`、`\r` のどれも行の区切りとして見つけます。種類を場合分けする処理は書かずに済みます。

### 注意点として、改行の混在

1 つの文字列の中で、改行の種類が混ざっていると、行の数や内容が期待と違うことがあります。ドキュメントが注意しているのは、この点です。

## まとめ

- 改行の位置を順に見つけ、その間の文字列を出すと、リストを作らずに行を扱える。
- 正規表現で複数の改行コードを一度に扱える。
- 改行コードが混ざるファイルでは、結果が期待と違うことがあるので確かめる。
