---
title: 「10 倍速く、10 倍美しく」と挑発する、イテレータの長さの数え方
description: "more_itertools.ilen は、len() が使えないイテレータの要素数を数える。sum(compress(repeat(1), zip(iterable))) という 1 行で、要素を保存せずに C の速さで数えている。"
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [533, 555]
function: ilen
difficulty: 2
tags: [イテレータ, 最適化, ハック]
---
## ひとことで

`ilen(iterable)` は、ジェネレータのように `len()` が使えないものの **要素数を数える** 関数です。
`ilen(x for x in range(1000000) if x % 10 == 0)` は `100000` を返します。
本体はたった 1 行で、552〜554 行目のコメントには「これを改良できると思うなら、10 倍速く、かつ 10 倍美しいことを確かめてほしい」という挑戦状まで書かれています。

## コード

```python:line-numbers=533
def ilen(iterable):
    """Return the number of items in *iterable*.

    For example, there are 168 prime numbers below 1,000:

        >>> ilen(sieve(1000))
        168

    Equivalent to, but faster than::

        def ilen(iterable):
            count = 0
            for _ in iterable:
                count += 1
            return count

    This fully consumes the iterable, so handle with care.

    """
    # This is the "most beautiful of the fast variants" of this function.
    # If you think you can improve on it, please ensure that your version
    # is both 10x faster and 10x more beautiful.
    return sum(compress(repeat(1), zip(iterable)))
```

`compress`、`repeat` は `itertools` の関数です。

## 前提知識

- **`len()` が使えないもの**: ジェネレータなどは、最後まで取り出さないと要素数がわかりません。
- **`zip(iterable)`**: 引数が 1 つの `zip` は、各要素を 1 要素のタプル `(x,)` にして出します。タプルは空でなければ必ず「真」です。
- **`repeat(1)`**: `1` を無限に出し続けるイテレータです。
- **`compress(data, selectors)`**: `data` と `selectors` を同時に 1 つずつ読み、`selectors` が真のときだけ `data` の値を出します。どちらかが尽きたら終わります。
- **`sum(...)`**: 数を全部足します。

## 何をしているか

`iterable` が `'a', 'b', 'c'` を出すとします。

1. `zip(iterable)` は `('a',), ('b',), ('c',)` を出します。どれも真です。
2. `compress(repeat(1), ...)` は、選択フラグが真のたびに `repeat(1)` から `1` を出します。フラグが 3 回出たら終わるので、`1, 1, 1` が出ます。
3. `sum` で足して `3` です。

## ここがすごい

### 要素を保存しない

いちばん素直な方法は `len(list(iterable))` ですが、これは全要素をリストに保存するので、要素が 1 億個あると大量のメモリを使います。
`ilen` は要素を 1 つずつ読んで捨てるだけなので、メモリはほとんど使いません。

### Python のループを書かない

次の書き方もメモリは使いません。

```python
count = 0
for _ in iterable:
    count += 1
```

ただし 1 要素ごとに Python のバイトコードが実行されます。`ilen` は `zip`、`compress`、`repeat`、`sum` という **C で書かれた部品だけ** でできているので、数える処理がすべて C の中で行われます。

### なぜ `zip` を挟むのか

`compress(repeat(1), iterable)` と直接書くと、要素が `0` や `''` や `None` のような「偽」の値のときに数えられません。`zip` で 1 要素タプルに包むと、中身が何であっても必ず真になるので、**どんな値も 1 として数えられます**。

### 「速い」と「美しい」の両立

`sum(1 for _ in iterable)` は短くて読みやすいですが、ジェネレータ式の分だけ遅くなります。ほかにも `deque` と `enumerate` を使う速い書き方などが検討され、その中から最も簡潔なものが選ばれました。コメントの挑戦状は、その検討の結果に自信があることの表れです。

## まとめ

- `len()` が使えないものは、要素を保存せずに 1 つずつ数える。
- `zip(x)` で包むと、どんな値も「真」として扱える。
- C で書かれた部品を組み合わせると、Python のループより速い処理が 1 行で書ける。
