---
title: 共通のインデントを、最小と最大の 2 行だけ比べて取り除く
description: textwrap.dedent は、複数行の文字列からすべての行に共通する先頭の空白を取り除く。全行を比べず、辞書順の最小と最大の行だけで共通部分を求めている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/textwrap.py
lines: [416, 444]
function: dedent
difficulty: 2
format: 2
tags: [文字列処理, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`dedent(text)` は、**複数行の文字列の、すべての行に共通している先頭の空白（インデント）を取り除く** 関数です。
コードの中で三重引用符の文字列を字下げして書いたとき、その字下げを消すのによく使われます。
`dedent("    a\n      b\n    c")` は `"a\n  b\nc"` を返します。

## コード

::: code-group

```python:line-numbers=416 [日本語訳]
def dedent(text):
    """`text` の各行から、すべての行に共通する先頭の空白を取り除く。

    三重引用符の文字列を、表示の左端に揃えるために使える。
    表示の端に揃えつつ、ソースコードでは字下げした形で書けるように
    するために使える。

    タブと空白は、どちらも空白として扱われるが、
    同じものとは見なされない。行 "  hello" と "\\thello" は、
    共通の先頭の空白がないと見なされる。

    空白だけの行は、改行文字だけに正規化される。
    """
    try:
        lines = text.split('\n')
    except (AttributeError, TypeError):
        msg = f'expected str object, not {type(text).__qualname__!r}'
        raise TypeError(msg) from None

    # ``os.path.commonprefix()`` と同じ発想で、先頭の空白の長さを求める。
    non_blank_lines = [l for l in lines if l and not l.isspace()]
    l1 = min(non_blank_lines, default='')
    l2 = max(non_blank_lines, default='')
    margin = 0
    for margin, c in enumerate(l1):
        if c != l2[margin] or c not in ' \t':
            break

    return '\n'.join([l[margin:] if not l.isspace() else '' for l in lines])
```

```python:line-numbers=416 [原文]
def dedent(text):
    """Remove any common leading whitespace from every line in `text`.

    This can be used to make triple-quoted strings line up with the left
    edge of the display, while still presenting them in the source code
    in indented form.

    Note that tabs and spaces are both treated as whitespace, but they
    are not equal: the lines "  hello" and "\\thello" are
    considered to have no common leading whitespace.

    Entirely blank lines are normalized to a newline character.
    """
    try:
        lines = text.split('\n')
    except (AttributeError, TypeError):
        msg = f'expected str object, not {type(text).__qualname__!r}'
        raise TypeError(msg) from None

    # Get length of leading whitespace, inspired by ``os.path.commonprefix()``.
    non_blank_lines = [l for l in lines if l and not l.isspace()]
    l1 = min(non_blank_lines, default='')
    l2 = max(non_blank_lines, default='')
    margin = 0
    for margin, c in enumerate(l1):
        if c != l2[margin] or c not in ' \t':
            break

    return '\n'.join([l[margin:] if not l.isspace() else '' for l in lines])
```

:::

## 前提知識

- **`text.split('\n')`**: 文字列を改行で区切って、行のリストにします。
- **`isspace`**: 文字列がすべて空白文字ならば真です。空の文字列では偽になります。
- **`min` と `max`**: 並びの中の、辞書順で最小と最大の値を返します。並びが空なら `default` を返します。
- **辞書順**: 文字列を先頭の文字から順に比べる順番です。空白（文字コード 32）は、英数字より小さい文字です。
- **`enumerate`**: 文字列の各文字を、その位置の番号と一緒に取り出します。

## 何をしているか

### 1. 行に分け、文字列でなければエラーにする

```python:line-numbers=429
    try:
        lines = text.split('\n')
    except (AttributeError, TypeError):
        msg = f'expected str object, not {type(text).__qualname__!r}'
        raise TypeError(msg) from None
```

`split` できない値が渡されたら、型名を入れた `TypeError` にします。文字列以外を、黙って処理しないためです。

### 2. 空白だけの行を除き、最小と最大の行を選ぶ

```python:line-numbers=436
    non_blank_lines = [l for l in lines if l and not l.isspace()]
    l1 = min(non_blank_lines, default='')
    l2 = max(non_blank_lines, default='')
```

空行と空白だけの行を除いて、残りの中から辞書順の最小 `l1` と最大 `l2` を選びます。

### 3. 2 行の共通の先頭空白を数える

```python:line-numbers=439
    margin = 0
    for margin, c in enumerate(l1):
        if c != l2[margin] or c not in ' \t':
            break
```

`l1` と `l2` を先頭から 1 文字ずつ比べ、違う文字が出たところか、空白・タブ以外の文字が出たところで止めます。止めた位置が、共通の先頭空白の長さ `margin` です。

### 4. 各行から取り除く

```python:line-numbers=444
    return '\n'.join([l[margin:] if not l.isspace() else '' for l in lines])
```

すべての行の先頭 `margin` 文字を取り除きます。空白だけの行は、空の文字列にそろえます。

## ここがすごい

### 両端の 2 行だけで十分

全行に共通する先頭部分は、辞書順の最小の行と最大の行の共通部分に等しいという性質を使っています。辞書順で間に挟まれた行は、両端が共有する先頭を必ず持っているからです。そのため、`min` と `max` で 2 行を選び、その 2 行だけを比べれば済みます。

### 「空白でなくなったら止める」条件も同時に

2 行の共通部分には、インデントのほかに文字が含まれることもあります。`c not in ' \t'` の判定で、空白とタブ以外の文字に出会ったところで止めるので、インデントより先は削りません。

### タブと空白を勝手に同一視しない

docstring にある通り、タブと空白は別の文字として比べます。見た目の幅で揃えようとすると、タブの幅（4 か 8 か）という決めごとが必要になってしまいます。文字そのものを比べるので、結果が環境によって変わりません。

## まとめ

- 全体の共通先頭部分は、辞書順の最小と最大の 2 行を比べれば求まる。
- `min` と `max` は速い組み込み関数なので、全行の総当たりを避けられる。
- タブと空白のように似ているが違うものは、勝手に同じ扱いにしない。
