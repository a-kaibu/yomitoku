---
title: 1 つずつ 1 を数える代わりに、1 の列を合計して長さを求める
description: more_itertools.ilen は、イテラブルの要素数を数える。repeat(1) と zip と compress を組み合わせ、要素ごとに 1 を通して sum で足す。全部の要素を読み切るので、使う場面に注意が要る。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [533, 555]
function: ilen
difficulty: 2
format: 2
tags: [イテレータ, 最適化, イディオム]
---

## ひとことで

`ilen(iterable)` は、**イテラブルに入っている要素の個数** を返す関数です。
`ilen(sieve(1000))` は、1,000 未満の素数の個数 `168` を返します。`len` が使えない、ジェネレータのような列にも使えます。

## コード

::: code-group

```python:line-numbers=533 [日本語訳]
def ilen(iterable):
    """*iterable* の要素の個数を返す。

    例えば、1,000 未満の素数は 168 個ある:

        >>> ilen(sieve(1000))
        168

    次のコードと同じ意味だが、これより速い:

        def ilen(iterable):
            count = 0
            for _ in iterable:
                count += 1
            return count

    イテラブルを最後まで読み切るので、注意して使う。

    """
    # これは、この関数の速い版の中で、最も美しいものである。
    # 改良できると思うなら、
    # 10 倍速く、10 倍美しいことを確かめてほしい。
    return sum(compress(repeat(1), zip(iterable)))
```

```python:line-numbers=533 [原文]
def ilen(iterable):
    """Return the number of items in *iterable*.

    For example, there are 168 prime numbers below 1,000:

        >>> ilen(sieve(1000))
        168

    Equivalent to, but faster than::

        def ilen(iterable):
            count = 0
            for _ in iterable:
                count += 1
            return count

    This fully consumes the iterable, so handle with care.

    """
    # This is the "most beautiful of the fast variants" of this function.
    # If you think you can improve on it, please ensure that your version
    # is both 10x faster and 10x more beautiful.
    return sum(compress(repeat(1), zip(iterable)))
```

:::

## 前提知識

- **イテラブル（iterable）**: `for` 文で要素を順に取り出せるものです。ジェネレータもここに含まれます。
- **`repeat(1)`**: `1` を無限に出すイテレータです。
- **`zip(iterable)`**: 1 つの列を渡すと、要素を 1 個入りの組として順に出します。要素の数だけ組ができます。
- **`compress`**: 選択用の列の真偽値に合わせて、値を残すかどうかを決める関数です。
- **`sum`**: 列の要素を足し合わせる組み込み関数です。

## 何をしているか

### 1. 要素ごとに 1 個入りの組を作る

```python:line-numbers=555
    return sum(compress(repeat(1), zip(iterable)))
```

`zip(iterable)` は、要素 1 つにつき 1 組を作ります。この組は、要素の数だけ作られる目印になります。`compress(repeat(1), ...)` は、その目印の数だけ `1` を残し、残りの処理は `sum` に任せます。

## ここがすごい

### 数えずに、足すだけで答えが出る

数を 1 つずつ増やす `count += 1` の形を書く代わりに、要素の数だけ `1` を並べて `sum` で足します。ループ変数を使わない形にまとまっています。

### 作者が「最も美しい速い版」と書く理由

コメントは、この形が速い版の中で最も美しいと述べています。改良したい人には、10 倍速くて 10 倍美しいことを条件として求めています。

### 全部を読み切るので注意

長さを知るには、イテラブルを最後まで読みます。無限の列に使うと終わりません。また、一度読んだ列は、後から読み直せないことがあります。

## まとめ

- 要素ごとに `1` を並べて `sum` すると、ループ変数なしで個数が求まる。
- `len` が使えない列でも、同じ形で個数が取れる。
- 最後まで読み切る処理なので、無限の列や再利用する列では注意する。
