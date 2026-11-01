---
title: 何もしない with 文を用意して、条件によって分けずに済ませる
description: contextlib.nullcontext は、何もしないコンテキストマネージャ。条件によって with の対象を変えたいときに、ダミーとして使える。同期版と非同期版の両方を持つ。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/contextlib.py
lines: [818, 842]
function: nullcontext
difficulty: 2
format: 2
tags: [設計パターン, 防御的プログラミング, 可読性]
---

## ひとことで

`nullcontext(enter_result=None)` は、**`with` 文の中で何も追加の処理をしない** コンテキストマネージャです。
本物の後始末が必要ない場面で、同じ書き方を保つためのダミーとして使います。

## コード

::: code-group

```python:line-numbers=818 [日本語訳]
class nullcontext(AbstractContextManager, AbstractAsyncContextManager):
    """追加の処理を何もしない、コンテキストマネージャ。

    Used as a stand-in for a normal context manager, when a particular
    block of code is only sometimes used with a normal context manager:

    cm = optional_cm if condition else nullcontext()
    with cm:
        # 処理を行う。condition が True なら optional_cm を使う
    """

    def __init__(self, enter_result=None):
        self.enter_result = enter_result

    def __enter__(self):
        return self.enter_result

    def __exit__(self, *excinfo):
        pass

    async def __aenter__(self):
        return self.enter_result

    async def __aexit__(self, *excinfo):
        pass
```

```python:line-numbers=818 [原文]
class nullcontext(AbstractContextManager, AbstractAsyncContextManager):
    """Context manager that does no additional processing.

    Used as a stand-in for a normal context manager, when a particular
    block of code is only sometimes used with a normal context manager:

    cm = optional_cm if condition else nullcontext()
    with cm:
        # Perform operation, using optional_cm if condition is True
    """

    def __init__(self, enter_result=None):
        self.enter_result = enter_result

    def __enter__(self):
        return self.enter_result

    def __exit__(self, *excinfo):
        pass

    async def __aenter__(self):
        return self.enter_result

    async def __aexit__(self, *excinfo):
        pass
```

:::

## 前提知識

- **コンテキストマネージャ**: `with` 文で使えるオブジェクトのことです。`__enter__` で入るときの処理、`__exit__` で出るときの処理を持ちます。
- **`with` 文**: 入るときと出るときの処理を、自動で呼ぶ書き方です。ファイルを閉じるときなどに使われます。
- **`enter_result`**: `with ... as x` の `x` に入る値です。省略すると `None` になります。
- **非同期版（`async with`）**: `__aenter__` と `__aexit__` を使う版です。`async` の関数の中で使います。

## 何をしているか

### 1. 入るとき

```python:line-numbers=832
    def __enter__(self):
        return self.enter_result
```

`__enter__` は、`enter_result` をそのまま返します。何も準備しません。

### 2. 出るとき

```python:line-numbers=835
    def __exit__(self, *excinfo):
        pass
```

`__exit__` は何もせず、`None` を返します。`None` を返すので、途中で例外が起きても、外へそのまま伝わります。

### 3. 非同期版

```python:line-numbers=838
    async def __aenter__(self):
        return self.enter_result

    async def __aexit__(self, *excinfo):
        pass
```

`async with` で使うときは、`__aenter__` と `__aexit__` が同じように働きます。

## ここがすごい

### 条件分岐を `with` の外に出す

ファイルを開くかどうかで、`with` の書き方が変わると、コードが複雑になります。`nullcontext` を使うと、「条件によって本物か、ダミーを選ぶ」という 1 か所の選択で済みます。

### `with` 文の書き方を崩さない

ダミーであっても `with` の形を保てるので、中のコードは本物の場合と同じように書けます。コメントにもあるとおり、「条件が真のときだけ本物を使う」という使い方が想定されています。

### 同期と非同期を両方持つ

普通の `with` と `async with` のどちらでも使えるように、両方のメソッドが用意されています。どちらの場面でも、同じダミーを使い回せます。

## まとめ

- 条件によって処理を分けたいときは、ダミーのコンテキストマネージャを使うと書き方が統一できる。
- `nullcontext` は何もしないので、例外も握りつぶさず、そのまま伝える。
- 同期版と非同期版の両方があるので、どちらの `with` にも使える。
