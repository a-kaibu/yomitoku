---
title: groupby で「グループが 2 つ目まであるか」を見るだけの全一致判定
description: more_itertools.all_equal は、すべての要素が等しいかを調べる。itertools.groupby で同じ値をまとめ、2 つ目のグループがあれば False という、比較を自分で書かない方法をとっている。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [216, 239]
function: all_equal
difficulty: 2
format: 2
tags: [イテレータ, イディオム, 関数型]
---

## ひとことで

`all_equal(iterable)` は、**すべての要素が互いに等しいか** を調べる関数です。
`all_equal('aaaa')` は `True`、`all_equal('aaab')` は `False` です。`key` を渡すと、変換した値で比べます（`all_equal('AaA', key=str.lower)` は `True`）。
本体は、自分で `==` を 1 回も書かずに、`groupby` の数え方だけで答えを出しています。

## コード

::: code-group

```python:line-numbers=216 [日本語訳]
def all_equal(iterable, key=None):
    """
    全要素が互いに等しければ ``True`` を返す。

        >>> all_equal('aaaa')
        True
        >>> all_equal('aaab')
        False

    1 引数を受け取り、変換した値を返す関数を
    of each input item can be specified with *key*:

        >>> all_equal('AaaA', key=str.casefold)
        True
        >>> all_equal([1, 2, 3], key=lambda x: x < 10)
        True

    """
    iterator = groupby(iterable, key)
    for first in iterator:
        for second in iterator:
            return False
        return True
    return True
```

```python:line-numbers=216 [原文]
def all_equal(iterable, key=None):
    """
    Returns ``True`` if all the elements are equal to each other.

        >>> all_equal('aaaa')
        True
        >>> all_equal('aaab')
        False

    A function that accepts a single argument and returns a transformed version
    of each input item can be specified with *key*:

        >>> all_equal('AaaA', key=str.casefold)
        True
        >>> all_equal([1, 2, 3], key=lambda x: x < 10)
        True

    """
    iterator = groupby(iterable, key)
    for first in iterator:
        for second in iterator:
            return False
        return True
    return True
```

:::

`groupby` は `itertools.groupby` です。

## 前提知識

- **`groupby(iterable, key)`**: **連続して** 同じ値（`key` を通した値）が並んでいる部分を 1 つのグループにまとめて、グループを 1 つずつ返すイテレータです。`'aaabba'` なら、`a` のグループ、`b` のグループ、`a` のグループの 3 つが出てきます。
- **同じイテレータを二重の `for` で回す**: 内側の `for` と外側の `for` が **同じイテレータ** を使うと、内側が取り出した分は外側では出てきません。続きから取り出すことになります。
- **`for` の中の `return`**: 関数の途中で `return` すると、ループの途中でも関数が終わります。
- **空のイテラブル**: 要素がないと `for` の中身は 1 回も実行されません。

## 何をしているか

### 1. グループに分けるイテレータを作る

```python:line-numbers=234
    iterator = groupby(iterable, key)
```

`'aaab'` なら、グループは `a` と `b` の 2 つです。

### 2. 1 つ目のグループを取り出す

```python:line-numbers=235
    for first in iterator:
```

外側の `for` で 1 つ目のグループ（`a`）を取り出します。

### 3. 2 つ目のグループがあるか

```python:line-numbers=236
        for second in iterator:
            return False
        return True
```

内側の `for` は同じイテレータの **続き** を取り出そうとします。

- `'aaab'`: 2 つ目のグループ `b` が出てくるので、`return False`。
- `'aaaa'`: グループは 1 つだけなので、内側の `for` は 1 回も回らずに終わり、`return True`。

### 4. 空の場合

```python:line-numbers=239
    return True
```

要素がなければ外側の `for` も回らず、`True` を返します（「全部等しくない要素」が 1 つもないので、真とみなします）。

## ここがすごい

### 「全部同じ ⇔ グループが 1 つ以下」と言い換える

素直に書くと、「最初の要素を覚えて、残りを全部それと比べる」というループになります。この実装は、問題を **「連続する同じ値をまとめたら、グループが 1 つ以下か」** と言い換えています。比較は `groupby` が C の中で行うので、高速です。

### 必要な分しか読まない

2 つ目のグループが見つかった瞬間に `False` を返します。`groupby` は、2 つ目のグループの最初の要素を読んだ時点で「グループが変わった」と判断するので、`'ab' + 'x' * 10**9` のような巨大な入力でも、最初の数文字で答えが出ます。

### `for` を「あるかどうか」の確認に使う

`for second in iterator: return False` は、「もう 1 つ取り出せたら」という意味で `for` を使っています。`next()` と `try`/`except StopIteration` を書くよりも短く、例外の処理も不要です。少しトリッキーですが、Python ではよく使われる書き方です。

### `key` もそのまま渡せる

`groupby` は `key` 関数を受け取れるので、`all_equal` の `key` をそのまま渡すだけで「変換した値での比較」に対応できています。

## まとめ

- 問題を言い換えると、標準の部品だけで解けることがある。
- `groupby` は「連続する同じ値」をまとめるので、「値が変わったか」の判定に使える。
- 同じイテレータを二重の `for` で回すと、「続きがあるか」を調べられる。
