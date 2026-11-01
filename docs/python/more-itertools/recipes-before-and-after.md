---
title: tee と compress と zip で「条件が崩れた要素」を取りこぼさない
description: more_itertools.before_and_after は、条件を満たす先頭部分と、それ以降の残りを 2 つのイテレータに分ける。takewhile が捨ててしまう要素を、イテレータの複製と歩調合わせで救い出している。
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
tags: [イテレータ, ハック, 遅延評価]
---

## ひとことで

`before_and_after(predicate, it)` は、データを **条件を満たし続ける先頭部分** と **それ以降の残り** の 2 つに分ける関数です。
`before_and_after(str.isupper, 'ABCdEfGhI')` は、`'ABC'` を出すものと `'dEfGhI'` を出すものを返します。
標準の `takewhile` だけでは、条件を満たさなかった最初の要素（ここでは `d`）が失われてしまいますが、この関数はそれを取りこぼしません。

## コード

::: code-group

```python:line-numbers=752 [日本語訳]
def before_and_after(predicate, it):
    """:func:`takewhile` の変種で、イテレータの残り全体に完全にアクセスできる。
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

`tee`、`compress`、`takewhile` は `itertools` の関数です。

## 前提知識

- **`takewhile(pred, it)`**: 先頭から、条件を満たす間だけ要素を出します。条件を満たさない要素に出会うと止まりますが、**その要素はすでに読んでしまっていて、捨てられます**。
- **`tee(it)`**: 1 本のイテレータを、同じ値を出す 2 本に複製します。2 本は別々の速さで読み進められます。
- **`compress(data, selectors)`**: `data` と `selectors` を同時に 1 つずつ読み、`selectors` の値が真のときだけ `data` の値を出します。
- **`zip(after)`**: 引数が 1 つだけの `zip` は、`after` の各要素を 1 要素のタプル `(x,)` にして出します。タプルは空でなければ真です。
- **イテレータは読んだら進む**: どのイテレータも、値を取り出すたびに現在位置が進みます。

## 何をしているか

`it = iter('ABCdEfGhI')`、条件は「大文字か」で追います。

### 1. 2 本に複製する

```python:line-numbers=766
    trues, after = tee(it)
```

`trues` と `after` は、どちらも `'ABCdEfGhI'` を最初から出す 2 本のイテレータです。

### 2. 先頭部分を作る

```python:line-numbers=767
    trues = compress(takewhile(predicate, trues), zip(after))
```

`compress(takewhile(predicate, trues), zip(after))` が 1 つ値を出すたびに、

1. `takewhile` から 1 つ読む（`trues` が 1 つ進む）
2. `zip(after)` から 1 つ読む（`after` も 1 つ進む）
3. `(x,)` は真なので、1 の値を出す

という動きをします。`A`, `B`, `C` までは、`trues` と `after` が **同じ歩調で** 進みます。

### 3. 条件が崩れたとき

4 回目、`takewhile` は `d` を読んで条件を満たさないので止まります。`compress` は `data` 側が尽きた時点で終わるので、`zip(after)` からは読みません。
その結果、**`after` は `C` の直後、つまり `d` の手前で止まっています**。`after` を読むと `d, E, f, G, h, I` が出てきます。

## ここがすごい

### 捨てられる 1 要素を救う

`takewhile` の弱点は、「条件を満たさない最初の要素」を読んで捨ててしまうことです。残りを知りたいとき、その要素だけが行方不明になります。
この関数は、データを `tee` で 2 本にし、**先頭部分として出した数だけ** `after` を進めることで、`after` がちょうど崩れた要素の位置で止まるようにしています。

### 「歩調を合わせる」役を compress と zip にやらせる

`compress` は本来「選択フラグに応じて値を間引く」道具ですが、ここではフラグとして `zip(after)` を渡し、**常に真だが、読むたびに `after` を 1 つ進める** という副作用だけを利用しています。`zip` で 1 要素タプルにしているのは、`after` の値が `0` や空文字列のような「偽」の値でも、必ず真として扱うためです。

### 使うときの約束

docstring にあるとおり、先頭部分を最後まで読んでから残りを読む必要があります。先に `after` を読んでしまうと、歩調がずれるからです。この約束と引き換えに、ループや状態変数を一切書かずに実現しています。

## まとめ

- `takewhile` は条件を満たさない最初の要素を捨ててしまう。
- `tee` で複製し、もう一方を「出した数だけ」進めると、境界の要素を残せる。
- 標準の部品を、本来の目的とは違う「副作用」のために使うテクニックもある。
