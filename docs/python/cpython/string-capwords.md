---
title: 単語ごとに先頭を大文字にして、空白でつなぎ直す
description: string.capwords は、文字列を単語に分け、それぞれの先頭を大文字にし、もう一度つなぐ。sep を省略すると、連続する空白を 1 つにまとめる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/string/__init__.py
lines: [37, 48]
function: capwords
difficulty: 1
format: 2
tags: [文字列処理, 標準ライブラリ]
---

## ひとことで

`capwords(s, sep=None)` は、文字列の **各単語の先頭を大文字にして、つなぎ直す** 関数です。
`capwords('hello  WORLD')` は `'Hello World'` を返します。連続する空白は 1 つにまとまり、前後の空白は消えます。

## コード

::: code-group

```python:line-numbers=37 [日本語訳]
def capwords(s, sep=None):
    """capwords(s [,sep]) -> 文字列（各単語の先頭を大文字にした文字列）

    Split the argument into words using split, capitalize each
    word using capitalize, and join the capitalized words using
    join.  If the optional second argument sep is absent or None,
    runs of whitespace characters are replaced by a single space
    and leading and trailing whitespace are removed, otherwise
    sep is used to split and join the words.

    """
    return (sep or ' ').join(map(str.capitalize, s.split(sep)))
```

```python:line-numbers=37 [原文]
def capwords(s, sep=None):
    """capwords(s [,sep]) -> string

    Split the argument into words using split, capitalize each
    word using capitalize, and join the capitalized words using
    join.  If the optional second argument sep is absent or None,
    runs of whitespace characters are replaced by a single space
    and leading and trailing whitespace are removed, otherwise
    sep is used to split and join the words.

    """
    return (sep or ' ').join(map(str.capitalize, s.split(sep)))
```

:::

`capitalize` は、文字列の先頭 1 文字を大文字にし、残りを小文字にするメソッドです。

## 前提知識

- **`split(sep)`**: 区切り文字（`sep`）で文字列を分けてリストにします。`sep` が `None` なら、空白の連続を 1 つの区切りとして扱い、前後の空白は無視します。
- **`capitalize()`**: 先頭だけを大文字に、残りを小文字にします。`'WORLD'.capitalize()` は `'World'` です。
- **`join(list)`**: リストの要素を、間に区切りを入れてつなぎます。
- **`sep or ' '`**: `sep` が `None` なら、つなぐ文字としてスペースを使います。

## 何をしているか

### 1. 単語に分ける

```python:line-numbers=48
    return (sep or ' ').join(map(str.capitalize, s.split(sep)))
```

`s.split(sep)` で、単語のリストを作ります。`sep` が `None` のときは、空白の連続で分けられます。

### 2. 各単語を大文字始まりにする

```python:line-numbers=48
    return (sep or ' ').join(map(str.capitalize, s.split(sep)))
```

`map(str.capitalize, ...)` で、各単語に `capitalize` をかけます。

### 3. 区切りを付けてつなぐ

```python:line-numbers=48
    return (sep or ' ').join(map(str.capitalize, s.split(sep)))
```

`(sep or ' ').join(...)` で、単語を区切り文字でつなぎ直します。`sep` を省略したときは、スペースでつながります。

## ここがすごい

### 3 つの処理を 1 行にまとめる

分ける、変換する、つなぐという 3 つの処理を、`split`、`map`、`join` の組み合わせで 1 行にしています。途中の変数を作る必要がありません。

### 区切りを 2 通りに使い分ける

`sep` を省略すると、空白を正規化する便利な使い方になります。`sep` を指定すると、`'a-b-c'` のような区切りで分けて、同じ区切りでつなげ直せます。

### `capitalize` の注意点

`capitalize` は、単語の残りを小文字にします。`'HTTP'` は `'Http'` になるので、略語を保ちたいときは別の方法を選ぶ必要があります。

## まとめ

- 分ける、変換する、つなぐを組み合わせると、文字列の整形が 1 行で書ける。
- `sep` を省略すると、空白の揺れをまとめて整えられる。
- `capitalize` は残りを小文字にするので、略語には注意する。
