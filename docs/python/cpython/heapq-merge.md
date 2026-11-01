---
title: ソート済みの列を何本でも合流させる、ジェネレータ版マージ
description: heapq.merge は複数のソート済みデータを、全部をメモリに読み込まずに 1 本のソート済みの流れにまとめる。ヒープに「次を取り出す関数」を入れておく工夫がある。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/heapq.py
lines: [330, 408]
function: merge
difficulty: 3
tags: [データ構造, アルゴリズム, イテレータ, 遅延評価, 標準ライブラリ]
---
## ひとことで

`heapq.merge` は、**それぞれ小さい順に並んだ複数のデータを、1 本の小さい順のデータに合流させる** 関数です。
`list(merge([1, 3, 5], [0, 2, 4]))` は `[0, 1, 2, 3, 4, 5]` になります。
結果は 1 つずつ作られるジェネレータなので、巨大なログファイルを何本も合流させるような場合でも、メモリにはごく一部しか載りません。

## コード

```python:line-numbers=330
def merge(*iterables, key=None, reverse=False):
    '''Merge multiple sorted inputs into a single sorted output.

    Similar to sorted(itertools.chain(*iterables)) but returns a generator,
    does not pull the data into memory all at once, and assumes that each of
    the input streams is already sorted (smallest to largest).

    >>> list(merge([1,3,5,7], [0,2,4,8], [5,10,15,20], [], [25]))
    [0, 1, 2, 3, 4, 5, 5, 7, 8, 10, 15, 20, 25]

    If *key* is not None, applies a key function to each element to determine
    its sort order.

    >>> list(merge(['dog', 'horse'], ['cat', 'fish', 'kangaroo'], key=len))
    ['dog', 'cat', 'fish', 'horse', 'kangaroo']

    '''

    h = []
    h_append = h.append

    if reverse:
        _heapify = heapify_max
        _heappop = heappop_max
        _heapreplace = heapreplace_max
        direction = -1
    else:
        _heapify = heapify
        _heappop = heappop
        _heapreplace = heapreplace
        direction = 1

    if key is None:
        for order, it in enumerate(map(iter, iterables)):
            try:
                next = it.__next__
                h_append([next(), order * direction, next])
            except StopIteration:
                pass
        _heapify(h)
        while len(h) > 1:
            try:
                while True:
                    value, order, next = s = h[0]
                    yield value
                    s[0] = next()           # raises StopIteration when exhausted
                    _heapreplace(h, s)      # restore heap condition
            except StopIteration:
                _heappop(h)                 # remove empty iterator
        if h:
            # fast case when only a single iterator remains
            value, order, next = h[0]
            yield value
            yield from next.__self__
        return

    for order, it in enumerate(map(iter, iterables)):
        try:
            next = it.__next__
            value = next()
            h_append([key(value), order * direction, value, next])
        except StopIteration:
            pass
    _heapify(h)
    while len(h) > 1:
        try:
            while True:
                key_value, order, value, next = s = h[0]
                yield value
                value = next()
                s[0] = key(value)
                s[2] = value
                _heapreplace(h, s)
        except StopIteration:
            _heappop(h)
    if h:
        key_value, order, value, next = h[0]
        yield value
        yield from next.__self__
```

## 前提知識

- **ジェネレータと `yield`**: 関数の中に `yield` があると、その関数は値を 1 つずつ返す「ジェネレータ」になります。`yield value` で値を 1 つ渡して一時停止し、次の値を求められたら続きから動きます。
- **`yield from x`**: `x` が出す値を、全部そのまま自分の値として出します。
- **イテレータと `__next__`**: `iter(x)` で作ったイテレータは、`it.__next__()`（`next(it)` と同じ）で次の値を返し、なくなると `StopIteration` 例外を出します。
- **束縛メソッドと `__self__`**: `it.__next__` は「`it` に結びついたメソッド」です。`next.__self__` で元の `it` に戻れます。
- **`enumerate`**: `for i, x in enumerate(seq)` で、番号 `i` と要素 `x` を同時に取り出せます。
- **リストどうしの比較**: `[1, 0, f] < [1, 2, g]` のように、リストは先頭から順に比べられます。
- **ヒープ**: `heapq` の `heapify`（並べ替えてヒープにする）、`heapreplace`（最小値を新しい値で置き換える）、`heappop`（最小値を取り出す）を使います。

## 何をしているか

ここでは `key` がない場合（362〜384 行目）を追います。`key` がある場合（386〜408 行目）は、比較用の値を別に持つだけで流れは同じです。

### 1. 各入力の先頭をヒープに入れる（363〜369 行目）

入力 `A = [1, 3, 5]`、`B = [0, 2, 4]` とします。それぞれについて

`[先頭の値, 入力の番号, その入力の __next__]`

というリストを作ってヒープ `h` に入れます。`h = [[1, 0, A.next], [0, 1, B.next]]` を `heapify` すると、先頭は `[0, 1, B.next]` です。空の入力は `StopIteration` で飛ばします。

### 2. 最小を出して、同じ入力から補充する（370〜378 行目）

1. `h[0]` から値 `0` を取り出して `yield` する
2. その入力の `next()` で次の値 `2` を読み、`s[0] = 2` と書き換える
3. `heapreplace(h, s)` でヒープを整え直す

これを繰り返すと `0, 1, 2, 3, 4` と出てきます。ある入力が尽きると `next()` が `StopIteration` を出すので、`heappop` でその入力をヒープから外します。

### 3. 最後の 1 本は丸ごと流す（379〜383 行目）

残りが 1 本になったら、もう比べる相手がいません。その値を出したあと、`next.__self__`（元のイテレータ）を `yield from` でそのまま流します。

## ここがすごい

### ヒープに「値」と「次を取り出す関数」をセットで入れる

ヒープに入っているのは各入力の **先頭の値** だけです。最小値を出したら、その値がどの入力から来たかがすぐわかるよう、同じリストに `__next__` を入れてあります。入力が k 本なら、ヒープの大きさは常に k 以下で、1 つ出すごとの作業は O(log k) です。

### 入力の番号で「同点」を安全に解決する

同じ値が 2 本の入力にあると、リストの比較は 2 番目の要素に進みます。ここに入力の番号 `order` を入れておくことで、

- 3 番目の要素（関数）どうしを比べてエラーになることがない
- 同じ値なら先に渡した入力のものが先に出る（安定）

という 2 つを同時に実現しています。`reverse=True` のときは `order * direction` で番号の符号を反転し、逆順でも安定になるようにしています。

### リストを使い回して書き換える

ループ内では新しいリストを作らず、`s[0] = next()` で既存のリストを書き換えてから `heapreplace` しています。値 1 つごとにオブジェクトを作らないので、大量のデータでも速く動きます。

### `try` をループの外側に置く

`while True` の外で `StopIteration` を捕まえるので、例外が起きない間は `try` に入り直すコストがかかりません。入力が尽きる「まれな出来事」だけを例外で扱う、Python らしい書き方です。

## まとめ

- k 本のソート済みデータの合流は、大きさ k のヒープで効率よくできる。
- タプルやリストの比較に「番号」を挟むと、同点のときの順序と比較エラーの両方を解決できる。
- ジェネレータで書けば、全体をメモリに載せずに大量のデータを処理できる。
- 最後の 1 本になったら比較をやめて丸ごと流す、という早道も効く。
