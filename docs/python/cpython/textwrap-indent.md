---
title: 空白だけの行は飛ばして、行の先頭に接頭辞を付ける
description: textwrap.indent は、複数行の文字列の各行の先頭に指定の文字列を付ける。空白だけの行には付けず、述語を省いたときは専用の近道でループを回す。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/textwrap.py
lines: [447, 469]
function: indent
difficulty: 1
format: 2
tags: [文字列処理, 標準ライブラリ, 最適化]
---

## ひとことで

`indent(text, prefix)` は、文字列の **各行の先頭に `prefix` を付ける** 関数です。
`indent('a\nb\n', '> ')` は `'> a\n> b\n'` を返します。引用文を作るときや、コードを字下げするときに使えます。
中身が空白だけの行には `prefix` を付けない、という小さな工夫が入っています。

## コード

::: code-group

```python:line-numbers=447 [日本語訳]
def indent(text, prefix, predicate=None):
    """'text' の中の選ばれた行の先頭に 'prefix' を付ける。

    If 'predicate' is provided, 'prefix' will only be added to the lines
    where 'predicate(line)' is True. If 'predicate' is not provided,
    it will default to adding 'prefix' to all non-empty lines that do not
    consist solely of whitespace characters.
    """
    prefixed_lines = []
    if predicate is None:
        # str.splitlines(keepends=True) は空文字列を作らないので、
        # 真偽値の判定ではなく `str.isspace()` を使う必要がある。
        # 述語をその場に書くと、約 30% 速くなる。
        for line in text.splitlines(True):
            if not line.isspace():
                prefixed_lines.append(prefix)
            prefixed_lines.append(line)
    else:
        for line in text.splitlines(True):
            if predicate(line):
                prefixed_lines.append(prefix)
            prefixed_lines.append(line)
    return ''.join(prefixed_lines)
```

```python:line-numbers=447 [原文]
def indent(text, prefix, predicate=None):
    """Adds 'prefix' to the beginning of selected lines in 'text'.

    If 'predicate' is provided, 'prefix' will only be added to the lines
    where 'predicate(line)' is True. If 'predicate' is not provided,
    it will default to adding 'prefix' to all non-empty lines that do not
    consist solely of whitespace characters.
    """
    prefixed_lines = []
    if predicate is None:
        # str.splitlines(keepends=True) doesn't produce the empty string,
        # so we need to use `str.isspace()` rather than a truth test.
        # Inlining the predicate leads to a ~30% performance improvement.
        for line in text.splitlines(True):
            if not line.isspace():
                prefixed_lines.append(prefix)
            prefixed_lines.append(line)
    else:
        for line in text.splitlines(True):
            if predicate(line):
                prefixed_lines.append(prefix)
            prefixed_lines.append(line)
    return ''.join(prefixed_lines)
```

:::

`indent` は `textwrap` モジュールの関数です。`textwrap` は、テキストを折り返したり字下げしたりする標準ライブラリです。

## 前提知識

- **`prefix`**: 各行の先頭に付ける文字列です。空白 4 個や `"> "` などを使います。
- **`str.splitlines(True)`**: 改行を残したまま、行ごとに分けたリストを返します。`'a\nb\n'` なら `['a\n', 'b\n']` です。
- **`str.isspace()`**: 文字列がすべて空白（スペース、タブ、改行など）なら `True` を返します。空の文字列には `False` を返します。
- **述語（predicate）**: 「行を受け取って、真か偽を返す関数」のことです。ここでは「この行に接頭辞を付けるか」を決めるために使います。

## 何をしているか

### 1. 述語がない場合は、空白だけの行を飛ばす

```python:line-numbers=457
        # str.splitlines(keepends=True) は空文字列を作らないので、
        # 真偽値の判定ではなく `str.isspace()` を使う必要がある。
        # 述語をその場に書くと、約 30% 速くなる。
        for line in text.splitlines(True):
            if not line.isspace():
                prefixed_lines.append(prefix)
            prefixed_lines.append(line)
```

改行が残っているので、`'\n'` だけの行も「空ではない」文字列になります。そのため `if line:` では空行を見分けられません。`line.isspace()` で調べると、改行だけの行も空白とみなせます。

### 2. 述語がある場合は、その結果で決める

```python:line-numbers=464
    else:
        for line in text.splitlines(True):
            if predicate(line):
                prefixed_lines.append(prefix)
            prefixed_lines.append(line)
```

`predicate(line)` が `True` を返した行にだけ接頭辞を付けます。どの行に付けるかを、呼び出す側が自由に決められます。

### 3. 最後に 1 つの文字列にする

```python:line-numbers=469
    return ''.join(prefixed_lines)
```

`prefixed_lines` には、接頭辞と行が交互に入っています。最後に `''.join` で 1 つの文字列につなげて返します。

## ここがすごい

### 空白行の判定に `isspace()` を使う

`str.splitlines` に `True` を渡すと改行が残るため、行は必ず 1 文字以上になります。コメントにあるとおり、真偽値で判定すると空行の区別ができないので、`isspace()` を使っています。

### 述語を省くと、近道を通る

述語がないときは、行ごとに関数を呼ぶ代わりに、ループの中で直接 `isspace()` を調べます。コメントには「述語をその場に書くと、約 30% 速くなる」と書かれています。よく使われる場合だけ速い経路を用意する、という考え方です。

### 中身を作ってからつなぐ

行ごとに文字列を連結すると、そのたびに新しい文字列ができて遅くなります。リストに入れてから `''.join` で 1 回だけつなぐと、この無駄がなくなります。

## まとめ

- `splitlines(True)` は改行を残すので、空白行の判定には `isspace()` を使う。
- よく使う場合だけ速い経路を用意すると、読みやすさと速さを両立できる。
- 文字列の連結は、リストに集めてから `join` でまとめる。
