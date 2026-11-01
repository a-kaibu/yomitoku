---
title: 文字列やバイト列が、ASCII の文字だけでできているかを確かめる
description: boltons の is_ascii は、文字列かバイト列が ASCII の文字だけからなるかを返す。文字列は encode、バイト列は decode を試し、失敗したら False を返す。他の型は ValueError で止める。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [445, 469]
function: is_ascii
difficulty: 2
format: 2
tags: [文字列処理, 防御的プログラミング]
---

## ひとことで

`is_ascii(text)` は、**文字列またはバイト列が、ASCII の文字だけでできているか** を返す関数です。
`is_ascii('Beyoncé')` は `False`、`is_ascii('Beyonce')` は `True` を返します。

## コード

::: code-group

```python:line-numbers=445 [日本語訳]
def is_ascii(text):
    """文字列またはバイト列 *text* が、ASCII の文字だけからなるかを確かめる。
    ASCII の文字だけか。文字列でもバイト列でもなければ :exc:`ValueError` を出す。

    引数:
        text (str): 確かめる文字列。

    >>> is_ascii('Beyoncé')
    False
    >>> is_ascii('Beyonce')
    True
    """
    if isinstance(text, str):
        try:
            text.encode('ascii')
        except UnicodeEncodeError:
            return False
    elif isinstance(text, bytes):
        try:
            text.decode('ascii')
        except UnicodeDecodeError:
            return False
    else:
        raise ValueError('expected text or bytes, not %r' % type(text))
    return True
```

```python:line-numbers=445 [原文]
def is_ascii(text):
    """Check if a string or bytestring, *text*, is composed of ascii
    characters only. Raises :exc:`ValueError` if argument is not text.

    Args:
        text (str): The string to be checked.

    >>> is_ascii('Beyoncé')
    False
    >>> is_ascii('Beyonce')
    True
    """
    if isinstance(text, str):
        try:
            text.encode('ascii')
        except UnicodeEncodeError:
            return False
    elif isinstance(text, bytes):
        try:
            text.decode('ascii')
        except UnicodeDecodeError:
            return False
    else:
        raise ValueError('expected text or bytes, not %r' % type(text))
    return True
```

:::

## 前提知識

- **ASCII**: 英数字や基本的な記号の、128 文字の文字集合です。
- **`str.encode('ascii')`**: 文字列を ASCII のバイト列に変換します。ASCII にない文字があると `UnicodeEncodeError` になります。
- **`bytes.decode('ascii')`**: バイト列を ASCII として読みます。ASCII でないバイトがあると `UnicodeDecodeError` になります。

## 何をしているか

### 1. 文字列なら、ASCII への変換を試す

```python:line-numbers=457
    if isinstance(text, str):
        try:
            text.encode('ascii')
        except UnicodeEncodeError:
            return False
```

文字列は `encode('ascii')` を試します。変換できれば ASCII だけの文字列です。`UnicodeEncodeError` が出たら、ASCII でない文字を含むので `False` を返します。

### 2. バイト列なら、ASCII としての読み取りを試す

```python:line-numbers=462
    elif isinstance(text, bytes):
        try:
            text.decode('ascii')
        except UnicodeDecodeError:
            return False
```

バイト列は `decode('ascii')` を試します。失敗したら、ASCII でないバイトを含むので `False` です。

### 3. それ以外は例外で止める

```python:line-numbers=467
    else:
        raise ValueError('expected text or bytes, not %r' % type(text))
    return True
```

文字列でもバイト列でもない値は、判定できないので `ValueError` を出します。すべての判定が通ったときだけ、`True` を返します。

## ここがすごい

### 変換の成否で判定する

ASCII の文字の一覧を持たず、変換ができるかどうかで判定しています。ASCII の範囲が変わっても、ここを書き換える必要はありません。

### 文字列とバイト列を同じ関数で扱う

2 つの型を、それぞれ適した方法で試すだけで、同じ問いに答えます。呼び出し側は、型を気にせず使えます。

### 判定できない型を早めに知らせる

想定外の型は、黙って `False` を返さずに例外で止めます。誤った判定で、後の処理が壊れるのを防ぎます。

## まとめ

- ASCII かどうかは、`encode` や `decode` が失敗するかで判定できる。
- 文字列とバイト列は、それぞれの変換を試すと、同じ問いに答えられる。
- 想定外の型は例外で知らせると、誤った判定を防げる。
