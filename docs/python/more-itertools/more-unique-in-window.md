---
title: 直近 n 個の中に同じ値がない要素だけを出す
description: more_itertools.unique_in_window は、直近 n 個の窓の中で 1 回しか現れない要素を出す。窓の外に出た古い値は忘れるので、遠く離れた同じ値は再び出てくる。カウンタと deque を組み合わせて管理する。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [4736, 4780]
function: unique_in_window
difficulty: 3
format: 2
tags: [イテレータ, データ構造, アルゴリズム]
---

## ひとことで

`unique_in_window(iterable, n)` は、**直近 `n` 個の中に同じ値がない要素だけを出す** 関数です。
`unique_in_window([0, 1, 0, 2, 3, 0], 3)` は `[0, 1, 2, 3, 0]` を出します。3 つめの `0` は直近 3 個の中にあるので出ません。窓から外れた後の `0` は、また出ます。

## コード

::: code-group

```python:line-numbers=4736 [日本語訳]
def unique_in_window(iterable, n, key=None):
    """最近は見ていない要素だけを、*iterable* から出す。
    *n* is the size of the sliding window.

        >>> iterable = [0, 1, 0, 2, 3, 0]
        >>> n = 3
        >>> list(unique_in_window(iterable, n))
        [0, 1, 2, 3, 0]

    The *key* function, if provided, will be used to determine uniqueness:

        >>> list(unique_in_window('abAcda', 3, key=lambda x: x.lower()))
        ['a', 'b', 'c', 'd', 'a']

    Updates a sliding window no larger than n and yields a value
    if the item only occurs once in the updated window.

    When `n == 1`, *unique_in_window* is memoryless:

        >>> list(unique_in_window('aab', n=1))
        ['a', 'a', 'b']

    The items in *iterable* must be hashable.

    """
    if n <= 0:
        raise ValueError('n must be greater than 0')

    window = deque(maxlen=n)
    counts = Counter()
    use_key = key is not None

    for item in iterable:
        if len(window) == n:
            to_discard = window[0]
            if counts[to_discard] == 1:
                del counts[to_discard]
            else:
                counts[to_discard] -= 1

        k = key(item) if use_key else item
        if k not in counts:
            yield item
        counts[k] += 1
        window.append(k)
```

```python:line-numbers=4736 [原文]
def unique_in_window(iterable, n, key=None):
    """Yield the items from *iterable* that haven't been seen recently.
    *n* is the size of the sliding window.

        >>> iterable = [0, 1, 0, 2, 3, 0]
        >>> n = 3
        >>> list(unique_in_window(iterable, n))
        [0, 1, 2, 3, 0]

    The *key* function, if provided, will be used to determine uniqueness:

        >>> list(unique_in_window('abAcda', 3, key=lambda x: x.lower()))
        ['a', 'b', 'c', 'd', 'a']

    Updates a sliding window no larger than n and yields a value
    if the item only occurs once in the updated window.

    When `n == 1`, *unique_in_window* is memoryless:

        >>> list(unique_in_window('aab', n=1))
        ['a', 'a', 'b']

    The items in *iterable* must be hashable.

    """
    if n <= 0:
        raise ValueError('n must be greater than 0')

    window = deque(maxlen=n)
    counts = Counter()
    use_key = key is not None

    for item in iterable:
        if len(window) == n:
            to_discard = window[0]
            if counts[to_discard] == 1:
                del counts[to_discard]
            else:
                counts[to_discard] -= 1

        k = key(item) if use_key else item
        if k not in counts:
            yield item
        counts[k] += 1
        window.append(k)
```

:::

## 前提知識

- **窓（window）**: 直近の `n` 個の要素のことです。新しい要素が来ると、一番古い要素が外れます。
- **`Counter`**: 値ごとの出現回数を数える辞書型です。
- **`deque(maxlen=n)`**: 最大 `n` 個を覚える箱です。満杯のときに追加すると、古いものが自動で捨てられます。
- **ハッシュ可能**: 辞書のキーに使える型です。この関数では、要素をキーとして数えるので、ハッシュ可能である必要があります。

## 何をしているか

### 1. 窓が満杯なら、一番古い要素を数えから引く

```python:line-numbers=4768
    for item in iterable:
        if len(window) == n:
            to_discard = window[0]
            if counts[to_discard] == 1:
                del counts[to_discard]
            else:
                counts[to_discard] -= 1
```

窓の長さが `n` になっていれば、一番古い要素 `to_discard` を数えから 1 つ減らします。数が 0 になれば、辞書から消します。

### 2. 今の要素が窓にないなら、出す

```python:line-numbers=4776
        k = key(item) if use_key else item
        if k not in counts:
            yield item
```

`k` が数えの辞書にまだなければ、直近 `n` 個の中にないので、要素を出します。

### 3. 数えて、窓に入れる

```python:line-numbers=4779
        counts[k] += 1
        window.append(k)
```

今の要素の数を 1 増やし、窓の末尾に追加します。

## ここがすごい

### 「最近見た」だけを覚える

全部の履歴を覚えると、メモリが増え続けます。この関数は窓の中の `n` 個だけを覚えるので、長い入力でもメモリは一定です。代わりに、窓から出た値は忘れられます。

### 窓から外れる処理を先に書く

要素を出す判定の前に、古い要素を数えから引いています。順番を逆にすると、窓から外れる前の値が残ってしまい、正しい結果になりません。

### `n == 1` は、直前の値だけを覚える

docstring にあるとおり、`n == 1` だと、直前の要素はすぐ窓から外れるので、重複の判定がほとんど効きません。`unique_in_window('aab', n=1)` は `a, a, b` がすべて出ます。窓の大きさで、覚える範囲が変わるという性質がよく分かります。

## まとめ

- 直近の範囲だけで重複を調べるなら、窓と数えを組み合わせて管理する。
- 窓から外れたものは忘れられるので、メモリが増えない。
- 判定の前に、窓から外れる処理を済ませておく。
