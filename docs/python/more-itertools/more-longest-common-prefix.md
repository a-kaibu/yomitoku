---
title: 各イテラブルを並べて、全部同じ位置の要素だけを先頭から取る
description: more_itertools.longest_common_prefix は、与えられた複数のイテラブルの最長共通接頭辞の要素を順に返す。zip で同じ位置の要素を縦に並べ、全部同じ間だけ takewhile で取っている。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [2615, 2622]
function: longest_common_prefix
difficulty: 2
format: 2
tags: [文字列処理, アルゴリズム, イテレータ]
---

## ひとことで

`longest_common_prefix(iterables)` は、**与えられたすべてのイテラブルの先頭から、同じ値が続く部分** を返す関数です。
`''.join(longest_common_prefix(['abcd', 'abc', 'abf']))` は `'ab'` になります。`c` が 3 つ目で揃わなくなるので、そこで止まります。

## コード

::: code-group

```python:line-numbers=2615 [日本語訳]
def longest_common_prefix(iterables):
    """与えられた *iterables* の、最長の共通接頭辞の要素を順に出す。

    >>> ''.join(longest_common_prefix(['abcd', 'abc', 'abf']))
    'ab'

    """
    return (c[0] for c in takewhile(all_equal, zip(*iterables)))
```

```python:line-numbers=2615 [原文]
def longest_common_prefix(iterables):
    """Yield elements of the longest common prefix among given *iterables*.

    >>> ''.join(longest_common_prefix(['abcd', 'abc', 'abf']))
    'ab'

    """
    return (c[0] for c in takewhile(all_equal, zip(*iterables)))
```

:::

`takewhile` は、条件が真の間だけ要素を出す関数です。`all_equal` は、すべての要素が等しいかを調べる関数です。

## 前提知識

- **接頭辞（prefix）**: 文字列などの先頭にある部分です。`'ab'` は `'abcd'` の接頭辞です。
- **`zip(*iterables)`**: 複数のイテラブルの同じ位置の要素を、組にして出します。`['abcd', 'abc', 'abf']` なら、`('a', 'a', 'a')`、`('b', 'b', 'b')`、`('c', 'c', 'f')` のように縦に並べます。
- **`takewhile(pred, it)`**: 条件が真の間だけ要素を出し、最初に偽になったところで止まります。
- **`c[0]`**: 組の中の最初の要素を取り出します。全部同じなので、どれを取っても同じ値です。

## 何をしているか

### 1. 同じ位置の要素を縦に並べる

```python:line-numbers=2622
    return (c[0] for c in takewhile(all_equal, zip(*iterables)))
```

`zip(*iterables)` が、各位置の要素を組にします。位置ごとに、すべての入力の文字が並ぶ形になります。

### 2. 全部同じ間だけ取る

```python:line-numbers=2622
    return (c[0] for c in takewhile(all_equal, zip(*iterables)))
```

`takewhile(all_equal, ...)` は、組の中の全部の要素が同じ間だけ出します。違う要素が出た時点で止まるので、先頭からの共通部分だけが残ります。

### 3. 1 つ目の値を取り出す

```python:line-numbers=2622
    return (c[0] for c in takewhile(all_equal, zip(*iterables)))
```

各組は全部同じ値なので、`c[0]` で 1 つだけ取り出して出します。結果はジェネレータなので、`''.join` で文字列にできます。

## ここがすごい

### 縦に並べると、比べるのが 1 行

2 つのものの共通部分を探すとき、普通は 2 重のループを書きたくなります。`zip` で位置をそろえると、「同じ位置の全部が等しいか」を 1 つの判定で済ませられます。

### 途中で止まる

`takewhile` は違いが見つかった時点で止まるので、長い入力でも、必要な位置までしか読みません。

### 無限のイテラブルでも、全部一致しなければ終わる

どれかが途中で終わると、`zip` も止まります。そのため、有限の入力が混ざっていても安全に共通部分を求められます。

## まとめ

- 位置ごとの要素を縦に並べると、共通部分を 1 つの判定で探せる。
- `takewhile` で、最初に食い違った場所で止めると、共通の先頭だけが残る。
- 結果をジェネレータで返すと、大きな入力でも必要な分だけ作られる。
