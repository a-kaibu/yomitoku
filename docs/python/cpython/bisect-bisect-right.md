---
title: 半開区間で書く、バグりにくい二分探索
description: bisect.bisect_right は、ソート済みリストのどこに値を入れれば順序が保てるかを二分探索で求める。lo と hi の扱い方が二分探索のお手本になっている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/bisect.py
lines: [21, 54]
function: bisect_right
difficulty: 1
format: 2
tags: [探索, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`bisect_right` は、**ソート済みのリスト `a` に値 `x` を入れるなら何番目に入れればよいか** を返す関数です。
`bisect_right([1, 2, 2, 3], 2)` は `3` を返します。すでに同じ値があるときは、その **右側（後ろ）** の位置になります。
リストを先頭から 1 つずつ調べるのではなく、範囲を半分ずつ絞り込む「二分探索」で求めるので、100 万件でも 20 回ほどの比較で済みます。

## コード

::: code-group

```python:line-numbers=21 [日本語訳]
def bisect_right(a, x, lo=0, hi=None, *, key=None):
    """a が整列済みだと仮定して、リスト a に要素 x を挿入すべき位置を返す。

    戻り値 i は、a[:i] のすべての e が e <= x を満たし、a[i:] のすべての e が
    e > x を満たす位置である。x がすでにあれば、a.insert(i, x) は
    既存の x の右端のすぐ後ろに挿入する。

    省略可能な引数 lo（既定値 0）と hi（既定値 len(a)）は、
    探索対象となる a の範囲を定める。

    並べ替えの順序を変えるため、独自の key 関数を渡せる。
    """

    if lo < 0:
        raise ValueError('lo must be non-negative')
    if hi is None:
        hi = len(a)
    # 注意: 比較には "<" を使い、
    # list.sort() と heapq の __lt__ の考え方に合わせている。
    if key is None:
        while lo < hi:
            mid = (lo + hi) // 2
            if x < a[mid]:
                hi = mid
            else:
                lo = mid + 1
    else:
        while lo < hi:
            mid = (lo + hi) // 2
            if x < key(a[mid]):
                hi = mid
            else:
                lo = mid + 1
    return lo
```

```python:line-numbers=21 [原文]
def bisect_right(a, x, lo=0, hi=None, *, key=None):
    """Return the index where to insert item x in list a, assuming a is sorted.

    The return value i is such that all e in a[:i] have e <= x, and all e in
    a[i:] have e > x.  So if x already appears in the list, a.insert(i, x) will
    insert just after the rightmost x already there.

    Optional args lo (default 0) and hi (default len(a)) bound the
    slice of a to be searched.

    A custom key function can be supplied to customize the sort order.
    """

    if lo < 0:
        raise ValueError('lo must be non-negative')
    if hi is None:
        hi = len(a)
    # Note, the comparison uses "<" to match the
    # __lt__() logic in list.sort() and in heapq.
    if key is None:
        while lo < hi:
            mid = (lo + hi) // 2
            if x < a[mid]:
                hi = mid
            else:
                lo = mid + 1
    else:
        while lo < hi:
            mid = (lo + hi) // 2
            if x < key(a[mid]):
                hi = mid
            else:
                lo = mid + 1
    return lo
```

:::

## 前提知識

- **リストのインデックス**: `a[0]` が先頭、`a[i]` が i 番目の要素です。`a[:i]` は先頭から i 個、`a[i:]` は i 番目以降を表します。
- **`//`**: 割り算の結果を切り捨てて整数にする演算子です。`(0 + 7) // 2` は `3` です。
- **デフォルト引数**: `lo=0` のように書くと、呼び出し側が省略したときに使われる値になります。`hi=None` は「指定されなければあとで決める」という意味でよく使われます。
- **`*` のあとの引数**: `*, key=None` のように `*` より後ろの引数は、`key=len` のように名前を付けてしか渡せません。
- **`raise ValueError(...)`**: 不正な引数に対してエラーを発生させます。
- **二分探索**: ソート済みのデータの真ん中を見て、「探す値は左半分か右半分か」を判定することを繰り返す探し方です。

## 何をしているか

### 1. 範囲の準備

```python:line-numbers=34
    if lo < 0:
        raise ValueError('lo must be non-negative')
    if hi is None:
        hi = len(a)
```

探す範囲は `lo` 以上 `hi` 未満です。`hi` が省略されたらリストの長さにします。

### 2. 範囲を半分にしていく

```python:line-numbers=40
    if key is None:
        while lo < hi:
            mid = (lo + hi) // 2
            if x < a[mid]:
                hi = mid
            else:
                lo = mid + 1
```

`a = [1, 2, 2, 3, 5]`、`x = 2` で追ってみます。

| lo | hi | mid | a[mid] | `x < a[mid]`? | 次の範囲 |
| --- | --- | --- | --- | --- | --- |
| 0 | 5 | 2 | 2 | いいえ | lo = 3 |
| 3 | 5 | 4 | 5 | はい | hi = 4 |
| 3 | 4 | 3 | 3 | はい | hi = 3 |

`lo == hi == 3` になったのでループを抜け、`3` を返します。`a.insert(3, 2)` とすれば `[1, 2, 2, 2, 3, 5]` になり、順序が保たれます。

### 3. key がある場合

```python:line-numbers=47
    else:
        while lo < hi:
            mid = (lo + hi) // 2
            if x < key(a[mid]):
                hi = mid
            else:
                lo = mid + 1
```

比べる相手を `key(a[mid])` にした以外は同じ処理です。`key` の有無をループの外で 1 回だけ判定しているので、ループの中で毎回 `if key is None` を調べずに済みます。

## ここがすごい

### 「lo 以上 hi 未満」で書くと境界のミスが起きにくい

二分探索は「`hi = mid` か `hi = mid - 1` か」「ループ条件は `<` か `<=` か」で間違えやすいことで有名です。
この実装は範囲を **半開区間 `[lo, hi)`** で考えているので、

- `x < a[mid]` なら、答えは `mid` 以下 → `hi = mid`
- そうでなければ、答えは `mid + 1` 以上 → `lo = mid + 1`
- `lo == hi` になったらそこが答え

と、ルールがきれいにそろっています。範囲は毎回必ず縮むので、無限ループにもなりません。

### 比較は `<` だけ

コメント `the comparison uses "<" to match the __lt__() logic in list.sort() and in heapq.` が説明しているとおり、比較には `<` だけを使っています。`list.sort()` や `heapq` と同じく、要素が `__lt__` さえ持っていれば動くようにするためです。「`<=` を使った方が自然」と思っても、標準ライブラリ全体で要求をそろえることが優先されています。

### 「右側」の位置を返す意味

`bisect_right` は「`a[:i]` はすべて `x` 以下、`a[i:]` はすべて `x` より大きい」という `i` を返します（docstring に書かれています）。たとえば点数 `[60, 70, 80]` の区切りに対して点数がどの区間に入るかを調べる、といった使い方がそのままできます。

### 実際には C 版が使われる

このファイルの後ろで、C 言語で書かれた高速版（`_bisect`）が読み込まれて置き換わります。Python 版はアルゴリズムの仕様書のような役割も持っています。

## まとめ

- 二分探索は半開区間 `[lo, hi)` で考えると、境界の扱いがシンプルになる。
- 分岐（ここでは `key` の有無）はループの外に出すと、ループが速くなる。
- 比較を `<` だけに統一すると、利用者が実装すべきメソッドが少なくて済む。
