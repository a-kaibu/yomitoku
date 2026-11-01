---
title: 元の辞書を変えずに、1 組だけ値を差し替えた辞書を作る
description: toolz.assoc は、辞書をコピーしてから 1 つのキーに値を入れた新しい辞書を返す。元の辞書は変えないので、関数型の書き方で状態を扱うときに使える。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/dicttoolz.py
lines: [185, 198]
function: assoc
difficulty: 1
format: 2
tags: [関数型, 可読性, イディオム]
---

## ひとことで

`assoc(d, key, value)` は、**辞書の 1 組の値を差し替えた、新しい辞書** を返す関数です。
`assoc({'x': 1}, 'x', 2)` は `{'x': 2}` を返します。元の `{'x': 1}` は、そのまま残ります。

## コード

::: code-group

```python:line-numbers=185 [日本語訳]
def assoc(d, key, value, factory=dict):
    """ 新しいキーと値の組を加えた、新しい辞書を返す

    新しい辞書では d[key] が value になる。元の辞書は変更しない。

    >>> assoc({'x': 1}, 'x', 2)
    {'x': 2}
    >>> assoc({'x': 1}, 'y', 3)   # doctest: +SKIP
    {'x': 1, 'y': 3}
    """
    d2 = factory()
    d2.update(d)
    d2[key] = value
    return d2
```

```python:line-numbers=185 [原文]
def assoc(d, key, value, factory=dict):
    """ Return a new dict with new key value pair

    New dict has d[key] set to value. Does not modify the initial dictionary.

    >>> assoc({'x': 1}, 'x', 2)
    {'x': 2}
    >>> assoc({'x': 1}, 'y', 3)   # doctest: +SKIP
    {'x': 1, 'y': 3}
    """
    d2 = factory()
    d2.update(d)
    d2[key] = value
    return d2
```

:::

## 前提知識

- **副作用**: 関数が、引数の値を書き換えたり、外の状態を変えたりすることです。
- **浅いコピー**: 辞書の中身を別の辞書へ写すことです。キーと値の組を写しますが、値がリストなどの場合は、その中身は共有されます。
- **`factory`**: 結果の辞書を作る関数です。既定値は `dict` です。

## 何をしているか

### 1. 結果の辞書を作り、元の内容を写す

```python:line-numbers=195
    d2 = factory()
    d2.update(d)
```

`factory()` で新しい辞書を作り、`update` で元の辞書の内容を入れます。この段階では、元の辞書とは別の辞書になっています。

### 2. 1 組だけ値を入れて返す

```python:line-numbers=197
    d2[key] = value
    return d2
```

`d2[key] = value` で、指定したキーの値だけを入れます。すでにあるキーなら値が差し替わり、なければ新しく加わります。元の辞書は一度も書き換えていません。

## ここがすごい

### 変更を、新しい値として表せる

「辞書の値を変える」という操作を、「変えた新しい辞書を受け取る」という形に変えています。前の状態を残したまま、次の状態を作れます。

### 呼び出し側の安全が保たれる

元の辞書を書き換えないので、同じ辞書を渡した別の処理に影響しません。関数の中身が何をするかを、呼び出しの形から読み取りやすくなります。

### 浅いコピーの注意点

コピーは一段だけです。値がリストのような変更できるものなら、その中身は元の辞書と共有されます。深く変えたくないときは、値そのものも作り直す必要があります。

## まとめ

- 1 組の値を変えた辞書を、コピーして作ると元の辞書を守れる。
- 変更を新しい値として返すと、前の状態を残しながら次の状態を作れる。
- コピーは一段だけなので、中身まで変えたいときは注意が要る。
