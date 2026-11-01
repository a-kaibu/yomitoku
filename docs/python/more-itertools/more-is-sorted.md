---
title: tee で 1 つずらした 2 本を並べて、隣どうしを比べる
description: more_itertools.is_sorted は、列が並べ替え済みかを True か False で返す。tee で列を 2 本に分け、片方を 1 つ進めてから、隣どうしを lt で比べる。strict と reverse で、判定の厳しさや向きを変えられる。
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
format: 2
tags: [イテレータ, ソート, 関数型]
---

## ひとことで

`is_sorted(iterable)` は、**列の要素が並べ替え済みかどうか** を返す関数です。
`is_sorted([1, 2, 2, 3])` は `True`、`is_sorted([3, 1])` は `False` を返します。

## コード

::: code-group

```python:line-numbers=4060 [日本語訳]
def is_sorted(iterable, key=None, reverse=False, strict=False):
    """イテラブルの要素が並べ替え済みなら ``True`` を、そうでなければ
    ``False`` を返す。*key* と *reverse* は、
    組み込みの :func:`sorted` と同じ意味を持つ。

    >>> is_sorted(['1', '2', '3', '4', '5'], key=int)
    True
    >>> is_sorted([5, 4, 3, 1, 2], reverse=True)
    False

    *strict* が真なら、厳密な昇順かを確かめる。等しい要素があれば ``False`` を返す。
    等しい要素があれば:

    >>> is_sorted([1, 2, 2])
    True
    >>> is_sorted([1, 2, 2], strict=True)
    False

    この関数は、順序が狂った最初の要素を見つけた時点で ``False`` を返す。
    そのため、比較の振る舞いが特殊なオブジェクトでは、
    :func:`sorted` と結果が違うことがある（``math.nan`` など）。
    （``math.nan`` などの場合）。順序が狂った要素がなければ、イテラブルは
    最後まで読み切られる。
    """
    it = iterable if (key is None) else map(key, iterable)
    a, b = tee(it)
    next(b, None)
    if reverse:
        b, a = a, b
    return all(map(lt, a, b)) if strict else not any(map(lt, b, a))
```

```python:line-numbers=4060 [原文]
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

:::

## 前提知識

- **並べ替え済み**: 隣どうしが、小さい順（または大きい順）に並んでいる状態です。
- **`tee`**: 1 つのイテレータを、同じ値を読める 2 つのイテレータに分ける関数です。
- **`lt`**: 「より小さい」を判定する演算子を関数にしたものです。`lt(a, b)` は `a < b` と同じです。
- **`strict`**: 等しい要素を、並べ替え済みとは認めない指定です。

## 何をしているか

### 1. 列を 2 本に分け、片方を 1 つ進める

```python:line-numbers=4084
    it = iterable if (key is None) else map(key, iterable)
    a, b = tee(it)
    next(b, None)
```

`key` があれば、比べる値に変換します。`tee` で列を 2 本に分け、片方を 1 つ先に進めます。こうすると、2 本の列は「今の要素」と「次の要素」の組として並びます。

### 2. 向きを合わせる

```python:line-numbers=4087
    if reverse:
        b, a = a, b
```

`reverse` が真なら、2 本の役割を入れ替えます。大きい順に並んでいるかを、同じ比べ方で確かめられるようにするためです。

### 3. 隣どうしを比べて、結果を返す

```python:line-numbers=4089
    return all(map(lt, a, b)) if strict else not any(map(lt, b, a))
```

`strict` が真なら、どの組も `<` で成り立つかを確かめます。そうでなければ、どの組も「逆向きの `<` は成り立たない」かを確かめます。`not any` で、順序が狂う組が 1 つもないことを判定します。

## ここがすごい

### 2 本の列を並べて比べる

同じ列を 1 つずらして並べると、隣どうしの組が自然に取れます。新しく隣の位置を探す処理を書かずに、比べる組を作れます。

### 比べる条件を、2 通りで書き分ける

`strict` の有無で、判定の式を 1 行で切り替えています。等しい要素を許すか許さないかの違いが、式そのものに表れます。

### 途中で止まる仕組み

`all` と `any` は、結果が決まった時点で読むのを止めます。順序が狂う要素が見つかった時点で、残りは読まれません。

## まとめ

- `tee` で列を 2 本にして 1 つずらすと、隣どうしの組が作れる。
- `strict` や `reverse` の指定を、式の形で切り替えられる。
- `all` や `any` は、結果が決まった時点で止まるので、無駄な読み取りが減る。
