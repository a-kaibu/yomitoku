---
title: 条件を満たす先頭部分と、残りの列を別々に取り出す
description: more_itertools.before_and_after は、条件が True の間の値と、残りのイテレータを別々に返す。tee で元の列を 2 本に分け、takewhile と compress で先頭部分を切り出す。takewhile だけでは失われる境界の値も残る。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [752, 768]
function: before_and_after
difficulty: 3
format: 2
tags: [イテレータ, 遅延評価, 関数型]
---

## ひとことで

`before_and_after(predicate, it)` は、**条件を満たす間の値** と **残りのイテレータ** を、別々に取り出せるように返す関数です。
`before_and_after(str.isupper, iter('ABCdEfGhI'))` は、先頭の `ABC` と、残りの `dEfGhI` を返します。

## コード

::: code-group

```python:line-numbers=752 [日本語訳]
def before_and_after(predicate, it):
    """:func:`takewhile` の変種で、残りのイテレータを完全に使えるようにしたもの。
    残りのイテレータ。

         >>> it = iter('ABCdEfGhI')
         >>> all_upper, remainder = before_and_after(str.isupper, it)
         >>> ''.join(all_upper)
         'ABC'
         >>> ''.join(remainder) # takewhile() だと 'd' が失われてしまう
         'dEfGhI'

    最初のイテレータを全部読み切ってから、次のイテレータを使うこと。
    そうしないと、2 番目のイテレータは正しい結果を出せない。
    """
    trues, after = tee(it)
    trues = compress(takewhile(predicate, trues), zip(after))
    return trues, after
```

```python:line-numbers=752 [原文]
def before_and_after(predicate, it):
    """A variant of :func:`takewhile` that allows complete access to the
    remainder of the iterator.

         >>> it = iter('ABCdEfGhI')
         >>> all_upper, remainder = before_and_after(str.isupper, it)
         >>> ''.join(all_upper)
         'ABC'
         >>> ''.join(remainder) # takewhile() would lose the 'd'
         'dEfGhI'

    Note that the first iterator must be fully consumed before the second
    iterator can generate valid results.
    """
    trues, after = tee(it)
    trues = compress(takewhile(predicate, trues), zip(after))
    return trues, after
```

:::

## 前提知識

- **`takewhile`**: 条件が真の間だけ値を出し、最初に偽になった時点で止まるイテレータです。
- **`tee`**: 1 つのイテレータを、同じ値を読める 2 つのイテレータに分ける関数です。
- **`compress`**: 選択用の列の真偽値に合わせて、値を残したり捨てたりする関数です。
- **イテレータの消費**: 値を読むと、その値は元に戻せません。

## 何をしているか

### 1. 元の列を 2 本に分ける

```python:line-numbers=766
    trues, after = tee(it)
```

`tee` で、同じ値を 2 回読めるように、元のイテレータを 2 つに分けます。片方は先頭部分の判定に使い、もう片方は残りの値として使います。

### 2. 条件が真の間だけを切り出す

```python:line-numbers=767
    trues = compress(takewhile(predicate, trues), zip(after))
```

`takewhile` で条件が真の間の値を出します。`compress` で、もう片方の列の位置に合わせて値を選びます。こうして、先頭部分だけが残ります。

### 3. 2 つのイテレータを返す

```python:line-numbers=768
    return trues, after
```

先頭部分と残りの 2 つを、組にして返します。呼び出し側は、先頭部分をすべて読んでから、残りを使います。

## ここがすごい

### `takewhile` の弱点を補う

`takewhile` だけだと、条件が偽になった最初の値が読まれて消えてしまいます。この関数は、`tee` で残りの列を別に持っているので、その値も失われません。

### 2 本の列の読み方に注意する

先頭部分を読み切ってから、残りを使わないと、残りが正しく出てきません。ドキュメントの注意書きは、この仕組みを表しています。

### 読み方の順番が鍵になる

`tee` の 2 本は、互いに先に進みすぎると、一時的にバッファにためる値が増えます。先頭部分を先に読み切ると、そのためのメモリが減ります。

## まとめ

- `tee` で列を 2 本に分けると、先頭部分と残りを別々に扱える。
- 条件が偽になった境界の値も、残りの列に残るので失われない。
- 先頭部分を先に読み切る順番を守ると、正しい結果が得られる。
