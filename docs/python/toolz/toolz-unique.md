---
title: 初めて現れた要素だけを、順番どおりに遅延して出す
description: toolz.unique は、列の中の重複を取り除き、最初に現れた要素を元の順番どおりに出す。key を指定すると、その値で重複を判定する。集合で見た値を覚えながら、1 つずつ出していく。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [242, 267]
function: unique
difficulty: 1
format: 2
tags: [イテレータ, データ構造, 遅延評価]
---

## ひとことで

`unique(seq, key=None)` は、**列の中で最初に現れた要素だけを、順番どおりに出す** 関数です。
`tuple(unique((1, 2, 1, 3)))` は `(1, 2, 3)` になります。2 回目の `1` は飛ばされます。

## コード

::: code-group

```python:line-numbers=242 [日本語訳]
def unique(seq, key=None):
    """ 列の中から、重複のない要素だけを返す

    >>> tuple(unique((1, 2, 3)))
    (1, 2, 3)
    >>> tuple(unique((1, 2, 1, 3)))
    (1, 2, 3)

    Uniqueness can be defined by key keyword

    >>> tuple(unique(['cat', 'mouse', 'dog', 'hen'], key=len))
    ('cat', 'mouse')
    """
    seen = set()
    seen_add = seen.add
    if key is None:
        for item in seq:
            if item not in seen:
                seen_add(item)
                yield item
    else:  # key を計算してから比べる
        for item in seq:
            val = key(item)
            if val not in seen:
                seen_add(val)
                yield item
```

```python:line-numbers=242 [原文]
def unique(seq, key=None):
    """ Return only unique elements of a sequence

    >>> tuple(unique((1, 2, 3)))
    (1, 2, 3)
    >>> tuple(unique((1, 2, 1, 3)))
    (1, 2, 3)

    Uniqueness can be defined by key keyword

    >>> tuple(unique(['cat', 'mouse', 'dog', 'hen'], key=len))
    ('cat', 'mouse')
    """
    seen = set()
    seen_add = seen.add
    if key is None:
        for item in seq:
            if item not in seen:
                seen_add(item)
                yield item
    else:  # calculate key
        for item in seq:
            val = key(item)
            if val not in seen:
                seen_add(val)
                yield item
```

:::

## 前提知識

- **集合（set）**: 同じ値を 2 つ持たない入れ物です。`in` で含まれるかを素早く調べられます。
- **`seen_add`**: `seen.add` というメソッドを、変数に取り出したものです。ループの中で何度も呼ぶので、属性の探索を減らしています。
- **`key`**: 比べる前に値を変換する関数です。`key=len` なら、文字列の長さで重複を判定します。
- **ジェネレータ**: `yield` を使い、必要になったときに 1 つずつ値を作る関数です。

## 何をしているか

### 1. `key` がない場合

```python:line-numbers=255
    seen = set()
    seen_add = seen.add
    if key is None:
        for item in seq:
            if item not in seen:
                seen_add(item)
                yield item
```

集合を用意し、各要素がまだ見ていないものなら、覚えて出します。見たことのあるものは、何も出さずに飛ばします。

### 2. `key` がある場合

```python:line-numbers=262
    else:  # key を計算してから比べる
        for item in seq:
            val = key(item)
            if val not in seen:
                seen_add(val)
                yield item
```

`key` で変換した値を集合で覚えます。重複の判定は変換後の値で行いますが、出すのは元の要素です。docstring の `['cat', 'mouse', 'dog', 'hen']` を `len` で比べると、`cat` と `mouse` だけが残ります。

## ここがすごい

### 出しながら判定する

全部を読んでから重複を取り除く必要はありません。1 つ読んで、新しければすぐ出します。結果も遅延評価で、必要な分しか作られません。

### 元の要素を出す

`key` を使っても、出てくるのは元の要素です。`len` の値ではなく、`'cat'` や `'mouse'` が出ます。判定の基準と、出す値を分けています。

### 順番が保たれる

集合は順番を持ちませんが、この関数は列を先頭から読むので、最初に現れた順番がそのまま残ります。

## まとめ

- 重複を除くには、見た値を集合に覚えながら、新しいものだけを出す。
- `key` で比べる基準を変えても、出すのは元の要素。
- 遅延評価にすると、大きな列でも必要な分しか作られない。
