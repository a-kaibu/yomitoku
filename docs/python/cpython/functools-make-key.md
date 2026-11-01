---
title: lru_cache のキーを「平らに」作ってメモリと時間を節約する
description: functools.lru_cache が引数からキャッシュのキーを作る関数。タプルを入れ子にしない、よく使う型は包まないなど、細かい最適化が詰まっている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/functools.py
lines: [504, 535]
function: _make_key
difficulty: 2
format: 2
tags: [キャッシュ, 最適化, ハッシュ, 標準ライブラリ]
---

## ひとことで

`_make_key` は、`@lru_cache`（関数の結果を覚えておくデコレータ）が「この引数での呼び出しは前にもあったか？」を調べるための **辞書のキー** を作る関数です。
`f(1, 2, mode="fast")` のような呼び出しを、`(1, 2, <目印>, "mode", "fast")` という 1 本の平らなタプルに変換します。

## コード

::: code-group

```python:line-numbers=504 [日本語訳]
def _make_key(args, kwds, typed,
             kwd_mark = (object(),),
             fasttypes = {int, str},
             tuple=tuple, type=type, len=len):
    """Make a cache key from optionally typed positional and keyword arguments

    The key is constructed in a way that is flat as possible rather than
    as a nested structure that would take more memory.

    If there is only a single argument and its data type is known to cache
    its hash value, then that argument is returned without a wrapper.  This
    saves space and improves lookup speed.

    """
    # 以下のコードは、kwds がユーザーの渡した順序を保つことに依存している。
    # 以前は、ループの前に kwds を sorted() していた。新しい方法は*ずっと*
    # 速い。その代わり、f(x=1, y=2) と f(y=2, x=1) は別の呼び出しとして
    # 別々にキャッシュされる。
    key = args
    if kwds:
        key = list(key)
        key += kwd_mark
        for item in kwds.items():
            key += item
        key = tuple(key)
    if typed:
        key += tuple([type(v) for v in args])
        if kwds:
            key += tuple([type(v) for v in kwds.values()])
    elif len(key) == 1 and type(key[0]) in fasttypes:
        return key[0]
    return key
```

```python:line-numbers=504 [原文]
def _make_key(args, kwds, typed,
             kwd_mark = (object(),),
             fasttypes = {int, str},
             tuple=tuple, type=type, len=len):
    """Make a cache key from optionally typed positional and keyword arguments

    The key is constructed in a way that is flat as possible rather than
    as a nested structure that would take more memory.

    If there is only a single argument and its data type is known to cache
    its hash value, then that argument is returned without a wrapper.  This
    saves space and improves lookup speed.

    """
    # All of code below relies on kwds preserving the order input by the user.
    # Formerly, we sorted() the kwds before looping.  The new way is *much*
    # faster; however, it means that f(x=1, y=2) will now be treated as a
    # distinct call from f(y=2, x=1) which will be cached separately.
    key = args
    if kwds:
        key = list(key)
        key += kwd_mark
        for item in kwds.items():
            key += item
        key = tuple(key)
    if typed:
        key += tuple([type(v) for v in args])
        if kwds:
            key += tuple([type(v) for v in kwds.values()])
    elif len(key) == 1 and type(key[0]) in fasttypes:
        return key[0]
    return key
```

:::

## 前提知識

- **`*args` と `**kwargs`**: Python の関数は、位置引数をタプル（`args`）、キーワード引数を辞書（`kwds`）としてまとめて受け取れます。この関数はそれらをそのまま受け取っています。
- **タプル**: `(1, 2)` のような変更できない並び。中身がハッシュ可能ならタプルもハッシュ可能で、辞書のキーにできます。
- **ハッシュ**: 辞書が値を高速に探すために、キーから計算する整数です。
- **デフォルト引数は 1 回だけ評価される**: `kwd_mark = (object(),)` のようなデフォルト値は、関数を定義したときに 1 回だけ作られ、以後ずっと同じオブジェクトが使われます。
- **辞書は挿入順を保つ**: Python 3.7 以降、辞書は要素を入れた順番を覚えています。
- **`type(v)`**: 値 `v` の型（`int` や `str` など）を返します。

## 何をしているか

### 1. 位置引数をそのままキーにする

```python:line-numbers=522
    key = args
```

`key = args` です。`f(1, 2)` なら `key` は `(1, 2)` です。

### 2. キーワード引数があれば平らに追加する

```python:line-numbers=523
    if kwds:
        key = list(key)
        key += kwd_mark
        for item in kwds.items():
            key += item
        key = tuple(key)
```

`f(1, 2, mode="fast")` の場合、

1. `list(key)` で `[1, 2]` にする
2. 目印 `kwd_mark`（中身は `(<object>,)`）を連結 → `[1, 2, <object>]`
3. `kwds.items()` の各 `("mode", "fast")` を連結 → `[1, 2, <object>, "mode", "fast"]`
4. 最後にタプルに戻す

目印があるので、`f(1, 2, "mode", "fast")`（全部位置引数）とは別のキーになります。

### 3. typed=True なら型も入れる

```python:line-numbers=529
    if typed:
        key += tuple([type(v) for v in args])
        if kwds:
            key += tuple([type(v) for v in kwds.values()])
```

`@lru_cache(typed=True)` のときは、`f(3)` と `f(3.0)` を区別したいので、引数の型をキーの後ろに足します。

### 4. 引数 1 個で int か str ならそのまま返す

```python:line-numbers=533
    elif len(key) == 1 and type(key[0]) in fasttypes:
        return key[0]
    return key
```

`f(42)` のときは、タプル `(42,)` を作らずに `42` そのものをキーにします。

## ここがすごい

### 入れ子にしない

素直に書くなら `key = (args, tuple(sorted(kwds.items())))` のような入れ子のタプルになります。しかし入れ子にすると、タプルの中にタプルが入り、オブジェクトの数が増えてメモリを使います。ハッシュの計算も入れ子をたどる分だけ遅くなります。
1 本の平らなタプルにすることで、キャッシュに大量のエントリがたまったときのメモリを抑えています。

### 「ソートしない」という決断

コメントにあるとおり、以前はキーワード引数をソートしてから並べていました。今は辞書が挿入順を保つので、そのまま並べています。その代わり `f(x=1, y=2)` と `f(y=2, x=1)` は別々にキャッシュされますが、**毎回のソートを省けるほうが得** という判断です。

### よく使う型は包まない

`int` と `str` は、ハッシュ値の計算が速い（`str` は一度計算したハッシュ値を覚えています）ので、タプルで包まずにそのままキーにします。メモリも時間も節約できます。
`fasttypes` が `int` と `str` だけなのには理由があります。たとえば `float` を許すと、`f(3)` と `f(3.0)` が等しいキーと見なされたときに型の情報が失われるなど、思わぬ衝突の扱いが必要になるからです。

### グローバル参照をデフォルト引数で速くする

`tuple=tuple, type=type, len=len` は、組み込み関数をデフォルト引数として **ローカル変数に取り込む** 古典的な高速化テクニックです。Python ではローカル変数の参照がグローバル・組み込みの参照より速いため、何度も呼ばれる関数では効果があります。

## まとめ

- キャッシュのキーは「区別できること」と「軽いこと」の両方が大事。
- 目印オブジェクトを挟むと、平らな並びでも境界を区別できる。
- 毎回の正規化（ソート）をやめて、たまの重複キャッシュを許すというトレードオフもある。
- デフォルト引数に組み込み関数を入れると、参照が速くなる。
