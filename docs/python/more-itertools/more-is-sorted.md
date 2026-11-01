---
title: tee で 1 つずらした 2 本を並べて「隣どうし」を比べる
description: more_itertools.is_sorted は、データが小さい順に並んでいるかを調べる。データを複製して 1 つずらし、operator.lt を map で一斉に適用するという、ループを書かない書き方。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [4060, 4089]
function: is_sorted
difficulty: 2
tags: [イテレータ, ソート, 関数型]
---
## ひとことで

`is_sorted(iterable)` は、データが **小さい順に並んでいるか** を調べる関数です。
`is_sorted([1, 2, 2, 3])` は `True`、`is_sorted([1, 3, 2])` は `False` です。`reverse=True` で大きい順、`strict=True` で「等しいものを許さない」判定もできます。
隣どうしを比べるために、データを 2 本に複製して 1 つずらす、という方法をとっています。

## コード

```python:line-numbers=4060
def is_sorted(iterable, key=None, reverse=False, strict=False):
    """Returns ``True`` if the items of iterable are in sorted order, and
    ``False`` otherwise. *key* and *reverse* have the same meaning that they do
    in the built-in :func:`sorted` function.

    >>> is_sorted(['1', '2', '3', '4', '5'], key=int)
    True
    >>> is_sorted([5, 4, 3, 1, 2], reverse=True)
    False

    If *strict*, tests for strict sorting, that is, returns ``False`` if equal
    elements are found:

    >>> is_sorted([1, 2, 2])
    True
    >>> is_sorted([1, 2, 2], strict=True)
    False

    The function returns ``False`` after encountering the first out-of-order
    item, which means it may produce results that differ from the built-in
    :func:`sorted` function for objects with unusual comparison dynamics
    (like ``math.nan``). If there are no out-of-order items, the iterable is
    exhausted.
    """
    it = iterable if (key is None) else map(key, iterable)
    a, b = tee(it)
    next(b, None)
    if reverse:
        b, a = a, b
    return all(map(lt, a, b)) if strict else not any(map(lt, b, a))
```

`tee` は `itertools.tee`、`lt` は `operator.lt`（`lt(a, b)` は `a < b` と同じ）です。

## 前提知識

- **`map(f, xs)`**: `xs` の各要素に `f` を適用します。
- **`map(f, xs, ys)`**: 引数を 2 つ渡すと、`f(xs[0], ys[0])`、`f(xs[1], ys[1])`、…… と、2 本を同時に読みながら適用します。短い方が尽きたら終わります。
- **`tee(it)`**: 1 本のイテレータを、同じ値を出す 2 本に複製します。
- **`next(b, None)`**: `b` から 1 つ取り出して捨てます。空なら `None` が返るだけでエラーになりません。
- **`all(...)`**: 全部が真なら真。1 つでも偽があればその時点で偽を返します。
- **`any(...)`**: 1 つでも真があればその時点で真を返します。
- **`not`**: 真偽を反転します。

## 何をしているか

`[1, 2, 2, 3]` で追います。

### 1. key があれば変換する（4084 行目）

`key` が指定されていれば、各要素を `key` で変換した値で比べます。

### 2. 2 本に複製して、片方を 1 つ進める（4085〜4086 行目）

`a` は `1, 2, 2, 3`、`b` は 1 つ進めたので `2, 2, 3` です。これで `(a, b)` を同時に読むと、`(1, 2), (2, 2), (2, 3)` と **隣どうしの組** になります。

### 3. 逆順なら入れ替える（4087〜4088 行目）

大きい順を調べるときは、`a` と `b` を入れ替えて比べる向きを逆にします。

### 4. 比べる（4089 行目）

- 非厳密（デフォルト）: 「後ろの方が小さい組（`b < a`）が 1 つもない」なら並んでいる。`not any(map(lt, b, a))`。`(2, 2)` は `2 < 2` が偽なので問題ありません。
- 厳密: 「すべての組で前の方が小さい（`a < b`）」なら並んでいる。`all(map(lt, a, b))`。`(2, 2)` で偽になります。

## ここがすごい

### 「ずらして重ねる」で隣どうしを作る

リストなら `data[i] <= data[i + 1]` を添字で調べられますが、ジェネレータでは添字が使えません。`tee` で 2 本にして 1 本だけ 1 つ進めれば、`zip` のように並べたときに隣どうしの組ができます。これは `pairwise`（隣どうしの組を作る関数）と同じ考え方です。

### `<` だけで `<=` も表す

非厳密な判定は、`a <= b` ではなく「`b < a` が 1 つもない」と書いています。こうすると、使う比較演算子が `<` だけになり、`__lt__` しか定義していないオブジェクトでも判定できます。Python の `sorted()` が `<` だけで動くのと合わせています。

### 途中で止まる

`all` と `any` は、答えが決まった時点で読むのをやめます。先頭の 2 つが逆順なら、残りが 100 万個あっても 1 回の比較で `False` が返ります。

### ループの中身がすべて C

`map`、`lt`、`all`、`any`、`tee` はどれも C で実装されているので、Python のループで 1 つずつ比べるよりずっと速く動きます。

## まとめ

- データを複製して 1 つずらすと、隣どうしの組が作れる。
- `<=` は「逆の `<` がない」と言い換えると、`<` だけで判定できる。
- `all` と `any` は答えが出た時点で止まるので、大きなデータでも無駄がない。
