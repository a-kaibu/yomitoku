---
title: 引数を、シェルで正しく読めるように引用符で囲んでつなぐ
description: boltons.strutils.escape_shell_args は、コマンドの引数の各文字列を、シェルや Windows のコマンドプロンプトで 1 つの引数として読まれるようにエスケープし、連結する。style でエスケープの方式を選べる。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [744, 767]
function: escape_shell_args
difficulty: 2
format: 2
tags: [文字列処理, セキュリティ, 防御的プログラミング]
---

## ひとことで

`escape_shell_args(args, sep=' ', style=None)` は、**コマンドの引数を、シェルが 1 つずつ正しく読める形にエスケープして、空白でつなぐ** 関数です。
`escape_shell_args(['ls', 'my file.txt'], style='sh')` は、空白を含む `my file.txt` が 1 つの引数として読まれるように書き換えた文字列を返します。

## コード

::: code-group

```python:line-numbers=744 [日本語訳]
def escape_shell_args(args, sep=' ', style=None):
    """*args* の各文字列を、*style* に従ってエスケープしたものを返す。
    *style*.

    Args:
        args (list): A list of arguments to escape and join together
        sep (str): The separator used to join the escaped arguments.
        style (str): The style of escaping to use. Can be one of
          ``cmd`` or ``sh``, geared toward Windows and Linux/BSD/etc.,
          respectively. If *style* is ``None``, then it is picked
          according to the system platform.

    See :func:`args2cmd` and :func:`args2sh` for details and example
    output for each style.
    """
    if not style:
        style = 'cmd' if sys.platform == 'win32' else 'sh'

    if style == 'sh':
        return args2sh(args, sep=sep)
    elif style == 'cmd':
        return args2cmd(args, sep=sep)

    raise ValueError("style expected one of 'cmd' or 'sh', not %r" % style)
```

```python:line-numbers=744 [原文]
def escape_shell_args(args, sep=' ', style=None):
    """Returns an escaped version of each string in *args*, according to
    *style*.

    Args:
        args (list): A list of arguments to escape and join together
        sep (str): The separator used to join the escaped arguments.
        style (str): The style of escaping to use. Can be one of
          ``cmd`` or ``sh``, geared toward Windows and Linux/BSD/etc.,
          respectively. If *style* is ``None``, then it is picked
          according to the system platform.

    See :func:`args2cmd` and :func:`args2sh` for details and example
    output for each style.
    """
    if not style:
        style = 'cmd' if sys.platform == 'win32' else 'sh'

    if style == 'sh':
        return args2sh(args, sep=sep)
    elif style == 'cmd':
        return args2cmd(args, sep=sep)

    raise ValueError("style expected one of 'cmd' or 'sh', not %r" % style)
```

:::

`args2sh` と `args2cmd` は、それぞれ Unix 系のシェル（`sh`）と Windows のコマンドプロンプト（`cmd`）向けの変換関数です。

## 前提知識

- **シェル**: コマンドを文字列で受け取り、空白で引数を分けて実行するプログラムです。
- **エスケープ**: 特別な意味を持つ文字（空白、引用符、`;` など）を、普通の文字として扱えるように書き換えることです。
- **引数の分割**: シェルは空白で引数を分けるので、空白を含む 1 つの引数は、引用符で囲まないと正しく渡りません。
- **`sys.platform`**: 実行中の OS を表す文字列です。Windows では `'win32'` になります。

## 何をしているか

### 1. エスケープの方式を決める

```python:line-numbers=759
    if not style:
        style = 'cmd' if sys.platform == 'win32' else 'sh'
```

`style` が指定されていなければ、OS に合わせて選びます。Windows なら `cmd`、それ以外なら `sh` です。

### 2. 方式に応じて変換する

```python:line-numbers=762
    if style == 'sh':
        return args2sh(args, sep=sep)
    elif style == 'cmd':
        return args2cmd(args, sep=sep)
```

`sh` なら `args2sh`、`cmd` なら `args2cmd` に任せます。どちらも、引数の並びを 1 つの文字列に変えます。

### 3. 不正な方式はエラーにする

```python:line-numbers=767
    raise ValueError("style expected one of 'cmd' or 'sh', not %r" % style)
```

それ以外の方式が指定されたら、`ValueError` を出します。

## ここがすごい

### 引数を文字列にする危険を減らす

引数を単に空白でつなぐと、空白や記号を含む値が、意図しない形で解釈されます。最悪の場合は、別のコマンドが実行されてしまいます。この関数は、引数を安全な形にしてからつなぎます。

### OS に合わせた既定値

`style` を省略すると、実行環境に合った方式が選ばれます。Windows と Unix 系のコマンドの書き方の違いを、利用者が意識しなくて済みます。

### 方式の違いは、別の関数に分けて任せる

`sh` と `cmd` のエスケープ規則は大きく違うので、それぞれ専用の関数に任せています。この関数は、方式を選んで振り分けるだけです。

## まとめ

- コマンドの引数は、シェルに合わせてエスケープしてからつなぐ。
- 既定の方式は OS に合わせると、移植性がよくなる。
- 外から来た値を引数にするときは、必ずエスケープして、意図しない実行を防ぐ。
