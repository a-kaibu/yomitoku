---
title: 2 つのパスの「共通部分」を数えて、../ の数を決める
description: os.path.relpath は、ある場所から見た別のパスの相対パスを返す。絶対パスに変換したうえで、先頭から同じ部分を数え、残りの分だけ ".." を付けている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/posixpath.py
lines: [518, 553]
function: relpath
difficulty: 2
format: 2
tags: [ファイル, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`relpath(path, start)` は、**`start` という場所から見た `path` の相対パス** を返す関数です。
`relpath('/a/b/c', '/a/x')` は `'../b/c'` を返します。`start` を省略すると、現在のフォルダが基準になります。

## コード

::: code-group

```python:line-numbers=518 [日本語訳]
def relpath(path, start=None):
    """パスの相対版を返す"""

    path = os.fspath(path)
    if not path:
        raise ValueError("no path specified")

    if isinstance(path, bytes):
        curdir = b'.'
        sep = b'/'
        pardir = b'..'
    else:
        curdir = '.'
        sep = '/'
        pardir = '..'

    if start is None:
        start = curdir
    else:
        start = os.fspath(start)

    try:
        start_tail = abspath(start).lstrip(sep)
        path_tail = abspath(path).lstrip(sep)
        start_list = start_tail.split(sep) if start_tail else []
        path_list = path_tail.split(sep) if path_tail else []
        # start と path で共通している部分の長さを求める。
        i = len(genericpath._commonprefix([start_list, path_list]))

        rel_list = [pardir] * (len(start_list)-i) + path_list[i:]
        if not rel_list:
            return curdir
        return sep.join(rel_list)
    except (TypeError, AttributeError, BytesWarning, DeprecationWarning):
        genericpath._check_arg_types('relpath', path, start)
        raise
```

```python:line-numbers=518 [原文]
def relpath(path, start=None):
    """Return a relative version of a path"""

    path = os.fspath(path)
    if not path:
        raise ValueError("no path specified")

    if isinstance(path, bytes):
        curdir = b'.'
        sep = b'/'
        pardir = b'..'
    else:
        curdir = '.'
        sep = '/'
        pardir = '..'

    if start is None:
        start = curdir
    else:
        start = os.fspath(start)

    try:
        start_tail = abspath(start).lstrip(sep)
        path_tail = abspath(path).lstrip(sep)
        start_list = start_tail.split(sep) if start_tail else []
        path_list = path_tail.split(sep) if path_tail else []
        # Work out how much of the filepath is shared by start and path.
        i = len(genericpath._commonprefix([start_list, path_list]))

        rel_list = [pardir] * (len(start_list)-i) + path_list[i:]
        if not rel_list:
            return curdir
        return sep.join(rel_list)
    except (TypeError, AttributeError, BytesWarning, DeprecationWarning):
        genericpath._check_arg_types('relpath', path, start)
        raise
```

:::

`abspath` は、相対パスを絶対パスに直す関数です。`genericpath._commonprefix` は、2 つのリストの共通する先頭部分を探す関数です。

## 前提知識

- **絶対パスと相対パス**: `/` から始まるのが絶対パス、そうでないものが相対パスです。相対パスは、基準になるフォルダからの位置で書かれます。
- **`..`**: 1 つ上のフォルダを表します。`../b` は「1 つ上のフォルダの中の `b`」です。
- **パスを `/` で分ける**: `'a/b/c'.split('/')` は `['a', 'b', 'c']` です。パスを、フォルダ名のリストとして扱えます。
- **共通の先頭部分**: `['a', 'b', 'c']` と `['a', 'x']` なら、先頭の `'a'` だけが一致します。

## 何をしているか

### 1. 型を揃える

```python:line-numbers=521
    path = os.fspath(path)
    if not path:
        raise ValueError("no path specified")

    if isinstance(path, bytes):
        curdir = b'.'
        sep = b'/'
        pardir = b'..'
    else:
        curdir = '.'
        sep = '/'
        pardir = '..'
```

入力が `bytes` なら、区切り記号なども `bytes` にします。文字列なら `'/'` や `'.'` を使います。この部分で、どちらの型でも同じ処理が書けるようにしています。

### 2. 基準と対象を、フォルダ名のリストにする

```python:line-numbers=534
    if start is None:
        start = curdir
    else:
        start = os.fspath(start)

    try:
        start_tail = abspath(start).lstrip(sep)
        path_tail = abspath(path).lstrip(sep)
        start_list = start_tail.split(sep) if start_tail else []
        path_list = path_tail.split(sep) if path_tail else []
```

`abspath` で絶対パスにしてから、先頭の `/` を取り除いて `/` で分けます。`start` も `path` も、フォルダ名の並びになります。

### 3. 共通部分を数えて、残りを `..` にする

```python:line-numbers=544
        # start と path で共通している部分の長さを求める。
        i = len(genericpath._commonprefix([start_list, path_list]))

        rel_list = [pardir] * (len(start_list)-i) + path_list[i:]
        if not rel_list:
            return curdir
        return sep.join(rel_list)
```

共通している部分の長さを `i` とします。`start` から `i` 番目より後ろのフォルダ数だけ `..` を並べ、`path` のうち `i` 番目より後ろの部分をつなげます。`start` と `path` が同じなら、残りは空になり、`.` を返します。

## ここがすごい

### 絶対パスに変えてから比べる

`..` や `.` が混ざった入力でも正しく比べられるように、最初に `abspath` で正規化しています。文字列をそのまま比べると、`a/./b` と `a/b` が別物になってしまいます。

### 型によって区切り記号を切り替える

文字列でも `bytes` でも同じコードで動くように、`curdir`、`sep`、`pardir` を型に合わせて選んでいます。関数の本体は 1 つのままで、2 種類の型を扱えます。

### 共通部分を数えるだけ

「`start` の深さから共通部分を引いた分だけ `..`、その後ろに `path` の残り」という形にすると、どんな深さのパスでも同じ式で答えが出ます。ループで 1 段ずつ比べ直す必要はありません。

## まとめ

- 相対パスは、「共通の先頭部分」を数えると組み立てられる。
- 比べる前に絶対パスに直すと、`.` や `..` を含む入力にも対応できる。
- 型に応じた部品（区切り記号など）を選ぶと、1 つの関数で `str` と `bytes` を扱える。
