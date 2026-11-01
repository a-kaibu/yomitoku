---
title: 関数を包んだとき、名前と説明文を元の関数からコピーする
description: functools.update_wrapper は、デコレータが作った wrapper 関数に、元の関数の名前・説明文などをコピーする。__wrapped__ を最後に設定するなど、順番にも注意が払われている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/functools.py
lines: [35, 63]
function: update_wrapper
difficulty: 3
format: 2
tags: [メタプログラミング, 設計パターン, 標準ライブラリ]
---

## ひとことで

`update_wrapper(wrapper, wrapped)` は、**デコレータが作った `wrapper` 関数に、元の関数 `wrapped` の名前や説明文をコピーする** 関数です。
デコレータを使うと、関数の名前や `help()` の表示が、包んだ側の名前に変わってしまいます。この関数は、それを元に戻すための道具です。

## コード

::: code-group

```python:line-numbers=35 [日本語訳]
def update_wrapper(wrapper,
                   wrapped,
                   assigned = WRAPPER_ASSIGNMENTS,
                   updated = WRAPPER_UPDATES):
    """wrapper 関数を、wrapped 関数と同じように見えるよう更新する

       wrapper is the function to be updated
       wrapped is the original function
       assigned is a tuple naming the attributes assigned directly
       from the wrapped function to the wrapper function (defaults to
       functools.WRAPPER_ASSIGNMENTS)
       updated is a tuple naming the attributes of the wrapper that
       are updated with the corresponding attribute from the wrapped
       function (defaults to functools.WRAPPER_UPDATES)
    """
    for attr in assigned:
        try:
            value = getattr(wrapped, attr)
        except AttributeError:
            pass
        else:
            setattr(wrapper, attr, value)
    for attr in updated:
        getattr(wrapper, attr).update(getattr(wrapped, attr, {}))
    # Issue #17482: __dict__ を更新するときに __wrapped__ を誤ってコピーしないよう、最後に設定する
    # （__dict__ を更新するとき、wrapped 側からコピーしないように）
    wrapper.__wrapped__ = wrapped
    # wrapper を返す。こうすると partial() でデコレータとして使える
    return wrapper
```

```python:line-numbers=35 [原文]
def update_wrapper(wrapper,
                   wrapped,
                   assigned = WRAPPER_ASSIGNMENTS,
                   updated = WRAPPER_UPDATES):
    """Update a wrapper function to look like the wrapped function

       wrapper is the function to be updated
       wrapped is the original function
       assigned is a tuple naming the attributes assigned directly
       from the wrapped function to the wrapper function (defaults to
       functools.WRAPPER_ASSIGNMENTS)
       updated is a tuple naming the attributes of the wrapper that
       are updated with the corresponding attribute from the wrapped
       function (defaults to functools.WRAPPER_UPDATES)
    """
    for attr in assigned:
        try:
            value = getattr(wrapped, attr)
        except AttributeError:
            pass
        else:
            setattr(wrapper, attr, value)
    for attr in updated:
        getattr(wrapper, attr).update(getattr(wrapped, attr, {}))
    # Issue #17482: set __wrapped__ last so we don't inadvertently copy it
    # from the wrapped function when updating __dict__
    wrapper.__wrapped__ = wrapped
    # Return the wrapper so this can be used as a decorator via partial()
    return wrapper
```

:::

`WRAPPER_ASSIGNMENTS` と `WRAPPER_UPDATES` は、コピーする属性の名前を並べたタプルです。既定値として使われます。

## 前提知識

- **デコレータ**: 関数を受け取り、機能を足した別の関数（ここでは `wrapper`）を返す仕組みです。
- **属性**: 関数が持つ情報のことです。`__name__`（名前）、`__doc__`（説明文）、`__module__`（定義された場所）などがあります。
- **`getattr` / `setattr`**: 名前（文字列）で属性を読んだり、書いたりする関数です。
- **`__wrapped__`**: 包まれた元の関数を指す属性です。`inspect` などの道具が、元の関数をたどるために使います。

## 何をしているか

### 1. 直接コピーする属性

```python:line-numbers=50
    for attr in assigned:
        try:
            value = getattr(wrapped, attr)
        except AttributeError:
            pass
        else:
            setattr(wrapper, attr, value)
```

`assigned` にある属性を、元の関数から読んで `wrapper` に書きます。元の関数にその属性がなければ、`AttributeError` を捕まえて、何もせずに次へ進みます。

### 2. 中身を足す属性

```python:line-numbers=57
    for attr in updated:
        getattr(wrapper, attr).update(getattr(wrapped, attr, {}))
```

`updated` にある属性（`__dict__` など）は、上書きではなく、`wrapper` 側に `update` で足し込みます。

### 3. `__wrapped__` を設定して返す

```python:line-numbers=61
    wrapper.__wrapped__ = wrapped
    # wrapper を返す。こうすると partial() でデコレータとして使える
    return wrapper
```

最後に `wrapper.__wrapped__` へ元の関数を入れ、`wrapper` を返します。返すので、そのままデコレータとして使えます。

## ここがすごい

### 設定の順番にも理由がある

コメントにあるとおり、`__wrapped__` を最後に設定しています。`__dict__` を更新するとき、元の関数の `__wrapped__` まで一緒にコピーされてしまうのを防ぐためです。順番を間違えると、関数の構造がおかしくなります。

### 属性がなくても止まらない

すべての関数が、同じ属性を持つとは限りません。そのため、なければ飛ばすという `try` と `else` の形にしています。途中でエラーにせず、取れたものだけをコピーします。

### デコレータを書く人の標準の道具

この関数を使うと、デコレータが元の関数の情報を失わずに済みます。標準ライブラリの `wraps` は、この関数に引数を固定したものです。自分でデコレータを書くときは、この仕組みを知っておくと役立ちます。

## まとめ

- デコレータで包んだ関数は、元の名前や説明文を失うので、コピーして戻す必要がある。
- 元の関数に属性がない場合も、エラーにせず飛ばすと安全。
- `__wrapped__` のように、順番に意味がある操作は、コメントで理由を残すと読みやすい。
