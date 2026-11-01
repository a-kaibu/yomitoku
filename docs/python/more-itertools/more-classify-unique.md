---
title: 各要素に「直前と違うか」「初めてか」の 2 つの印を付ける
description: more_itertools.classify_unique は、各要素を (要素, 直前と違うか, 初めて現れたか) の 3 つ組で返す。unique_justseen と unique_everseen の判定を 1 回のループで同時に行う。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [4832, 4871]
function: classify_unique
difficulty: 2
format: 2
tags: [イテレータ, データ構造, アルゴリズム]
---

## ひとことで

`classify_unique(iterable)` は、各要素について **「直前の要素と違うか」「それまでに一度も現れていないか」** の 2 つの真偽値を付けて返す関数です。
`classify_unique('otto')` は、`('o', True, True)`、`('t', True, True)`、`('t', False, False)`、`('o', True, False)` を返します。

## コード

::: code-group

```python:line-numbers=4832 [日本語訳]
def classify_unique(iterable, key=None):
    """各要素を、一意性の観点で分類する。

    For each element in the input iterable, return a 3-tuple consisting of:

    1. The element itself
    2. ``False`` if the element is equal to the one preceding it in the input,
       ``True`` otherwise (i.e. the equivalent of :func:`unique_justseen`)
    3. ``False`` if this element has been seen anywhere in the input before,
       ``True`` otherwise (i.e. the equivalent of :func:`unique_everseen`)

    >>> list(classify_unique('otto'))    # doctest: +NORMALIZE_WHITESPACE
    [('o', True,  True),
     ('t', True,  True),
     ('t', False, False),
     ('o', True,  False)]

    This function is analogous to :func:`unique_everseen` and is subject to
    the same performance considerations.

    """
    seen_set = set()
    seen_list = []
    use_key = key is not None
    previous = None

    for i, element in enumerate(iterable):
        k = key(element) if use_key else element
        is_unique_justseen = not i or previous != k
        previous = k
        is_unique_everseen = False
        try:
            if k not in seen_set:
                seen_set.add(k)
                is_unique_everseen = True
        except TypeError:
            if k not in seen_list:
                seen_list.append(k)
                is_unique_everseen = True
        yield element, is_unique_justseen, is_unique_everseen
```

```python:line-numbers=4832 [原文]
def classify_unique(iterable, key=None):
    """Classify each element in terms of its uniqueness.

    For each element in the input iterable, return a 3-tuple consisting of:

    1. The element itself
    2. ``False`` if the element is equal to the one preceding it in the input,
       ``True`` otherwise (i.e. the equivalent of :func:`unique_justseen`)
    3. ``False`` if this element has been seen anywhere in the input before,
       ``True`` otherwise (i.e. the equivalent of :func:`unique_everseen`)

    >>> list(classify_unique('otto'))    # doctest: +NORMALIZE_WHITESPACE
    [('o', True,  True),
     ('t', True,  True),
     ('t', False, False),
     ('o', True,  False)]

    This function is analogous to :func:`unique_everseen` and is subject to
    the same performance considerations.

    """
    seen_set = set()
    seen_list = []
    use_key = key is not None
    previous = None

    for i, element in enumerate(iterable):
        k = key(element) if use_key else element
        is_unique_justseen = not i or previous != k
        previous = k
        is_unique_everseen = False
        try:
            if k not in seen_set:
                seen_set.add(k)
                is_unique_everseen = True
        except TypeError:
            if k not in seen_list:
                seen_list.append(k)
                is_unique_everseen = True
        yield element, is_unique_justseen, is_unique_everseen
```

:::

## 前提知識

- **`unique_justseen`**: 連続する同じ値を 1 つにまとめる関数です。直前と違うかどうかを判定します。
- **`unique_everseen`**: 最初に現れた要素だけを出す関数です。それまでに現れたかどうかを判定します。
- **`enumerate`**: 要素と番号の組を作ります。ここでは、先頭の要素かどうかを判定するために使います。
- **`set` と `TypeError`**: 集合に入れられない値は、リストで覚えるための工夫です。

## 何をしているか

### 1. 比べる値と、直前の値を用意する

```python:line-numbers=4858
    for i, element in enumerate(iterable):
        k = key(element) if use_key else element
        is_unique_justseen = not i or previous != k
        previous = k
```

要素ごとに、比べる値 `k` を決めます。先頭の要素は、必ず「直前と違う」として扱います。そのあと、今の値を `previous` として覚えます。

### 2. それまでに現れたかを判定する

```python:line-numbers=4862
        is_unique_everseen = False
        try:
            if k not in seen_set:
                seen_set.add(k)
                is_unique_everseen = True
        except TypeError:
            if k not in seen_list:
                seen_list.append(k)
                is_unique_everseen = True
```

集合（ハッシュできない値はリスト）に `k` があるかを調べ、なければ覚えて `True` にします。

### 3. 3 つ組を出す

```python:line-numbers=4871
        yield element, is_unique_justseen, is_unique_everseen
```

元の要素と、2 つの判定の結果を組にして返します。

## ここがすごい

### 2 つの判定を 1 回のループで

`unique_justseen` と `unique_everseen` は、どちらも同じ入力を読みます。この関数は、1 回の読み込みで両方の判定を済ませます。大きな入力でも、読むのは一度だけです。

### 「直前と同じ」と「過去に同じ」の違い

`'otto'` の 3 番目の `t` は、直前と同じなので `False` です。さらに、過去にも現れているので、2 つ目の判定も `False` です。4 番目の `o` は、直前とは違うので `True` ですが、過去にあるので `False` です。2 つの判定の違いがよく分かる例です。

### 先頭の判定を `not i` で

`not i` は、番号が 0 のときだけ真です。先頭の要素には直前がないので、番号で特別扱いしています。

## まとめ

- 2 種類の重複判定は、同じループの中で同時に行える。
- 「直前と同じ」と「過去に同じ」は別の概念なので、分けて記録する。
- 先頭の要素のような特別な場合は、番号で判定すると簡潔になる。
