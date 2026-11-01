---
title: 列の最後の要素を、末尾 1 個の取り出しとして得る
description: toolz.last は、列の最後の要素を返す。toolz.tail に 1 を渡して末尾 1 個を取り出し、その先頭を返す。リストでもイテレータでも同じ書き方で使える。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [395, 401]
function: last
difficulty: 1
format: 2
tags: [イテレータ, 可読性]
---

## ひとことで

`last(seq)` は、**列の最後の要素** を返す関数です。
`last('ABC')` は `'C'` を返します。空の列では、要素がないので `IndexError` になります。

## コード

::: code-group

```python:line-numbers=395 [日本語訳]
def last(seq):
    """ 列の最後の要素

    >>> last('ABC')
    'C'
    """
    return tail(1, seq)[0]
```

```python:line-numbers=395 [原文]
def last(seq):
    """ The last element in a sequence

    >>> last('ABC')
    'C'
    """
    return tail(1, seq)[0]
```

:::

## 前提知識

- **末尾の要素**: 列の一番後ろにある値です。`seq[-1]` と書けるのは、添字が使える列だけです。
- **`tail(n, seq)`**: 列の最後の `n` 個を取り出す関数です。
- **添字 `[0]`**: `tail` の結果は、1 個だけのリストかタプルになるので、その先頭を取り出します。

## 何をしているか

### 1. 末尾 1 個を取り出す

```python:line-numbers=401
    return tail(1, seq)[0]
```

`tail(1, seq)` で、列の最後の 1 個を取り出します。添字が使える列はスライスで、使えない列は `deque` で処理されます。どちらの場合も、結果は 1 個の並びになります。その先頭を `[0]` で取り出して返します。

## ここがすごい

### 既にある部品を使う

末尾を取る処理は、`tail` にすでに書かれています。`last` は、それを 1 回呼ぶだけの薄い関数です。同じ処理を二重に書いていません。

### 添字がない列でも使える

`seq[-1]` と書けない列、例えばジェネレータでも、読みながら最後の値を残す仕組みで取り出せます。

### 空の列は例外になる

空の列では、末尾の並びも空になり、`[0]` で `IndexError` が出ます。空かどうかを、呼び出し側で確かめる必要があります。

## まとめ

- 末尾の取り出しを `tail` に任せると、`last` は 1 行で書ける。
- 添字がない列でも、同じように最後の値が取れる。
- 空の列は例外になるので、必要なら呼び出し側で扱う。
