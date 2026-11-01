---
title: パスの最後の部分だけを切り出す、rfind の 1 行
description: os.path.basename は、パスの一番後ろの要素（ファイル名など）を返す。区切り記号の最後の位置を rfind で探し、その後ろを切り出すだけの短い実装になっている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/posixpath.py
lines: [167, 172]
function: basename
difficulty: 1
format: 2
tags: [ファイル, 文字列処理, 標準ライブラリ]
---

## ひとことで

`basename(p)` は、パスの **一番後ろの要素** を返す関数です。
`basename('/usr/lib/python3.12/os.py')` は `'os.py'` になります。ファイル名だけが欲しいときに使います。

## コード

::: code-group

```python:line-numbers=167 [日本語訳]
def basename(p, /):
    """パス名の最後の要素を返す"""
    p = os.fspath(p)
    sep = _get_sep(p)
    i = p.rfind(sep) + 1
    return p[i:]
```

```python:line-numbers=167 [原文]
def basename(p, /):
    """Returns the final component of a pathname"""
    p = os.fspath(p)
    sep = _get_sep(p)
    i = p.rfind(sep) + 1
    return p[i:]
```

:::

`_get_sep` は、渡されたパスが `bytes` か文字列かに応じて、区切り記号（`/` や `b'/'`）を返す関数です。

## 前提知識

- **パスの区切り記号**: Unix では `/` で、フォルダとファイルを区切ります。
- **`rfind(sub)`**: 文字列の中で `sub` が **最後に** 現れる位置を返します。見つからなければ `-1` です。
- **スライス `p[i:]`**: 位置 `i` から最後までの部分を取り出します。
- **`os.fspath(p)`**: `pathlib.Path` などのパスを、文字列か `bytes` に直します。

## 何をしているか

### 1. 文字列に直して、区切り記号を決める

```python:line-numbers=169
    p = os.fspath(p)
    sep = _get_sep(p)
```

`p` を文字列か `bytes` にそろえ、区切り記号を取得します。

### 2. 最後の区切りの次の位置を探す

```python:line-numbers=171
    i = p.rfind(sep) + 1
```

`rfind` で最後の区切りを探し、その位置に `+ 1` します。区切りが見つからなければ `-1 + 1 = 0` になるので、全体が対象になります。

### 3. その位置から後ろを切り出す

```python:line-numbers=172
    return p[i:]
```

## ここがすごい

### 探すのは「最後の区切り」だけ

`rfind` は後ろから探すので、パスの途中にあるフォルダ名は気にしません。`/a/b/c.txt` でも、最後の `/` の後ろの `c.txt` を取り出せます。

### 見つからないときも、特別扱いがいらない

区切りがないパス（`'file.txt'` など）では `rfind` が `-1` を返します。`-1 + 1` は `0` なので、スライス `p[0:]` が全体をそのまま返します。`if` で分ける必要がありません。

### 末尾の `/` に注意

`basename('/a/b/')` は、最後の区切りの後ろが空なので `''` を返します。`dirname` と組み合わせるときは、この違いを覚えておくと迷いません。

## まとめ

- 最後の区切りを `rfind` で探すと、ファイル名を一瞬で取り出せる。
- 区切りが見つからない場合も、`-1 + 1 = 0` の計算で自然に全体が返る。
- 末尾に区切りがあると、結果は空文字列になる。
