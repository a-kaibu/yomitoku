---
title: 行の先頭に、指定した文字を付けて字下げする
description: boltons の indent は、文字列の各行の先頭に margin を付ける。key 関数で、字下げする行を選べるので、既定では空行に余計な空白を付けない。textwrap.dedent の反対の処理にあたる。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [704, 717]
function: indent
difficulty: 2
format: 2
tags: [文字列処理, 可読性]
---

## ひとことで

`indent(text, margin)` は、**文章の各行の先頭に、指定した文字列を付けて字下げする** 関数です。
`indent('a\nb', '  ')` は `'  a\n  b'` を返します。`textwrap.dedent` で外した字下げを、もう一度付けるときに使えます。

## コード

::: code-group

```python:line-numbers=704 [日本語訳]
def indent(text, margin, newline='\n', key=bool):
    """組み込みの :func:`textwrap.dedent` に対応する、足りていた処理。

    引数:
        text (str): 字下げする文章。
        margin (str): 各行の先頭に付ける文字列。
        newline (str): 行を結合するときの改行（既定値は ``\\n``）
        key (callable): 各行について、字下げするかどうかを決めるために呼ぶ関数。
          既定値は :class:`bool` で、空の行に空白が付かないようにする。
          
    """
    indented_lines = [(margin + line if key(line) else line)
                      for line in iter_splitlines(text)]
    return newline.join(indented_lines)
```

```python:line-numbers=704 [原文]
def indent(text, margin, newline='\n', key=bool):
    """The missing counterpart to the built-in :func:`textwrap.dedent`.

    Args:
        text (str): The text to indent.
        margin (str): The string to prepend to each line.
        newline (str): The newline used to rejoin the lines (default: ``\\n``)
        key (callable): Called on each line to determine whether to
          indent it. Default: :class:`bool`, to ensure that empty lines do
          not get whitespace added.
    """
    indented_lines = [(margin + line if key(line) else line)
                      for line in iter_splitlines(text)]
    return newline.join(indented_lines)
```

:::

## 前提知識

- **字下げ（インデント）**: 行の先頭に空白などを付けて、段落を右にずらすことです。
- **`textwrap.dedent`**: 全行に共通する先頭の空白を取り除く、標準ライブラリの関数です。この関数の反対の処理にあたります。
- **`key` 関数**: 各行を受け取り、真偽値を返す関数です。真の行だけ字下げします。
- **`bool`**: 空でない値なら `True`、空の文字列なら `False` を返す組み込み関数です。

## 何をしているか

### 1. 行ごとに、字下げするかを決めて付ける

```python:line-numbers=715
    indented_lines = [(margin + line if key(line) else line)
                      for line in iter_splitlines(text)]
```

`iter_splitlines` で、行を 1 つずつ取り出します。`key(line)` が真の行にだけ `margin` を付け、そうでない行はそのまま残します。既定の `bool` では、空の行が `False` になるので、空の行には字下げが付きません。

### 2. 行を改行でつないで返す

```python:line-numbers=717
    return newline.join(indented_lines)
```

字下げした行を `newline` でつなげて、1 つの文字列にして返します。

## ここがすごい

### 空行に余計な空白を付けない

空行に字下げを付けると、行末の空白が増えてしまいます。`key=bool` の既定値で、その問題を防いでいます。

### 字下げの条件を差し替えられる

`key` に別の関数を渡せば、コメント行だけ字下げする、といった条件も書けます。判定を引数で外から決められる作りです。

### 行の分け方を再利用している

行に分けるところで、`iter_splitlines` を使っています。改行の扱いを 1 か所にまとめて、同じ部品を使い回しています。

## まとめ

- 行ごとに先頭へ文字列を付けると、字下げができる。
- 空行に字下げを付けないよう、既定の判定を `bool` にしている。
- 判定の関数を引数で変えられるので、条件に合わせて字下げできる。
