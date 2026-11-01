---
title: 出現回数を、多い順に並べて上位 n 個を返す
description: collections.Counter.most_common は、要素と個数の組を、多い順に並べて返す。n を指定すると、heapq.nlargest で上位 n 個だけを取り出す。Smalltalk の Bag の並べ方を真似している。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/collections/__init__.py
lines: [628, 640]
function: Counter.most_common
difficulty: 2
format: 2
tags: [データ構造, ソート, 標準ライブラリ]
---

## ひとことで

`Counter.most_common(n)` は、**出現回数の多い要素から順に、`(要素, 回数)` の組を n 個返す** メソッドです。
`Counter('abracadabra').most_common(3)` は、`[('a', 5), ('b', 2), ('r', 2)]` を返します。

## コード

::: code-group

```python:line-numbers=628 [日本語訳]
    def most_common(self, n=None):
        '''n 個の、最も多い要素と、その個数を多い順に並べたリストを返す。
        common to the least.  If n is None, then list all element counts.

        >>> Counter('abracadabra').most_common(3)
        [('a', 5), ('b', 2), ('r', 2)]

        '''
        # Smalltalk の Bag.sortedByCount をまねている
        if n is None:
            return sorted(self.items(), key=_itemgetter(1), reverse=True)

        return _nlargest(n, self.items(), key=_itemgetter(1))
```

```python:line-numbers=628 [原文]
    def most_common(self, n=None):
        '''List the n most common elements and their counts from the most
        common to the least.  If n is None, then list all element counts.

        >>> Counter('abracadabra').most_common(3)
        [('a', 5), ('b', 2), ('r', 2)]

        '''
        # Emulate Bag.sortedByCount from Smalltalk
        if n is None:
            return sorted(self.items(), key=_itemgetter(1), reverse=True)

        return _nlargest(n, self.items(), key=_itemgetter(1))
```

:::

`_itemgetter(1)` は、組の 2 番目（回数）を取り出す関数を作ります。`_nlargest` は、`heapq.nlargest` と同じ働きをします。

## 前提知識

- **`Counter`**: 要素ごとの出現回数を数えるための辞書型です。`Counter('abracadabra')` は、`a` が 5 回、`b` が 2 回などと数えます。
- **`items()`**: 辞書の（キー, 値）の組を並べたものを返します。ここでは（要素, 回数）の組です。
- **`key=`**: 並べ替えや最大・最小を決めるときに、比べる値を指定する引数です。
- **`reverse=True`**: 大きい順に並べる指定です。

## 何をしているか

### 1. 全部を並べる場合

```python:line-numbers=637
        if n is None:
            return sorted(self.items(), key=_itemgetter(1), reverse=True)
```

`n` が指定されていなければ、全部の `(要素, 回数)` の組を、回数の大きい順に並べて返します。

### 2. 上位 n 個だけを取る場合

```python:line-numbers=639

        return _nlargest(n, self.items(), key=_itemgetter(1))
```

`n` が指定されていれば、並べ替えではなく、`_nlargest` で回数の大きいものを n 個だけ取り出します。全体を並べるより、無駄が少なくなります。

## ここがすごい

### 全部並べるか、上位だけ取るか

上位 n 個だけが必要なら、全部を並べなくて済みます。`nlargest` は、n 個分の仕組みで答えを出します。`n` を指定する使い方が、特に速さで役立ちます。

### 比べるのは回数だけ

`key=_itemgetter(1)` で、比べる値を回数に絞っています。要素の名前で並べ替えが乱れることはありません。

### 同じ回数のときの順番

全部を並べるとき、同じ回数の要素は、最初に現れた順のまま並びます。並べ替えが安定しているからです。コメントの Smalltalk の並べ方を真似た、という説明は、その設計の経緯を伝えています。

## まとめ

- 出現回数の上位を取るなら、全部並べる代わりに `nlargest` を使うと効率がよい。
- 比べる値を `key` で絞ると、並べ替えの意図が明確になる。
- 全部並べるときは、同じ回数の要素が元の順のまま残る、と覚えておくと読みやすい。
