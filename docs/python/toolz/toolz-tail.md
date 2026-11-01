---
title: 列の最後の n 個を、読み切らずに取り出す
description: toolz.tail は、列の最後の n 個を返す。リストなどはスライスで取り出し、イテレータには長さ n の deque を使って、一度だけ読みながら末尾だけを残す。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [325, 338]
function: tail
difficulty: 2
format: 2
tags: [イテレータ, 防御的プログラミング, 最適化]
---

## ひとことで

`tail(n, seq)` は、**列の最後の `n` 個の要素** を返す関数です。
`tail(2, [10, 20, 30, 40, 50])` は `[40, 50]` を返します。イテレータのように添字が使えない列でも、同じように末尾を取り出せます。

## コード

::: code-group

```python:line-numbers=325 [日本語訳]
def tail(n, seq):
    """ 列の最後の n 個の要素

    >>> tail(2, [10, 20, 30, 40, 50])
    [40, 50]

    See Also:
        drop
        take
    """
    try:
        return seq[-n:]
    except (TypeError, KeyError):
        return tuple(collections.deque(seq, n))
```

```python:line-numbers=325 [原文]
def tail(n, seq):
    """ The last n elements of a sequence

    >>> tail(2, [10, 20, 30, 40, 50])
    [40, 50]

    See Also:
        drop
        take
    """
    try:
        return seq[-n:]
    except (TypeError, KeyError):
        return tuple(collections.deque(seq, n))
```

:::

## 前提知識

- **スライス**: `seq[-n:]` のように、添字の範囲で列の一部を取り出す書き方です。リストやタプルで使えます。
- **イテレータ**: 添字が使えず、値を 1 つずつ読むしかない列です。ジェネレータなどがあたります。
- **`collections.deque`**: 両端から出し入れできる列です。`maxlen` を決めると、上限を超えた古い値を自動で捨てます。
- **`TypeError` と `KeyError`**: 添字を使おうとして失敗したときに出るエラーです。

## 何をしているか

### 1. 添字で取れるなら、スライスで取る

```python:line-numbers=335
    try:
        return seq[-n:]
```

`seq[-n:]` は、末尾から `n` 個を切り出すだけなので、速く答えが出ます。リストやタプルは、この方法で取り出せます。

### 2. 添字が使えないなら、読みながら残す

```python:line-numbers=337
    except (TypeError, KeyError):
        return tuple(collections.deque(seq, n))
```

添字が使えない列は、例外を捕まえて別の方法にします。`deque(seq, n)` は、`n` 個の上限を持つ列に値を入れていきます。上限を超えた古い値は自動で捨てられるので、最後に残るのは末尾の `n` 個だけです。

## ここがすごい

### 2 通りの方法を、失敗で切り替える

まず速い方法を試し、使えないときだけ遅い方法に切り替えています。`try` と `except` の組み合わせで、列の種類を判定する分岐が要りません。

### 一度だけ読めばよい

イテレータは、読んだ値を戻せません。`deque` の上限を使うと、途中の値を保存せずに、末尾だけを 1 回の走査で残せます。

### 注意点として、`n` が 0 のとき

`seq[-0:]` は `seq[0:]` と同じになり、列の全部を返してしまいます。`deque(seq, 0)` なら空になるので、結果が違います。0 を特別扱いしたいときは、この点を意識しておく必要があります。

## まとめ

- 添字が使える列はスライスで、使えない列は `deque` で末尾を取る。
- 例外を使って方法を切り替えると、列の種類ごとの分岐を書かずに済む。
- `n` が 0 のときは、スライスと `deque` で結果が違うので注意する。
