---
title: 「例外が出るまで呼び続ける」をイテレータに変換する
description: more_itertools.iter_except は、関数を繰り返し呼び、指定した例外が出たら止まるイテレータを作る。pop のような「空ならエラー」の API を、for 文で回せる形に変える。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [543, 565]
function: iter_except
difficulty: 1
format: 2
tags: [イテレータ, エラー処理, イディオム]
---

## ひとことで

`iter_except(function, exception)` は、**関数を何度も呼び、指定した例外が起きたら止まる** イテレータを作ります。
たとえば `iter_except(d.popitem, KeyError)` は、辞書から要素を 1 つずつ取り出し、空になって `KeyError` が出たら終わります。
「空になったらエラー」という作りの関数を、`for` 文で回せる形に変換する道具です。

## コード

::: code-group

```python:line-numbers=543 [日本語訳]
def iter_except(function, exception, first=None):
    """例外が送出されるまで、関数の結果を繰り返し出す。

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

`suppress` は `contextlib.suppress` で、指定した例外を握りつぶす `with` 文を作ります。

## 前提知識

- **ジェネレータ関数**: `yield` を含む関数です。呼ぶとジェネレータが返り、値を求められるたびに次の `yield` まで動きます。
- **`with suppress(例外):`**: ブロックの中でその例外が起きたら、エラーにせず、ブロックの外へ抜けます。
- **「空ならエラー」の API**: `list.pop()` は空のリストで `IndexError`、`dict.popitem()` は空の辞書で `KeyError`、`queue.get_nowait()` は空のキューで `Empty` を出します。
- **`iter(function, sentinel)`**: 組み込みの `iter` には、「関数を呼び続け、戻り値が `sentinel` と等しくなったら止まる」という使い方もあります。

## 何をしているか

```python
stack = [1, 2, 3]
for x in iter_except(stack.pop, IndexError):
    print(x)   # 3, 2, 1
```

### 1. 例外を握りつぶす範囲を作る

```python:line-numbers=561
    with suppress(exception):
```

`with suppress(IndexError):` の中で起きた `IndexError` は、ジェネレータの終わりとして扱われます。

### 2. 最初に 1 回だけ呼ぶ関数

```python:line-numbers=562
        if first is not None:
            yield first()
```

`first` を渡すと、最初に 1 回だけそれを呼んだ結果を出します。たとえばデータベースの接続を開いてから読み込む、といった使い方ができます。

### 3. 呼び続ける

```python:line-numbers=564
        while True:
            yield function()
```

`stack.pop()` を呼んで `3`、`2`、`1` を順に出します。4 回目の `pop()` で `IndexError` が起き、`suppress` によって `with` の外へ抜け、関数が終わります。ジェネレータが終わったので、`for` も終わります。

## ここがすごい

### 例外を「終わりの合図」に読み替える

組み込みの `iter(function, sentinel)` は「特別な値が返ったら終わり」を表せますが、「例外が出たら終わり」は表せません。`iter_except` はその穴を埋めています。

素直に書くと、

```python
while True:
    try:
        x = stack.pop()
    except IndexError:
        break
    print(x)
```

のように、使う場所ごとに `try` とループを書く必要があります。`iter_except` を使えば、`for` 文 1 つで済み、「空になるまで取り出す」という意図がはっきりします。

### `with suppress` で `try` を外に出す

`try`/`except` をループの内側に書くと、1 回ごとに例外処理の範囲に入り直します。`with suppress(...)` で **ループ全体を囲む** ことで、例外が起きたときだけ外へ抜ける構造になっています。コードも短く読みやすくなります。

### 部品として組み合わせやすい

戻り値はふつうのイテレータなので、`list(iter_except(...))` で全部取り出したり、`islice` で先頭だけ取ったりと、ほかのイテレータ用の道具とそのまま組み合わせられます。docstring には、ヒープ、辞書、deque、キュー、集合での使用例が並んでいます。

## まとめ

- 「空ならエラー」の関数は、`iter_except` で `for` 文で回せるようになる。
- 例外を「終わりの合図」として扱うと、ループがすっきりする。
- `with suppress` でループ全体を囲むと、例外処理が 1 か所にまとまる。
