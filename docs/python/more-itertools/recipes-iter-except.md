---
title: 例外が出るまで関数を呼び続けて、イテレータにする
description: more_itertools.iter_except は、関数を繰り返し呼び、例外が出たところで止まるイテレータを作る。番兵の代わりに例外を使い、contextlib.suppress で受け止めて終わらせる。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [543, 565]
function: iter_except
difficulty: 3
format: 2
tags: [イテレータ, エラー処理, 遅延評価]
---

## ひとことで

`iter_except(function, exception, first=None)` は、**関数を呼び続けて、指定した例外が出たところで終わるイテレータ** を作る関数です。
キューや辞書から、空になるまで値を取り出す処理を、`for` 文で書けるようにします。

## コード

::: code-group

```python:line-numbers=543 [日本語訳]
def iter_except(function, exception, first=None):
    """Yields results from a function repeatedly until an exception is raised.

    例外で終わる呼び出しの形を、イテレータの形に変換する。
    ``iter(function, sentinel)`` に似ているが、番兵の代わりに例外を使う
    ことで、繰り返しを終わらせる。

    例:
        iter_except(functools.partial(heappop, h), IndexError)   # 優先度付きキューのイテレータ
        iter_except(d.popitem, KeyError)                         # 待たずに取り出す dict のイテレータ
        iter_except(d.popleft, IndexError)                       # 待たずに取り出す deque のイテレータ
        iter_except(q.get_nowait, Queue.Empty)                   # 生産者の Queue を順に回す
        iter_except(s.pop, KeyError)                             # 待たずに取り出す set のイテレータ

    終わりの条件には、複数の例外も指定できる。例えば
    ``(IndexError, TypeError)`` のように書く。

    """
    with suppress(exception):
        if first is not None:
            yield first()
        while True:
            yield function()
```

```python:line-numbers=543 [原文]
def iter_except(function, exception, first=None):
    """Yields results from a function repeatedly until an exception is raised.

    Converts a call-until-exception interface to an iterator interface.
    Like ``iter(function, sentinel)``, but uses an exception instead of a sentinel
    to end the loop.

    Examples:
        iter_except(functools.partial(heappop, h), IndexError)   # priority queue iterator
        iter_except(d.popitem, KeyError)                         # non-blocking dict iterator
        iter_except(d.popleft, IndexError)                       # non-blocking deque iterator
        iter_except(q.get_nowait, Queue.Empty)                   # loop over a producer Queue
        iter_except(s.pop, KeyError)                             # non-blocking set iterator

    Multiple exceptions can be specified as a stopping condition, for example
    ``(IndexError, TypeError)``.

    """
    with suppress(exception):
        if first is not None:
            yield first()
        while True:
            yield function()
```

:::

## 前提知識

- **番兵（sentinel）**: 繰り返しの終わりを知らせるための、特別な値です。`iter(function, sentinel)` は、その値が出たら止まります。
- **例外**: プログラムの中で起きた問題を知らせる仕組みです。`IndexError` は範囲外の添字、`KeyError` は存在しないキーを使ったときに出ます。
- **ジェネレータ**: `yield` で値を 1 つずつ出す関数です。途中で止めたり、続けたりできます。
- **`contextlib.suppress`**: 指定した例外を、無視して先に進むための道具です。

## 何をしているか

### 1. 指定した例外を無視する範囲を作る

```python:line-numbers=561
    with suppress(exception):
```

`suppress(exception)` の中で値を出します。この中で、指定した例外が出ると、その例外は外に伝わらず、ジェネレータが終わります。

### 2. 最初の 1 回だけ特別に呼ぶ

```python:line-numbers=562
        if first is not None:
            yield first()
```

`first` が指定されていれば、最初の値だけはその関数で出します。ヒープの先頭を先に見たい、といった場面で使えます。

### 3. 例外が出るまで、繰り返し呼ぶ

```python:line-numbers=564
        while True:
            yield function()
```

`while True` で、`function()` を何度も呼びます。例外が出た時点で、`suppress` が受け止め、ループが終わります。

## ここがすごい

### 番兵の代わりに例外を使える

`iter(function, sentinel)` は、戻り値が番兵と等しいかで止まります。`heappop` や `popitem` のように、空のときに例外を出す関数では、この例外を終わりの合図として使えます。

### 例外を外に漏らさない

終わりの例外は、ループの正常な終わりなので、`for` 文の外には出ません。呼び出す側は、`try` と `except` を書かずに、普通の繰り返しとして書けます。

### 他の用途にも広がる

キューや集合など、同じ形で空になる入れ物に広く使えます。値を取り出すたびに消える入れ物を、1 本の `for` 文で回せます。

## まとめ

- 例外で終わる呼び出しを、`iter_except` でイテレータにできる。
- `suppress` で終わりの例外を受け止めると、呼び出し側が `try` を書かずに済む。
- 空になる入れ物から、順に値を取り出す処理に向いている。
