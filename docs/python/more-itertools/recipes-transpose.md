---
title: 行と列を入れ替えて、行列の向きを変える
description: more_itertools.transpose は、行列の行と列を入れ替える。zip に行を * で展開して渡し、strict=True で行の長さがそろっていなければ例外を出す。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [963, 972]
function: transpose
difficulty: 2
format: 2
tags: [アルゴリズム, 数値計算, 防御的プログラミング]
---

## ひとことで

`transpose(matrix)` は、**行列の行と列を入れ替えた列** を返す関数です。
`transpose([(1, 2, 3), (11, 22, 33)])` は、`(1, 11)`、`(2, 22)`、`(3, 33)` の順に値を出します。縦に並んだデータを、横に読み替えたいときに使えます。

## コード

::: code-group

```python:line-numbers=963 [日本語訳]
def transpose(matrix):
    """入力された行列の行と列を入れ替える。

    >>> list(transpose([(1, 2, 3), (11, 22, 33)]))
    [(1, 11), (2, 22), (3, 33)]

    呼び出し側は、入力の次元がそろっていることを確かめるべきである。
    入力が空なら、何も出力しない。
    """
    return zip(*matrix, strict=True)
```

```python:line-numbers=963 [原文]
def transpose(matrix):
    """Swap the rows and columns of the input matrix.

    >>> list(transpose([(1, 2, 3), (11, 22, 33)]))
    [(1, 11), (2, 22), (3, 33)]

    The caller should ensure that the dimensions of the input are compatible.
    If the input is empty, no output will be produced.
    """
    return zip(*matrix, strict=True)
```

:::

## 前提知識

- **行列**: 数を縦と横の表に並べたものです。行は横の並び、列は縦の並びです。
- **転置**: 行と列を入れ替えることです。`(i, j)` の要素が `(j, i)` に移ります。
- **`*` による展開**: リストの中身を、関数の引数として並べて渡す書き方です。
- **`zip`**: 複数の列を、同じ位置どうしでまとめる組み込み関数です。

## 何をしているか

### 1. 行を引数として並べて、`zip` に渡す

```python:line-numbers=972
    return zip(*matrix, strict=True)
```

`zip(*matrix)` は、各行を引数として渡します。すると `zip` は、行の同じ位置にある値どうしをまとめます。これがそのまま、列になります。`strict=True` を付けているので、行の長さが違うと `ValueError` になります。

## ここがすごい

### 1 行で入れ替えが済む

行と列の入れ替えを、2 重のループなしで書けます。`*` と `zip` の組み合わせが、転置そのものを表しています。

### 長さの違いを見逃さない

`strict=True` があるので、行の長さがそろっていないとき、黙って切り捨てずに例外を出します。列の数が違う行列は、誤った結果になりやすいので、この設計は安全です。

### 空の入力は何も出ない

入力が空なら、`zip` は何も返しません。特別な分岐を書かなくても、空の結果が自然に得られます。

## まとめ

- 行を `*` で展開して `zip` に渡すと、1 行で転置できる。
- `strict=True` で長さの違いを検出すると、誤った結果を防げる。
- 空の入力を、特別扱いせずに済む設計になっている。
