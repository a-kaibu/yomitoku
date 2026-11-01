---
title: 1 回だけ読むデータを、条件で 2 本の流れに振り分ける
description: more_itertools.partition は、条件を満たすものと満たさないものの 2 つのイテレータに分ける。元のデータは 1 回しか読まず、2 本のキューで相手の分を預かっておく。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [409, 448]
function: partition
difficulty: 3
tags: [イテレータ, 遅延評価, データ構造, クロージャ]
---
## ひとことで

`partition(pred, iterable)` は、データを **条件を満たさないもの** と **満たすもの** の 2 つに分けて、2 つのイテレータとして返す関数です。
`partition(is_odd, range(10))` は、`0, 2, 4, 6, 8` を出すものと `1, 3, 5, 7, 9` を出すものを返します。
元のデータが 1 回しか読めない（ジェネレータなど）場合でも、正しく 2 本に分けられます。

## コード

```python:line-numbers=409
def partition(pred, iterable):
    """
    Returns a 2-tuple of iterables derived from the input iterable.
    The first yields the items that have ``pred(item) == False``.
    The second yields the items that have ``pred(item) == True``.

        >>> is_odd = lambda x: x % 2 != 0
        >>> iterable = range(10)
        >>> even_items, odd_items = partition(is_odd, iterable)
        >>> list(even_items), list(odd_items)
        ([0, 2, 4, 6, 8], [1, 3, 5, 7, 9])

    If *pred* is None, :func:`bool` is used.

        >>> iterable = [0, 1, False, True, '', ' ']
        >>> false_items, true_items = partition(None, iterable)
        >>> list(false_items), list(true_items)
        ([0, False, ''], [1, True, ' '])

    """
    if pred is None:
        pred = bool
    iterator = iter(iterable)

    false_queue = deque()
    true_queue = deque()

    def gen(queue):
        append_false = false_queue.append
        append_true = true_queue.append
        while True:
            while queue:
                yield queue.popleft()
            for value in iterator:
                (append_true if pred(value) else append_false)(value)
                break
            else:
                return

    return gen(false_queue), gen(true_queue)
```

`deque` は `collections.deque`（両端に出し入れできるキュー）です。

## 前提知識

- **ジェネレータ関数**: `yield` を含む関数は、呼ぶとジェネレータ（値を 1 つずつ出すもの）を返します。中身は値が求められたときに少しずつ動きます。
- **関数の中の関数（クロージャ）**: `gen` は `partition` の中で定義されていて、外側の変数 `iterator`、`false_queue`、`true_queue`、`pred` を使えます。
- **`deque` の `append` と `popleft`**: 右端に追加し、左端から取り出します。先に入れたものから出てくる「キュー」として使えます。
- **`(A if 条件 else B)(value)`**: 条件で関数を選んでから、その関数を呼び出す書き方です。
- **`for ... break ... else`**: `for` が `break` せずに終わった（取り出すものがなかった）ときだけ `else` が実行されます。

## 何をしているか

奇数かどうかで分ける例で、偶数側（`F`）と奇数側（`T`）の 2 本があるとします。元データは `0, 1, 2, 3, ...` です。

### 1. 準備（429〜434 行目）

元データのイテレータを 1 つだけ作り、それぞれの側のキューを用意します。

### 2. 自分のキューにあれば出す（440〜441 行目）

`gen(queue)` の `queue` は、その側のキューです。たまっていれば先に出します。

### 3. なければ元データから 1 つ読む（442〜444 行目）

元データから 1 つ読み、条件に応じて **どちらかのキューに入れます**。自分の側に入ったとは限らないので、ループの先頭に戻って自分のキューを見直します。

例: 先に `T`（奇数側）から 1 つ求めると、

1. `T` のキューは空 → 元データから `0` を読む → 偶数なので `F` のキューへ
2. `T` のキューは空 → `1` を読む → `T` のキューへ
3. `T` のキューから `1` を出す

このとき `F` のキューには `0` が預けられています。あとで `F` から読めば、先に `0` が出てきます。

### 4. 元データが尽きたら終わる（445〜446 行目）

`for` が 1 回も回らなかった（元データが空になった）ら、`return` で終わります。

## ここがすごい

### 元データは 1 回しか読まない

素直に書くと、

```python
return filterfalse(pred, a), filter(pred, b)   # a, b は tee で複製したもの
```

のように、データを複製して 2 回条件判定することになります。この実装は、元データを 1 本のイテレータとして 2 つの側で **共有** し、読んだ値を条件判定 1 回で振り分けるので、`pred` の呼び出しは要素ごとにちょうど 1 回です。

### 相手の分は預かっておく

一方の側だけを読み進めると、もう一方の値はキューにたまっていきます。これは「片方が読んでいないぶんだけメモリを使う」という避けられないコストですが、読んだ順番は必ず保たれます。

### `for` を「1 つ読んでみる」に使う

442〜446 行目は、`for` で 1 つだけ取り出して `break` し、取り出せなければ `else` で終わる、という書き方です。`next()` と `StopIteration` の例外処理を使わずに、「読めたら続ける、読めなければ終わる」を表現しています。

### ローカル変数に取り込んで高速化

437〜438 行目で `append` メソッドを変数に入れておくことで、ループの中で毎回属性を探す手間を省いています。

## まとめ

- 1 本の入力を共有し、読んだ値をキューで振り分ければ、データを複製せずに 2 本に分けられる。
- ジェネレータとクロージャを組み合わせると、状態を共有する複数のイテレータが作れる。
- `for ... break ... else` は「1 つ読めたか」の判定に使える。
