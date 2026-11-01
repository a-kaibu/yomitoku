---
title: 区切りを「先頭に余分に入れてから 1 つ捨てる」で要素の間に挟む
description: more_itertools.intersperse は、要素の間に区切りの値を挟む。区切りと要素を交互に並べてから、先頭の 1 つを捨てるという逆転の発想で書かれている。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [980, 1003]
function: intersperse
difficulty: 2
tags: [イテレータ, イディオム, 関数型]
---
## ひとことで

`intersperse(e, iterable, n=1)` は、データの要素の **間に区切りの値 `e` を挟む** 関数です。
`intersperse('!', [1, 2, 3])` は `1, '!', 2, '!', 3` になります。`n=2` なら 2 個ごとに挟み、`1, 2, '!', 3` になります。
文字列の `'!'.join(...)` と似ていますが、文字列以外にも使えて、結果は遅延評価のイテレータです。

## コード

```python:line-numbers=980
def intersperse(e, iterable, n=1):
    """Intersperse filler element *e* among the items in *iterable*, leaving
    *n* items between each filler element.

        >>> list(intersperse('!', [1, 2, 3, 4, 5]))
        [1, '!', 2, '!', 3, '!', 4, '!', 5]

        >>> list(intersperse(None, [1, 2, 3, 4, 5], n=2))
        [1, 2, None, 3, 4, None, 5]

    """
    if n == 0:
        raise ValueError('n must be > 0')
    elif n == 1:
        # interleave(repeat(e), iterable) -> e, x_0, e, x_1, e, x_2...
        # islice(..., 1, None) -> x_0, e, x_1, e, x_2...
        return islice(interleave(repeat(e), iterable), 1, None)
    else:
        # interleave(filler, chunks) -> [e], [x_0, x_1], [e], [x_2, x_3]...
        # islice(..., 1, None) -> [x_0, x_1], [e], [x_2, x_3]...
        # flatten(...) -> x_0, x_1, e, x_2, x_3...
        filler = repeat([e])
        chunks = chunked(iterable, n)
        return flatten(islice(interleave(filler, chunks), 1, None))
```

`interleave` は同じファイルにある関数で、複数のイテレータから交互に 1 つずつ取り出し、どれかが尽きたら止まります。`chunked(iterable, n)` は n 個ずつのリストに区切る関数、`flatten` は 1 段の入れ子をほどく関数です。

## 前提知識

- **イテレータ**: 値を 1 つずつ取り出せるものです。ここで使う部品はどれもイテレータを返し、必要になるまで計算しません。
- **`repeat(e)`**: `e` を無限に出し続けます。
- **`islice(x, 1, None)`**: 先頭の 1 つを飛ばして、残りを全部出します。
- **`raise ValueError(...)`**: 不正な引数に対してエラーを出します。

## 何をしているか

### 1. n = 1 の場合（993〜996 行目）

`interleave(repeat('!'), [1, 2, 3])` は、区切りと要素を交互に出すので、

`'!', 1, '!', 2, '!', 3`

となります。要素が尽きたところで止まるので、`repeat` が無限でも問題ありません。ここから先頭の `'!'` を `islice(..., 1, None)` で 1 つ捨てると、`1, '!', 2, '!', 3` になります。

### 2. n が 2 以上の場合（997〜1003 行目）

`n = 2`、データ `[1, 2, 3]` なら、

1. `chunked` で `[1, 2], [3]` に区切る
2. 区切りも `[e]` というリストにして、交互に並べる → `['!'], [1, 2], ['!'], [3]`
3. 先頭を捨てる → `[1, 2], ['!'], [3]`
4. `flatten` でほどく → `1, 2, '!', 3`

994〜1000 行目のコメントに、各段階の結果が書かれています。

## ここがすごい

### 「間に入れる」を「交互に並べて先頭を捨てる」に言い換える

「要素の間にだけ区切りを入れる」は、素直に書くと「最初の要素かどうか」を判定するフラグが必要です。

```python
first = True
for x in iterable:
    if not first:
        yield e
    yield x
    first = False
```

`intersperse` は、**区切りを要素の前に毎回入れる**（これなら判定不要）と考え、余分に入った先頭の 1 つだけを最後に捨てています。末尾には区切りが入らないので、ちょうど「間」だけに入ります。

### 部品の組み合わせだけで書く

`interleave`、`repeat`、`islice`、`chunked`、`flatten` という、それぞれ単純な部品を組み合わせています。if 文やフラグがないので、間違いが入り込む余地が少なく、各段階をコメントで説明するのも簡単です。

### 区切りもリストにそろえる

n ≥ 2 の場合、要素の塊はリストなので、区切りも `[e]` というリストに包んでから交互に並べています。形をそろえることで、最後に `flatten` 1 回でまとめてほどけます。

## まとめ

- 「間に入れる」は「毎回前に入れて、最初の 1 つを捨てる」と言い換えられる。
- 無限のイテレータも、もう一方が尽きたら止まる部品と組み合わせれば安全に使える。
- 形（リストかどうか）をそろえると、後処理が 1 回で済む。
